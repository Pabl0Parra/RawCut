import { renderHook, waitFor } from '@testing-library/react-native';
import { useWatchlistData } from './useWatchlistData';
import { useContentStore } from '../stores/contentStore';
import * as tmdb from '../lib/tmdb';

// Mock TMDb API calls
jest.mock('../lib/tmdb', () => ({
  getMovieDetails: jest.fn(),
  getTVShowDetails: jest.fn(),
  getTVSeasonDetails: jest.fn(),
}));

jest.mock('../stores/contentStore', () => ({
  useContentStore: jest.fn(),
}));

describe('useWatchlistData Hook', () => {
  const mockGetNextEpisodeToWatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default store mock
    (useContentStore as unknown as jest.Mock).mockReturnValue({
      watchlist: [],
      tvProgress: [],
      getNextEpisodeToWatch: mockGetNextEpisodeToWatch
    });

    // Default API mocks
    (tmdb.getMovieDetails as jest.Mock).mockResolvedValue({ id: 101, title: 'Test Movie' });
    (tmdb.getTVShowDetails as jest.Mock).mockResolvedValue({ id: 201, name: 'Test TV', seasons: [], number_of_episodes: 10 });
    (tmdb.getTVSeasonDetails as jest.Mock).mockResolvedValue({ episodes: [{ episode_number: 1, name: 'Ep 1', overview: 'desc' }] });
  });

  it('returns empty immediately if no watchlist and no progress', async () => {
    const { result } = renderHook(() => useWatchlistData());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.allMovies).toEqual([]);
    expect(result.current.allTVShows).toEqual([]);
    expect(result.current.continueWatching).toEqual([]);
    expect(result.current.upcoming).toEqual([]);
    
    expect(tmdb.getMovieDetails).not.toHaveBeenCalled();
    expect(tmdb.getTVShowDetails).not.toHaveBeenCalled();
  });

  it('fetches movie details and organizes them correctly', async () => {
    (useContentStore as unknown as jest.Mock).mockReturnValue({
      watchlist: [{ id: 'w1', tmdb_id: 101, media_type: 'movie' }],
      tvProgress: [],
      getNextEpisodeToWatch: mockGetNextEpisodeToWatch
    });

    const { result } = renderHook(() => useWatchlistData());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(tmdb.getMovieDetails).toHaveBeenCalledWith(101);
    expect(result.current.allMovies).toHaveLength(1);
    expect(result.current.allMovies[0].internal_id).toBe('w1');
    expect(result.current.allMovies[0].title).toBe('Test Movie');
  });

  it('calculates tv show progress and organizes them properly', async () => {
    mockGetNextEpisodeToWatch.mockReturnValue({ season: 1, episode: 1 });
    
    (useContentStore as unknown as jest.Mock).mockReturnValue({
      watchlist: [{ id: 'w2', tmdb_id: 201, media_type: 'tv' }],
      tvProgress: [{ tmdb_id: 201, season_number: 1, episode_number: 0 }], // Some watched
      getNextEpisodeToWatch: mockGetNextEpisodeToWatch
    });

    const { result } = renderHook(() => useWatchlistData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(tmdb.getTVShowDetails).toHaveBeenCalledWith(201);
    expect(tmdb.getTVSeasonDetails).toHaveBeenCalledWith(201, 1);

    expect(result.current.allTVShows).toHaveLength(1);
    
    // Because progress = 1/10 = 0.1, it goes to continue watching
    expect(result.current.continueWatching).toHaveLength(1);
    expect(result.current.continueWatching[0].progress).toBe(0.1);
    expect(result.current.continueWatching[0].nextEpisode?.season).toBe(1);
    expect(result.current.continueWatching[0].nextEpisode?.episode).toBe(1);
    expect(result.current.continueWatching[0].nextEpisode?.title).toBe('Ep 1');
  });

  it('handles TV show api errors gracefully', async () => {
    (tmdb.getTVShowDetails as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    (useContentStore as unknown as jest.Mock).mockReturnValue({
      watchlist: [{ id: 'w2', tmdb_id: 201, media_type: 'tv' }],
      tvProgress: [],
      getNextEpisodeToWatch: mockGetNextEpisodeToWatch
    });

    const { result } = renderHook(() => useWatchlistData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.allTVShows).toHaveLength(0);
  });
  
  it('adds tv show to upcoming if next_episode_to_air is present', async () => {
    (tmdb.getTVShowDetails as jest.Mock).mockResolvedValueOnce({ 
      id: 201, 
      name: 'Test TV Upcoming', 
      seasons: [], 
      number_of_episodes: 10,
      next_episode_to_air: { air_date: '2050-01-01' }
    });

    (useContentStore as unknown as jest.Mock).mockReturnValue({
        watchlist: [{ id: 'w2', tmdb_id: 201, media_type: 'tv' }],
        tvProgress: [],
        getNextEpisodeToWatch: mockGetNextEpisodeToWatch
    });
  
    const { result } = renderHook(() => useWatchlistData());
  
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  
    expect(result.current.upcoming).toHaveLength(1);
    expect(result.current.upcoming[0].name).toBe('Test TV Upcoming');
  });
});
