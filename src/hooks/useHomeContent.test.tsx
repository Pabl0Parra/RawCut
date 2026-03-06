import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
    usePopularMovies,
    useMovieGenres,
    useNewReleasesContent,
    flattenPages
} from './useHomeContent';
import * as tmdb from '../lib/tmdb';

jest.mock('../lib/tmdb');

describe('useHomeContent Hooks', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        jest.clearAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    describe('usePopularMovies', () => {
        it('fetches popular movies successfully', async () => {
            const mockResponse = {
                page: 1,
                results: [{ id: 101, title: 'Pop Movie' }],
                total_pages: 5,
                total_results: 50
            };
            (tmdb.getPopularMovies as jest.Mock).mockResolvedValueOnce(mockResponse);

            const { result } = renderHook(() => usePopularMovies(), { wrapper });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(tmdb.getPopularMovies).toHaveBeenCalledWith(1);
            expect(result.current.data?.pages[0]).toEqual(mockResponse);

            // Should be formatted properly for next page params
            expect(result.current.hasNextPage).toBe(true);
        });

        it('handles the last page correctly in getNextPageParam', async () => {
            const mockResponse = {
                page: 5, // Last page
                results: [{ id: 101, title: 'Pop Movie' }],
                total_pages: 5,
                total_results: 50
            };
            (tmdb.getPopularMovies as jest.Mock).mockResolvedValueOnce(mockResponse);

            const { result } = renderHook(() => usePopularMovies(), { wrapper });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.hasNextPage).toBe(false);
        });
    });

    describe('useMovieGenres', () => {
        it('fetches movie genres successfully', async () => {
            const mockGenres = { genres: [{ id: 28, name: 'Action' }] };
            (tmdb.getMovieGenres as jest.Mock).mockResolvedValueOnce(mockGenres);

            const { result } = renderHook(() => useMovieGenres(), { wrapper });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(tmdb.getMovieGenres).toHaveBeenCalled();
            expect(result.current.data).toEqual(mockGenres.genres); // Extracted array
        });
    });

    describe('useNewReleasesContent', () => {
        it('fetches new releases for movies', async () => {
            const mockResponse = { page: 1, results: [{ id: 1 }], total_pages: 1, total_results: 1 };
            (tmdb.getNewReleases as jest.Mock).mockResolvedValueOnce(mockResponse);

            const { result } = renderHook(() => useNewReleasesContent('movie'), { wrapper });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(tmdb.getNewReleases).toHaveBeenCalledWith('movie', 1);
        });
    });

    describe('flattenPages utility', () => {
        it('flattens infinite query data into a single array', () => {
            const mockData = {
                pageParams: [1, 2],
                pages: [
                    { page: 1, total_pages: 2, total_results: 2, results: [{ id: 1 }] },
                    { page: 2, total_pages: 2, total_results: 2, results: [{ id: 2 }] }
                ]
            };

            const flat = flattenPages(mockData);
            expect(flat).toEqual([{ id: 1 }, { id: 2 }]);
        });

        it('returns empty array if data is undefined', () => {
            expect(flattenPages(undefined)).toEqual([]);
        });
    });
});
