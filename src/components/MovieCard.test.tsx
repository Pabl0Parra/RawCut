import React from 'react';
import { render } from '@testing-library/react-native';
import MovieCard from './MovieCard';
import type { Movie, TVShow } from '../lib/tmdb';

describe('MovieCard', () => {
    const mockMovie: Movie = {
        id: 123,
        title: 'The Great Movie',
        original_title: 'The Great Movie',
        overview: 'A great movie',
        poster_path: '/poster.jpg',
        backdrop_path: null,
        release_date: '2023-10-10',
        vote_average: 8.5,
        vote_count: 100,
        genre_ids: [],
        original_language: 'en',
        popularity: 100,
    };

    const mockTVShow: TVShow = {
        id: 456,
        name: 'The Great Show',
        original_name: 'The Great Show',
        overview: 'A great show',
        poster_path: '/poster.jpg',
        backdrop_path: null,
        first_air_date: '2023-10-10',
        vote_average: 8.5,
        vote_count: 100,
        genre_ids: [],
        original_language: 'en',
        popularity: 100,
    };

    it('renders the movie title and year correctly', () => {
        const { getByText } = render(<MovieCard item={mockMovie} mediaType="movie" />);
        expect(getByText('The Great Movie')).toBeTruthy();
        expect(getByText('2023')).toBeTruthy();
    });

    it('formats TV show titles correctly', () => {
        const { getByText } = render(<MovieCard item={mockTVShow} mediaType="tv" />);
        expect(getByText('The Great Show')).toBeTruthy();
    });

    it('renders without crashing on press', () => {
        const { getByText } = render(<MovieCard item={mockMovie} mediaType="movie" />);
        expect(getByText('The Great Movie')).toBeTruthy();
    });
});