import { useVoteStore } from './voteStore';
import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';

jest.mock('./authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: { id: 'test-user-id' }
    }))
  }
}));

const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockUpsert = jest.fn();

mockUpsert.mockResolvedValue({ error: null });
mockEq.mockReturnValue({
  in: mockIn,
  eq: mockEq,
});
mockIn.mockResolvedValue({
  data: [],
  error: null
});
mockSelect.mockReturnValue({
  eq: mockEq,
});

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
      upsert: mockUpsert,
    }))
  }
}));

describe('voteStore', () => {
  const initialState = useVoteStore.getState();

  beforeEach(() => {
    useVoteStore.setState(initialState, true);
    jest.clearAllMocks();

    mockUpsert.mockResolvedValue({ error: null });
    mockIn.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({ in: mockIn, eq: mockEq });
    mockSelect.mockReturnValue({ eq: mockEq });
  });

  describe('getUserVote & getCommunityScore', () => {
    it('returns undefined if no value exists', () => {
      expect(useVoteStore.getState().getUserVote(101, 'movie')).toBeUndefined();
      expect(useVoteStore.getState().getCommunityScore(101, 'movie')).toBeUndefined();
    });

    it('returns the correct value if it exists', () => {
      useVoteStore.setState({
        userVotes: { '101:movie': 80 },
        communityScores: { '101:movie': { avg: 85, count: 10 } }
      });

      expect(useVoteStore.getState().getUserVote(101, 'movie')).toBe(80);
      expect(useVoteStore.getState().getCommunityScore(101, 'movie')).toEqual({ avg: 85, count: 10 });
    });
  });

  describe('submitVote', () => {
    it('bails early if no user is signed in', async () => {
      (useAuthStore.getState as jest.Mock).mockReturnValueOnce({ user: null });
      await useVoteStore.getState().submitVote(101, 'movie', 90);
      
      expect(supabase.from).not.toHaveBeenCalled();
      expect(useVoteStore.getState().userVotes).toEqual({}); // Empty
    });

    it('optimistically updates store and calls upsert', async () => {
      // Mock fetchVotes behavior to do nothing for this test
      jest.spyOn(useVoteStore.getState(), 'fetchVotes').mockResolvedValueOnce();

      await useVoteStore.getState().submitVote(101, 'movie', 90);
      
      // Synchronously optimistically updated
      expect(useVoteStore.getState().userVotes['101:movie']).toBe(90);
      
      expect(supabase.from).toHaveBeenCalledWith('content_votes');
      expect(mockUpsert).toHaveBeenCalledWith(
        { user_id: 'test-user-id', tmdb_id: 101, media_type: 'movie', vote: 90 },
        { onConflict: 'user_id,tmdb_id,media_type' }
      );
    });

    it('handles upsert error silently (logs warning)', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockUpsert.mockResolvedValueOnce({ error: { message: 'DB Error' } });
      jest.spyOn(useVoteStore.getState(), 'fetchVotes').mockResolvedValueOnce();

      await useVoteStore.getState().submitVote(101, 'movie', 90);
      
      expect(console.warn).toHaveBeenCalledWith('[voteStore] submitVote error:', 'DB Error');
      (console.warn as jest.Mock).mockRestore();
    });
  });

  describe('fetchVotes', () => {
    it('does nothing if no tmdbIds provided', async () => {
      await useVoteStore.getState().fetchVotes([], 'movie');
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('fetches community scores and user votes', async () => {
      // Setup mock returns for community scores (first call to .in mapping)
      mockIn.mockResolvedValueOnce({
        data: [
          { tmdb_id: 101, vote: 80 },
          { tmdb_id: 101, vote: 90 }
        ],
        error: null
      });

      // Setup mock returns for user votes (second call to .in mapping)
      mockIn.mockResolvedValueOnce({
        data: [{ tmdb_id: 101, vote: 80 }],
        error: null
      });

      await useVoteStore.getState().fetchVotes([101], 'movie');

      const state = useVoteStore.getState();
      
      // Community score math: (80 + 90) / 2 = 85
      expect(state.communityScores['101:movie']).toEqual({ avg: 85, count: 2 });
      
      // User vote mapping
      expect(state.userVotes['101:movie']).toBe(80);
    });
  });

  describe('fetchAllUserVotes', () => {
    it('bails early if no user is signed in', async () => {
      (useAuthStore.getState as jest.Mock).mockReturnValueOnce({ user: null });
      await useVoteStore.getState().fetchAllUserVotes();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('fetches and populates all user votes', async () => {
      mockEq.mockResolvedValueOnce({
        data: [
          { tmdb_id: 101, media_type: 'movie', vote: 80 },
          { tmdb_id: 201, media_type: 'tv', vote: 90 }
        ],
        error: null
      });

      await useVoteStore.getState().fetchAllUserVotes();
      
      const state = useVoteStore.getState();
      expect(state.userVotes['101:movie']).toBe(80);
      expect(state.userVotes['201:tv']).toBe(90);
    });
  });
});
