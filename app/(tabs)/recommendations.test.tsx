import React from 'react';
import { render } from '@testing-library/react-native';
import RecommendationsScreen from './recommendations';
import { useRecommendationStore } from '../../src/stores/recommendationStore';
import { useAuthStore } from '../../src/stores/authStore';

jest.mock('../../src/stores/recommendationStore', () => ({
    useRecommendationStore: jest.fn(),
}));

jest.mock('../../src/stores/authStore', () => ({
    useAuthStore: jest.fn(),
}));

// Also mock the heavy utility that triggers async TMDb calls
jest.mock('../../src/utils/recommendations.utils', () => ({
    fetchTmdbDataBatch: jest.fn().mockResolvedValue({}),
}));

describe('RecommendationsScreen Integration', () => {
    const mockFetchRecommendations = jest.fn();
    const mockUser = { id: 'user-1', email: 'test@test.com' };

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock auth store with a logged-in user
        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            user: mockUser,
        });

        // Also mock the static getState used by useFocusEffect
        (useRecommendationStore as unknown as jest.Mock).mockReturnValue({
            sent: [],
            received: [],
            isLoading: false,
            fetchRecommendations: mockFetchRecommendations,
            addComment: jest.fn(),
            markAsRead: jest.fn(),
            markCommentsAsRead: jest.fn(),
            deleteComment: jest.fn(),
            deleteRecommendation: jest.fn(),
        });
    });

    it('displays loading state correctly', () => {
        (useRecommendationStore as unknown as jest.Mock).mockReturnValue({
            sent: [],
            received: [],
            isLoading: true,
            fetchRecommendations: mockFetchRecommendations,
            addComment: jest.fn(),
            markAsRead: jest.fn(),
            markCommentsAsRead: jest.fn(),
            deleteComment: jest.fn(),
            deleteRecommendation: jest.fn(),
        });

        const { queryByText } = render(<RecommendationsScreen />);
        expect(queryByText('recommendations.emptyReceivedTitle')).toBeNull();
    });

    it('displays empty state when no recommendations are found', () => {
        const { getByText } = render(<RecommendationsScreen />);
        // i18n mock returns keys, so match the key
        expect(getByText('recommendations.emptyReceivedTitle')).toBeTruthy();
    });

    it('renders content area when data is present', () => {
        (useRecommendationStore as unknown as jest.Mock).mockReturnValue({
            sent: [],
            received: [
                {
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
                }
            ],
            isLoading: false,
            fetchRecommendations: mockFetchRecommendations,
            addComment: jest.fn(),
            markAsRead: jest.fn(),
            markCommentsAsRead: jest.fn(),
            deleteComment: jest.fn(),
            deleteRecommendation: jest.fn(),
        });

        const { getByText } = render(<RecommendationsScreen />);
        // Tab headers should be visible when authenticated with data
        expect(getByText(/recommendations.received/)).toBeTruthy();
    });
});