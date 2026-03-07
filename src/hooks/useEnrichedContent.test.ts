import { renderHook, waitFor } from '@testing-library/react-native';
import { useEnrichedContent } from './useEnrichedContent';
import * as tmdb from '../lib/tmdb';

// Mock TMDb API calls
jest.mock('../lib/tmdb', () => ({
  getMovieDetails: jest.fn(),
  getTVShowDetails: jest.fn(),
}));

describe('useEnrichedContent Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (tmdb.getMovieDetails as jest.Mock).mockResolvedValue({
      title: 'Mock Movie',
      poster_path: '/mock-movie.jpg',
      vote_average: 8.5
    });
    
    (tmdb.getTVShowDetails as jest.Mock).mockResolvedValue({
      name: 'Mock TV Show',
      poster_path: '/mock-tv.jpg',
      vote_average: 9
    });
    
    // Suppress console.warn and console.error for missing items warnings
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.warn as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });

  it('handles empty input properly', async () => {
    const { result } = renderHook(() => useEnrichedContent([]));
    
    // Should immediately stop loading and stay empty
    expect(result.current.isLoading).toBe(false);
    expect(result.current.enrichedItems).toEqual([]);
    expect(tmdb.getMovieDetails).not.toHaveBeenCalled();
    expect(tmdb.getTVShowDetails).not.toHaveBeenCalled();
  });

  it('fetches details for movies and tv shows', async () => {
    const rawItems = [
      { id: '1', tmdb_id: 101, media_type: 'movie' as const },
      { id: '2', tmdb_id: 102, media_type: 'tv' as const }
    ];

    const { result } = renderHook(() => useEnrichedContent(rawItems));
    
    // Initially should be loading
    expect(result.current.isLoading).toBe(true);

    // Wait for async fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const items = result.current.enrichedItems;
    expect(items).toHaveLength(2);
    
    expect(items[0]).toEqual({
      id: '1',
      tmdb_id: 101,
      media_type: 'movie',
      title: 'Mock Movie',
      poster_path: '/mock-movie.jpg',
      vote_average: 8.5
    });

    expect(items[1]).toEqual({
      id: '2',
      tmdb_id: 102,
      media_type: 'tv',
      title: 'Mock TV Show',
      poster_path: '/mock-tv.jpg',
      vote_average: 9
    });

    expect(tmdb.getMovieDetails).toHaveBeenCalledWith(101);
    expect(tmdb.getTVShowDetails).toHaveBeenCalledWith(102);
  });

  it('provides a fallback for items where API fetch fails', async () => {
    // Force the movie fetch to fail
    (tmdb.getMovieDetails as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    const rawItems = [{ id: '1', tmdb_id: 500, media_type: 'movie' as const }];
    
    const { result } = renderHook(() => useEnrichedContent(rawItems));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const items = result.current.enrichedItems;
    expect(items).toHaveLength(1);
    
    // Fallback data structure
    expect(items[0]).toEqual({
      id: '1',
      tmdb_id: 500,
      media_type: 'movie',
      title: 'Sin título',
      poster_path: null,
      vote_average: 0
    });
  });

  it('is stable and does not refetch if input array reference changes but ids do not', async () => {
    let rawItems = [{ id: '1', tmdb_id: 101, media_type: 'movie' as const }];
    
    const { result, rerender } = renderHook(
      ({ items }: { items: typeof rawItems }) => useEnrichedContent(items),
      { initialProps: { items: rawItems } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(tmdb.getMovieDetails).toHaveBeenCalledTimes(1);

    // Pass a brand new array reference with the exact same data
    rawItems = [{ id: '1', tmdb_id: 101, media_type: 'movie' as const }];
    rerender({ items: rawItems });
    
    // Should NOT trigger another fetch
    expect(tmdb.getMovieDetails).toHaveBeenCalledTimes(1);
  });
});
