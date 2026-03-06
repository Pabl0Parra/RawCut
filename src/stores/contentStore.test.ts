import { useContentStore } from './contentStore';
import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';

// Mock AuthStore
jest.mock('./authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: { id: 'test-user-id' }
    }))
  }
}));

// Mock Supabase Builder
const mockSingle = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockInsert = jest.fn();
const mockDelete = jest.fn();
const mockUpsert = jest.fn();

mockEq.mockReturnValue({
  order: mockOrder,
  delete: mockDelete,
  eq: mockEq,
});
mockSelect.mockReturnValue({
  eq: mockEq,
  single: mockSingle,
});
mockOrder.mockReturnValue({
  data: [],
  error: null
});
mockInsert.mockReturnValue({
  select: mockSelect,
});
mockDelete.mockReturnValue({
  eq: mockEq,
});

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
      upsert: mockUpsert
    }))
  }
}));

describe('ContentStore', () => {
  const initialState = useContentStore.getState();

  beforeEach(() => {
    // Reset store state
    useContentStore.setState(initialState, true);
    
    // Reset all mock functions
    jest.clearAllMocks();
    
    // Default happy path for builder responses
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({ order: mockOrder, delete: mockDelete, eq: mockEq });
    mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockSingle.mockResolvedValue({ data: {}, error: null });
  });

  describe('fetchUserContent', () => {
    it('sets loading to true immediately', async () => {
      const promise = useContentStore.getState().fetchUserContent();
      expect(useContentStore.getState().isLoading).toBe(true);
      await promise;
    });

    it('bails early if no user is signed in', async () => {
      (useAuthStore.getState as jest.Mock).mockReturnValueOnce({ user: null });
      await useContentStore.getState().fetchUserContent();
      
      expect(supabase.from).not.toHaveBeenCalled();
      expect(useContentStore.getState().contentLoaded).toBe(false);
    });

    it('successfully fetches and categorizes favorite and watchlist data', async () => {
      const mockData = [
        { id: '1', list_type: 'favorite', tmdb_id: 101, media_type: 'movie' },
        { id: '2', list_type: 'watchlist', tmdb_id: 102, media_type: 'tv' }
      ];
      
      mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

      await useContentStore.getState().fetchUserContent();

      expect(supabase.from).toHaveBeenCalledWith('user_content');
      
      const state = useContentStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.contentLoaded).toBe(true);
      expect(state.error).toBeNull();
      
      expect(state.favorites).toHaveLength(1);
      expect(state.favorites[0].tmdb_id).toBe(101);
      
      expect(state.watchlist).toHaveLength(1);
      expect(state.watchlist[0].tmdb_id).toBe(102);
    });

    it('handles errors gracefully during fetch', async () => {
      const dbError = new Error('Database disconnected');
      mockOrder.mockResolvedValueOnce({ data: null, error: dbError });

      await useContentStore.getState().fetchUserContent();

      const state = useContentStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.contentLoaded).toBe(true); // Still marks as loaded to unblock UI
      expect(state.error).toBe('Error al cargar contenido');
    });
  });

  describe('addToFavorites', () => {
    it('bails early if no user is signed in', async () => {
      (useAuthStore.getState as jest.Mock).mockReturnValueOnce({ user: null });
      const result = await useContentStore.getState().addToFavorites(101, 'movie');
      expect(result).toBe(false);
    });

    it('returns true and skips db if already in favorites', async () => {
      useContentStore.setState({ favorites: [{ tmdb_id: 101, media_type: 'movie' } as any] });
      const result = await useContentStore.getState().addToFavorites(101, 'movie');
      expect(result).toBe(true);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('adds to favorites successfully', async () => {
      const insertedData = { id: 'new', tmdb_id: 102, media_type: 'tv' };
      mockSingle.mockResolvedValueOnce({ data: insertedData, error: null });

      const result = await useContentStore.getState().addToFavorites(102, 'tv');
      expect(result).toBe(true);
      expect(useContentStore.getState().favorites[0]).toEqual(insertedData);
    });

    it('handles unique constraint violation gracefully', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: '23505' } });
      const result = await useContentStore.getState().addToFavorites(102, 'tv');
      expect(result).toBe(true); // Should silently succeed
    });

    it('handles general errors gracefully', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: new Error('Db Error') });
      const result = await useContentStore.getState().addToFavorites(102, 'tv');
      expect(result).toBe(false);
    });
  });

  describe('removeFromFavorites', () => {
    it('removes from favorites successfully', async () => {
      useContentStore.setState({ favorites: [{ tmdb_id: 101, media_type: 'movie' } as any] });
      mockDelete.mockReturnValueOnce({ eq: mockEq });

      const result = await useContentStore.getState().removeFromFavorites(101, 'movie');
      expect(result).toBe(true);
      expect(useContentStore.getState().favorites).toHaveLength(0);
    });
  });

  describe('addToWatchlist & removeFromWatchlist', () => {
    it('adds to watchlist successfully', async () => {
      const insertedData = { id: 'new-wl', tmdb_id: 103, media_type: 'movie' };
      mockSingle.mockResolvedValueOnce({ data: insertedData, error: null });

      const result = await useContentStore.getState().addToWatchlist(103, 'movie');
      expect(result).toBe(true);
      expect(useContentStore.getState().watchlist[0]).toEqual(insertedData);
    });

    it('removes from watchlist successfully', async () => {
      useContentStore.setState({ watchlist: [{ tmdb_id: 103, media_type: 'movie' } as any] });
      mockDelete.mockReturnValueOnce({ eq: mockEq });

      const result = await useContentStore.getState().removeFromWatchlist(103, 'movie');
      expect(result).toBe(true);
      expect(useContentStore.getState().watchlist).toHaveLength(0);
    });
  });

  describe('toggleWatched', () => {
    it('adds to tvProgress if not watched', async () => {
      const insertedData = { id: 'progress1', tmdb_id: 200, season_number: 0, episode_number: 0 };
      mockSingle.mockResolvedValueOnce({ data: insertedData, error: null });

      const result = await useContentStore.getState().toggleWatched(200, 'movie');
      expect(result).toBe(true);
      expect(useContentStore.getState().tvProgress).toContainEqual(insertedData);
    });

    it('removes from tvProgress if already watched', async () => {
      useContentStore.setState({ tvProgress: [{ tmdb_id: 200, season_number: 0, episode_number: 0 } as any] });
      mockDelete.mockReturnValueOnce({ eq: mockEq });

      const result = await useContentStore.getState().toggleWatched(200, 'movie');
      expect(result).toBe(true);
      expect(useContentStore.getState().tvProgress).toHaveLength(0);
    });
  });

  describe('getShowProgress & getNextEpisodeToWatch', () => {
    beforeEach(() => {
      useContentStore.setState({
        tvProgress: [
          { tmdb_id: 300, season_number: 1, episode_number: 1 },
          { tmdb_id: 300, season_number: 1, episode_number: 2 }
        ] as any
      });
    });

    it('getShowProgress returns correct watched count', () => {
      const progress = useContentStore.getState().getShowProgress(300);
      expect(progress).toEqual({ watched: 2, total: 0 }); // total is correctly 0 per current logic
    });

    it('getNextEpisodeToWatch returns next episode in same season', () => {
      const seasons = [{ season_number: 1, episode_count: 10 }];
      const nextEp = useContentStore.getState().getNextEpisodeToWatch(300, seasons);
      expect(nextEp).toEqual({ season: 1, episode: 3 });
    });

    it('getNextEpisodeToWatch returns first episode of next season', () => {
      const seasons = [
        { season_number: 1, episode_count: 2 },
        { season_number: 2, episode_count: 10 }
      ];
      const nextEp = useContentStore.getState().getNextEpisodeToWatch(300, seasons);
      expect(nextEp).toEqual({ season: 2, episode: 1 });
    });
  });

  describe('isFavorite & isInWatchlist checks', () => {
    beforeEach(() => {
      useContentStore.setState({
        favorites: [{ id: '1', list_type: 'favorite', tmdb_id: 101, media_type: 'movie' } as any],
        watchlist: [{ id: '2', list_type: 'watchlist', tmdb_id: 102, media_type: 'tv' } as any]
      });
    });

    it('isFavorite returns true for existing items', () => {
      expect(useContentStore.getState().isFavorite(101, 'movie')).toBe(true);
      expect(useContentStore.getState().isFavorite(102, 'tv')).toBe(false);
    });

    it('isInWatchlist returns true for existing items', () => {
      expect(useContentStore.getState().isInWatchlist(102, 'tv')).toBe(true);
      expect(useContentStore.getState().isInWatchlist(101, 'movie')).toBe(false);
    });
  });
  
  describe('clearContent', () => {
    it('resets all content data and flags', () => {
      useContentStore.setState({
        favorites: [{ id: '1' } as any],
        watchlist: [{ id: '2' } as any],
        tvProgress: [{ id: '3' } as any],
        contentLoaded: true,
        isLoading: true
      });

      useContentStore.getState().clearContent();

      const state = useContentStore.getState();
      expect(state.favorites).toEqual([]);
      expect(state.watchlist).toEqual([]);
      expect(state.tvProgress).toEqual([]);
      expect(state.contentLoaded).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

});
