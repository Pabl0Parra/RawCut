import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';
import { resetAllStores } from '../../__mocks__/zustand';

jest.mock('./contentStore', () => ({
    useContentStore: { getState: () => ({ clearContent: jest.fn() }) },
}));
jest.mock('./recommendationStore', () => ({
    useRecommendationStore: { getState: () => ({ clearRecommendations: jest.fn() }) },
}));
jest.mock('./socialStore', () => ({
    useSocialStore: { getState: () => ({ clearSocial: jest.fn() }) },
}));

const mockSingle = jest.fn();
const mockMaybeSingle = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockNeq = jest.fn();
const mockUpdate = jest.fn();

mockUpdate.mockReturnValue({
    eq: mockEq,
});
mockEq.mockReturnValue({
    maybeSingle: mockMaybeSingle,
    select: mockSelect,
});
mockNeq.mockReturnValue({
    maybeSingle: mockMaybeSingle,
});
mockSelect.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
});

jest.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: jest.fn(),
            signUp: jest.fn(),
            signOut: jest.fn(),
        },
        rpc: jest.fn(),
        from: jest.fn(() => ({
            select: mockSelect,
            update: mockUpdate,
        })),
    }
}));


describe('authStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetAllStores(); // Reset Zustand state
        jest.spyOn(useAuthStore.getState(), 'fetchProfile').mockResolvedValue(undefined as any);
    });

    describe('signIn', () => {
        it('should sign in with email directly when input contains @', async () => {
            const mockUser = { id: 'user-1' };
            const mockSession = { access_token: 'token' };

            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: mockUser, session: mockSession },
                error: null,
            });

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
            
            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: [{ email: 'resolved@example.com' }],
                error: null,
            });

            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: mockUser, session: {} },
                error: null,
            });

            const result = await useAuthStore.getState().signIn('myusername', 'password123');

            expect(result).toBe(true);
            expect(supabase.rpc).toHaveBeenCalledWith('get_email_by_username', { p_username: 'myusername' });
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'resolved@example.com',
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
            expect(state.error).toBe('auth.errorInvalidCredentials');
        });
    });

    describe('signUp', () => {
        it('fails if username exists', async () => {
            mockMaybeSingle.mockResolvedValueOnce({ data: { username: 'testuser' }, error: null });

            const result = await useAuthStore.getState().signUp('test@test.com', 'pass', 'testuser');
            expect(result).toBe(false);
            expect(useAuthStore.getState().error).toBe('auth.errorUsernameExists');
        });

        it('signs up and fetches profile successfully', async () => {
            mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
            
            const mockUser = { id: 'user-1' };
            const mockSession = { access_token: '123' };
            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: { user: mockUser, session: mockSession },
                error: null
            });

            const result = await useAuthStore.getState().signUp('test@test.com', 'pass', 'testuser');
            expect(result).toBe(true);
            expect(useAuthStore.getState().user).toEqual(mockUser);
        });

        it('handles email existing error specifically', async () => {
            mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
            
            (supabase.auth.signUp as jest.Mock).mockResolvedValue({
                data: { user: null, session: null },
                error: new Error('User already registered')
            });

            const result = await useAuthStore.getState().signUp('test@test.com', 'pass', 'testuser');
            expect(result).toBe(false);
            expect(useAuthStore.getState().error).toBe('auth.errorEmailExists');
        });
    });

    describe('signOut', () => {
        it('should clear user state and call supabase signout', async () => {
            useAuthStore.setState({
                user: { id: 'user-1' } as any,
                session: { access_token: '123' } as any,
                profile: { username: 'test' } as any,
            });

            await useAuthStore.getState().signOut();

            expect(supabase.auth.signOut).toHaveBeenCalled();
            
            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.session).toBeNull();
            expect(state.profile).toBeNull();
        });
    });

    describe('updateUsername', () => {
        it('fails if not logged in', async () => {
            useAuthStore.setState({ user: null, profile: null });
            const result = await useAuthStore.getState().updateUsername('newuser');
            expect(result).toBe(false);
        });

        it('updates successfully', async () => {
            useAuthStore.setState({ user: { id: 'u1' } as any, profile: { username: 'olduser' } as any });
            
            // First check existing username returns null
            mockSelect.mockReturnValueOnce({ eq: jest.fn().mockReturnValue({ neq: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null }) }) }) });
            // Then update returns rows
            mockSelect.mockResolvedValueOnce({ data: [{ id: 'u1' }], error: null });

            const result = await useAuthStore.getState().updateUsername('newuser');
            expect(result).toBe(true);
            expect(useAuthStore.getState().profile?.username).toBe('newuser');
        });
    });

    describe('deleteAccount', () => {
        it('fails if not logged in', async () => {
            useAuthStore.setState({ user: null });
            const result = await useAuthStore.getState().deleteAccount();
            expect(result).toBe(false);
        });

        it('calls rpc and clears state successfully', async () => {
            useAuthStore.setState({ user: { id: 'u1' } as any, profile: { username: 'olduser' } as any });
            (supabase.rpc as jest.Mock).mockResolvedValueOnce({ error: null });

            const result = await useAuthStore.getState().deleteAccount();
            expect(result).toBe(true);
            expect(supabase.rpc).toHaveBeenCalledWith('delete_user_account');
            expect(useAuthStore.getState().user).toBeNull();
        });
    });
});
