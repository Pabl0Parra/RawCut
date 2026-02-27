import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';
import { resetAllStores } from '../../__mocks__/zustand';

describe('authStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetAllStores(); // Reset Zustand state
    });

    describe('signIn', () => {
        it('should sign in with email directly when input contains @', async () => {
            const mockUser = { id: 'user-1' };
            const mockSession = { access_token: 'token' };

            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: mockUser, session: mockSession },
                error: null,
            });

            // Mock fetchProfile to avoid errors in the chained call
            jest.spyOn(useAuthStore.getState(), 'fetchProfile').mockResolvedValue();

            const result = await useAuthStore.getState().signIn('test@example.com', 'password123');

            expect(result).toBe(true);
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
            
            const state = useAuthStore.getState();
            expect(state.user).toEqual(mockUser);
            expect(state.session).toEqual(mockSession);
            expect(state.isLoading).toBe(false);
            expect(state.error).toBeNull();
        });

        it('should look up email by username when input does not contain @', async () => {
            const mockUser = { id: 'user-2' };
            
            // Mock RPC response
            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: [{ email: 'resolved@example.com' }],
                error: null,
            });

            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: mockUser, session: {} },
                error: null,
            });

            jest.spyOn(useAuthStore.getState(), 'fetchProfile').mockResolvedValue();

            const result = await useAuthStore.getState().signIn('myusername', 'password123');

            expect(result).toBe(true);
            expect(supabase.rpc).toHaveBeenCalledWith('get_email_by_username', { p_username: 'myusername' });
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'resolved@example.com', // Uses the resolved email
                password: 'password123',
            });
        });

        it('should handle signIn errors gracefully', async () => {
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: null, session: null },
                error: new Error('Invalid login credentials'),
            });

            const result = await useAuthStore.getState().signIn('test@example.com', 'wrongpassword');

            expect(result).toBe(false);
            
            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.error).toBe('Credenciales inválidas');
            expect(state.isLoading).toBe(false);
        });
    });

    describe('signOut', () => {
        it('should clear user state and call supabase signout', async () => {
            // Set initial state
            useAuthStore.setState({
                user: { id: 'user-1' } as any,
                session: { access_token: '123' } as any,
                profile: { username: 'test' } as any,
            });

            // Mock stores required by signOut 
            jest.mock('./contentStore', () => ({
                useContentStore: { getState: () => ({ clearContent: jest.fn() }) }
            }), { virtual: true });
            jest.mock('./recommendationStore', () => ({
                useRecommendationStore: { getState: () => ({ clearRecommendations: jest.fn() }) }
            }), { virtual: true });

            await useAuthStore.getState().signOut();

            expect(supabase.auth.signOut).toHaveBeenCalled();
            
            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.session).toBeNull();
            expect(state.profile).toBeNull();
        });
    });
});
