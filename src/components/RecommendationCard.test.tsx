import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RecommendationCard from '../../src/components/RecommendationCard';

const mockProfile = { id: 'p1', user_id: 'user-1', username: 'sender', avatar_url: null, points: 10, display_name: null, created_at: '2023-01-01T00:00:00.000Z' };
const mockReceiver = { id: 'p2', user_id: 'user-2', username: 'receiver', avatar_url: null, points: 5, display_name: null, created_at: '2023-01-01T00:00:00.000Z' };

const mockItem = {
    id: 'rec-1',
    sender_id: 'user-1',
    receiver_id: 'user-2',
    tmdb_id: 123,
    media_type: 'movie' as const,
    message: 'Great movie!',
    is_read: false,
    created_at: '2023-01-01T00:00:00.000Z',
    sender_deleted: false,
    receiver_deleted: false,
    comments: [],
    rating: null,
    sender: mockProfile,
    receiver: mockReceiver,
};

const mockTmdbData = {
    title: 'Inception',
    poster: '/poster.jpg',
    overview: 'A mind-bending thriller',
};

const baseProps = {
    item: mockItem,
    tmdbData: mockTmdbData,
    isExpanded: false,
    isReceived: true,
    currentUserId: 'user-2',
    onToggleExpand: jest.fn(),
    onAddComment: jest.fn().mockResolvedValue(true),
    onMarkCommentsRead: jest.fn(),
    onDeleteComment: jest.fn().mockResolvedValue(true),
    onDeleteRecommendation: jest.fn().mockResolvedValue(true),
};

describe('RecommendationCard', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should render the title and sender', () => {
        const { getByText } = render(<RecommendationCard {...baseProps} />);
        expect(getByText('Inception')).toBeTruthy();
    });

    it('should display the NEW badge when isReceived and is_read is false', () => {
        const { getByText, queryByText, rerender } = render(
            <RecommendationCard {...baseProps} />
        );
        expect(getByText('NEW')).toBeTruthy();

        rerender(
            <RecommendationCard {...baseProps} item={{ ...mockItem, is_read: true }} />
        );
        expect(queryByText('NEW')).toBeNull();
    });

    it('should call onToggleExpand when card header is pressed', () => {
        const mockToggle = jest.fn();
        const { getByText } = render(
            <RecommendationCard {...baseProps} onToggleExpand={mockToggle} />
        );
        fireEvent.press(getByText('Inception'));
        expect(mockToggle).toHaveBeenCalledWith('rec-1');
    });

    it('should render the message when provided', () => {
        const { getByText } = render(<RecommendationCard {...baseProps} />);
        expect(getByText('"Great movie!"')).toBeTruthy();
    });
});