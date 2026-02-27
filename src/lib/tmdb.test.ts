import { getImageUrl, isValidTmdbId, getTmdbBaseUrl } from './tmdb';


describe('TMDB Integration Utilities', () => {
    describe('getImageUrl', () => {
        it('should return null when path is missing', () => {
            expect(getImageUrl(null)).toBeNull();
            expect(getImageUrl('')).toBeNull();
            expect(getImageUrl(undefined)).toBeNull();
        });

        it('should construct a valid TMDB image URL with default width', () => {
            const url = getImageUrl('/sample-path.jpg');
            expect(url).toBe('https://image.tmdb.org/t/p/w500/sample-path.jpg');
        });

        it('should construct a valid TMDB image URL with a specific width', () => {
            const url = getImageUrl('/sample-path.jpg', 'w200');
            expect(url).toBe('https://image.tmdb.org/t/p/w200/sample-path.jpg');
        });

        it('should handle paths with or without leading slash', () => {
            const url1 = getImageUrl('/path.jpg');
            const url2 = getImageUrl('path.jpg');
            expect(url1).toBe(url2);
        });
    });

    describe('isValidTmdbId', () => {
        it('should return true for valid numeric IDs', () => {
            expect(isValidTmdbId(123)).toBe(true);
            expect(isValidTmdbId(1)).toBe(true);
            expect(isValidTmdbId('456')).toBe(true);
        });

        it('should return false for invalid IDs', () => {
            expect(isValidTmdbId(0)).toBe(false);
            expect(isValidTmdbId(-1)).toBe(false);
            expect(isValidTmdbId(null)).toBe(false);
            expect(isValidTmdbId(undefined)).toBe(false);
            expect(isValidTmdbId('abc')).toBe(false);
        });
    });

    describe('getTmdbBaseUrl', () => {
        it('should return the correct base URL', () => {
            expect(getTmdbBaseUrl()).toBe('https://api.themoviedb.org/3');
        });
    });
});
