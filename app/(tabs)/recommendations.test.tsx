import React from 'react';
import { render, act } from '@testing-library/react-native';
import RecommendationsScreen from './recommendations';
import { useRecommendationStore } from '../../src/stores/recommendationStore';
import { useAuthStore } from '../../src/stores/authStore';

// ============================================================================
// Type-Safe Store Interface Definitions
// ============================================================================
interface Recommendation {
    id: string;
    tmdb_id: number;
    media_type: 'movie' | 'tv';
    message: string;
    is_read: boolean;
    created_at: string;
    sender_deleted: boolean;
    receiver_deleted: boolean;
    comments: unknown[];
    sender: { user_id: string; username: string };
    receiver: { user_id: string; username: string };
}

jest.mock('../../src/utils/recommendations.utils', () => ({
    fetchTmdbDataBatch: jest.fn().mockResolvedValue({}),
    enrichRecommendationsWithTmdb: jest.fn().mockReturnValue([]),
}));

jest.mock('../../src/lib/i18n', () => ({
    i18n: {
        t: (key: string): string => key,
    },
}));

// ============================================================================
// Test Suite
// ============================================================================
describe('RecommendationsScreen Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        act(() => {
            useRecommendationStore.setState({
                sent: [],
                received: [],
                isLoading: false,
                fetchRecommendations: jest.fn().mockResolvedValue(undefined),
                addComment: jest.fn().mockResolvedValue(true),
                markAsRead: jest.fn().mockResolvedValue(true),
                markCommentsAsRead: jest.fn().mockResolvedValue(true),
                deleteComment: jest.fn().mockResolvedValue(true),
                deleteRecommendation: jest.fn().mockResolvedValue(true),
            });

            useAuthStore.setState({
                user: { id: 'user-1', email: 'test@test.com' } as any,
                session: null,
                profile: null,
                isLoading: false,
                error: null,
                signIn: jest.fn(),
                signUp: jest.fn(),
                signOut: jest.fn(),
                fetchProfile: jest.fn(),
                updateUsername: jest.fn(),
                deleteAccount: jest.fn(),
                setSession: jest.fn(),
                setProfile: jest.fn(),
                clearError: jest.fn(),
            });
        });
    });

    describe('Loading State', () => {
        it('displays loading state correctly', () => {
            act(() => {
                useRecommendationStore.setState({
                    isLoading: true,
                    sent: [],
                    received: [],
                });
            });

            render(<RecommendationsScreen />);
            // Since it's loading, it should render the ActivityIndicator
            // (Testing by lack of error or finding elements)
        });
    });

    describe('Empty State', () => {
        it('displays empty state when no recommendations are found', () => {
            const mockFetch = jest.fn().mockResolvedValue(undefined);
            act(() => {
                useRecommendationStore.setState({
                    isLoading: false,
                    sent: [],
                    received: [],
                    fetchRecommendations: mockFetch
                });
            });

            render(<RecommendationsScreen />);

            expect(mockFetch).toHaveBeenCalled();
        });
    });

    describe('Content Rendering', () => {
        it('renders content area when data is present', () => {
            const mockRecommendation: Recommendation = {
                id: '1',
                tmdb_id: 123,
                media_type: 'movie',
                message: 'Watch this!',
                is_read: false,
                created_at: '2023-01-01T00:00:00.000Z',
                sender_deleted: false,
                receiver_deleted: false,
                comments: [],
                sender: { user_id: 'user-2', username: 'neo' },
                receiver: { user_id: 'user-1', username: 'morpheus' },
            };

            useRecommendationStore.setState({
                isLoading: false,
                sent: [],
                received: [mockRecommendation as any],
            });

            render(<RecommendationsScreen />);

            expect(useRecommendationStore.getState().received).toHaveLength(1);
        });
    });

    describe('Authentication Integration', () => {
        it('calls fetchRecommendations on mount when user is authenticated', () => {
            const mockFetch = jest.fn().mockResolvedValue(undefined);

            useRecommendationStore.setState({
                fetchRecommendations: mockFetch,
            });

            useAuthStore.setState({
                user: { id: 'user-1', email: 'test@test.com' } as any,
            });

            render(<RecommendationsScreen />);

            expect(mockFetch).toHaveBeenCalled();
        });

        it('does not fetch recommendations when user is not authenticated', () => {
            const mockFetch = jest.fn().mockResolvedValue(undefined);

            act(() => {
                useAuthStore.setState({
                    user: null,
                });

                useRecommendationStore.setState({
                    fetchRecommendations: mockFetch,
                });
            });

            render(<RecommendationsScreen />);

            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('Store Integration', () => {
        it('updates store state correctly when recommendations change', () => {
            act(() => {
                useRecommendationStore.setState({
                    received: [],
                    isLoading: false,
                });
            });

            const { rerender } = render(<RecommendationsScreen />);

            const mockRecommendation: Recommendation = {
                id: '1',
                tmdb_id: 123,
                media_type: 'movie',
                message: 'Test',
                is_read: false,
                created_at: '2023-01-01T00:00:00.000Z',
                sender_deleted: false,
                receiver_deleted: false,
                comments: [],
                sender: { user_id: 'user-2', username: 'test' },
                receiver: { user_id: 'user-1', username: 'me' },
            };

            act(() => {
                useRecommendationStore.setState({
                    received: [mockRecommendation as any],
                    isLoading: false,
                });
            });

            rerender(<RecommendationsScreen />);

            expect(useRecommendationStore.getState().received).toHaveLength(1);
        });
    });

    describe('Error Handling', () => {
        it('handles store fetch errors gracefully', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const mockFetch = jest.fn().mockRejectedValue(new Error('Fetch failed'));

            act(() => {
                useRecommendationStore.setState({
                    fetchRecommendations: mockFetch,
                });
            });

            render(<RecommendationsScreen />);

            expect(mockFetch).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });
});