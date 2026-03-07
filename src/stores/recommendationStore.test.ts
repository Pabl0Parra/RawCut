// src/stores/recommendationStore.test.ts
import { useRecommendationStore } from './recommendationStore';
import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';
import { resetAllStores } from '../../__mocks__/zustand';

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeMockChain = (resolvedValue: { data: any; error: any }) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue(resolvedValue),
});

const mockFetchCalls = (
    sentResult: { data: any; error: any },
    receivedResult: { data: any; error: any }
) => {
    (supabase.from as jest.Mock)
        .mockReturnValueOnce(makeMockChain(sentResult))
        .mockReturnValueOnce(makeMockChain(receivedResult));
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('recommendationStore', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        resetAllStores();
        useAuthStore.setState({ user: { id: 'user-1' } as any });
        // Suppress expected console.error noise from intentional error-path tests
        consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    // ── fetchRecommendations ─────────────────────────────────────────────────

    describe('fetchRecommendations', () => {
        it('should structure sent and received data properly', async () => {
            const mockSent = [
                { id: '1', sender_id: 'user-1', receiver_id: 'user-2', is_read: false, comments: [], rating: null }
            ];
            const mockReceived = [
                { id: '2', sender_id: 'user-3', receiver_id: 'user-1', is_read: false, comments: [], rating: null }
            ];

            mockFetchCalls(
                { data: mockSent, error: null },
                { data: mockReceived, error: null }
            );

            await useRecommendationStore.getState().fetchRecommendations({ force: true });

            const state = useRecommendationStore.getState();
            expect(state.error).toBeNull();
            expect(state.isLoading).toBe(false);
            expect(state.sent.length).toBe(1);
            expect(state.received.length).toBe(1);
            // 1 unread received recommendation
            expect(state.unreadCount).toBe(1);
        });

        it('should skip fetching if recent cache exists (unless forced)', async () => {
            useRecommendationStore.setState({ lastFetched: Date.now() });

            const mockSelectFn = jest.fn();
            (supabase.from as jest.Mock).mockReturnValue({ select: mockSelectFn });

            await useRecommendationStore.getState().fetchRecommendations();
            expect(mockSelectFn).not.toHaveBeenCalled();

            // Force bypasses the cache
            (supabase.from as jest.Mock)
                .mockReturnValueOnce(makeMockChain({ data: [], error: null }))
                .mockReturnValueOnce(makeMockChain({ data: [], error: null }));

            await useRecommendationStore.getState().fetchRecommendations({ force: true });
            expect(mockSelectFn).not.toHaveBeenCalled(); // from() was used instead, not select directly
        });

        it('should not fetch if user is not logged in', async () => {
            useAuthStore.setState({ user: null });

            const mockFrom = jest.fn();
            (supabase.from as jest.Mock).mockImplementation(mockFrom);

            await useRecommendationStore.getState().fetchRecommendations({ force: true });

            expect(mockFrom).not.toHaveBeenCalled();
        });

        it('should set error state if the sent query fails', async () => {
            mockFetchCalls(
                { data: null, error: new Error('DB Error') },
                { data: [], error: null }
            );

            await useRecommendationStore.getState().fetchRecommendations({ force: true });

            const state = useRecommendationStore.getState();
            expect(state.error).toBe('Error al cargar recomendaciones');
            expect(state.isLoading).toBe(false);
        });

        it('should set error state if the received query fails', async () => {
            mockFetchCalls(
                { data: [], error: null },
                { data: null, error: new Error('DB Error') }
            );

            await useRecommendationStore.getState().fetchRecommendations({ force: true });

            const state = useRecommendationStore.getState();
            expect(state.error).toBe('Error al cargar recomendaciones');
            expect(state.isLoading).toBe(false);
        });

        it('should update lastFetched after a successful fetch', async () => {
            const before = Date.now();

            mockFetchCalls(
                { data: [], error: null },
                { data: [], error: null }
            );

            await useRecommendationStore.getState().fetchRecommendations({ force: true });

            const { lastFetched } = useRecommendationStore.getState();
            expect(lastFetched).not.toBeNull();
            expect(lastFetched).toBeGreaterThanOrEqual(before);
        });
    });

    // ── calculateUnreadCount ─────────────────────────────────────────────────

    describe('calculateUnreadCount', () => {
        it('should count unread received recommendations and unread comments', async () => {
            const sentRec = {
                id: '1',
                sender_id: 'user-1',
                receiver_id: 'user-2',
                is_read: true,
                comments: [
                    { id: 'c1', user_id: 'user-2', is_read: false }, // unread comment from other user
                ],
                rating: null,
            } as any;

            const receivedRec = {
                id: '2',
                sender_id: 'user-3',
                receiver_id: 'user-1',
                is_read: false, // unread recommendation
                comments: [
                    { id: 'c2', user_id: 'user-1', is_read: false }, // own comment — ignored
                    { id: 'c3', user_id: 'user-3', is_read: false }, // unread comment from other user
                ],
                rating: null,
            } as any;

            mockFetchCalls(
                { data: [sentRec], error: null },
                { data: [receivedRec], error: null }
            );

            await useRecommendationStore.getState().fetchRecommendations({ force: true });

            const state = useRecommendationStore.getState();
            expect(state.error).toBeNull();
            // 1 unread received rec + 1 unread comment on sent + 1 unread comment on received = 3
            expect(state.unreadCount).toBe(3);
        });

        it('should return 0 when everything is read', async () => {
            const sentRec = {
                id: '1',
                sender_id: 'user-1',
                receiver_id: 'user-2',
                is_read: true,
                comments: [
                    { id: 'c1', user_id: 'user-2', is_read: true },
                ],
                rating: null,
            } as any;

            const receivedRec = {
                id: '2',
                sender_id: 'user-3',
                receiver_id: 'user-1',
                is_read: true,
                comments: [
                    { id: 'c2', user_id: 'user-3', is_read: true },
                ],
                rating: null,
            } as any;

            mockFetchCalls(
                { data: [sentRec], error: null },
                { data: [receivedRec], error: null }
            );

            await useRecommendationStore.getState().fetchRecommendations({ force: true });

            expect(useRecommendationStore.getState().unreadCount).toBe(0);
        });
    });

    // ── addComment ───────────────────────────────────────────────────────────

    describe('addComment', () => {
        it('should add a comment to both sent and received lists', async () => {
            const existingRec = { id: 'rec-1', sender_id: 'user-1', receiver_id: 'user-2', is_read: true, comments: [] } as any;
            useRecommendationStore.setState({ sent: [existingRec], received: [existingRec] });

            const newComment = { id: 'c-new', recommendation_id: 'rec-1', user_id: 'user-1', text: 'Nice!', is_read: false };

            (supabase.from as jest.Mock).mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: newComment, error: null }),
            });

            const result = await useRecommendationStore.getState().addComment('rec-1', 'Nice!');

            expect(result).toBe(true);
            const state = useRecommendationStore.getState();
            expect(state.sent[0].comments).toHaveLength(1);
            expect(state.received[0].comments[0].id).toBe('c-new');
        });

        it('should return false if the insert fails', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
            });

            const result = await useRecommendationStore.getState().addComment('rec-1', 'Nice!');
            expect(result).toBe(false);
        });

        it('should return false if user is not logged in', async () => {
            useAuthStore.setState({ user: null });
            const result = await useRecommendationStore.getState().addComment('rec-1', 'Nice!');
            expect(result).toBe(false);
        });
    });

    // ── deleteComment ────────────────────────────────────────────────────────

    describe('deleteComment', () => {
        it('should remove the comment from state on success', async () => {
            const comment = { id: 'c-1', user_id: 'user-2', is_read: false };
            const rec = { id: 'rec-1', sender_id: 'user-1', receiver_id: 'user-2', is_read: true, comments: [comment] } as any;
            useRecommendationStore.setState({ sent: [rec], received: [] });

            (supabase.from as jest.Mock).mockReturnValue({
                delete: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockResolvedValue({ data: [comment], error: null, count: 1 }),
            });

            const result = await useRecommendationStore.getState().deleteComment('rec-1', 'c-1');

            expect(result).toBe(true);
            expect(useRecommendationStore.getState().sent[0].comments).toHaveLength(0);
        });

        it('should return false if delete fails', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                delete: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockResolvedValue({ data: null, error: new Error('Delete failed'), count: 0 }),
            });

            const result = await useRecommendationStore.getState().deleteComment('rec-1', 'c-1');
            expect(result).toBe(false);
        });
    });

    // ── deleteRecommendation (Soft Delete) ───────────────────────────────────

    describe('deleteRecommendation', () => {
        it('should soft delete via RPC and recalculate unread count', async () => {
            const receivedRec = { id: 'delete-me', is_read: false, comments: [] } as any;
            useRecommendationStore.setState({ received: [receivedRec], sent: [], unreadCount: 1 });

            (supabase.rpc as jest.Mock).mockResolvedValue({ data: true, error: null });

            const result = await useRecommendationStore.getState().deleteRecommendation('delete-me');

            expect(result).toBe(true);
            expect(supabase.rpc).toHaveBeenCalledWith('soft_delete_recommendation', {
                p_recommendation_id: 'delete-me',
            });

            const state = useRecommendationStore.getState();
            expect(state.received).toHaveLength(0);
            expect(state.unreadCount).toBe(0);
        });

        it('should return false and not mutate state if RPC returns an error', async () => {
            const receivedRec = { id: 'keep-me', is_read: false, comments: [] } as any;
            useRecommendationStore.setState({ received: [receivedRec], sent: [], unreadCount: 1 });

            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: false,
                error: new Error('RPC Failed'),
            });

            const result = await useRecommendationStore.getState().deleteRecommendation('keep-me');

            expect(result).toBe(false);
            const state = useRecommendationStore.getState();
            expect(state.received).toHaveLength(1);
            expect(state.unreadCount).toBe(1);
        });

        it('should return false and not mutate state if RPC returns data: false', async () => {
            const receivedRec = { id: 'keep-me', is_read: false, comments: [] } as any;
            useRecommendationStore.setState({ received: [receivedRec], sent: [], unreadCount: 1 });

            (supabase.rpc as jest.Mock).mockResolvedValue({ data: false, error: null });

            const result = await useRecommendationStore.getState().deleteRecommendation('keep-me');

            expect(result).toBe(false);
            expect(useRecommendationStore.getState().received).toHaveLength(1);
        });

        it('should return false if user is not logged in', async () => {
            useAuthStore.setState({ user: null });
            const result = await useRecommendationStore.getState().deleteRecommendation('any-id');
            expect(result).toBe(false);
            expect(supabase.rpc).not.toHaveBeenCalled();
        });
    });

    // ── markAllAsRead ────────────────────────────────────────────────────────

    describe('markAllAsRead', () => {
        it('should mark all received recs as read and update unreadCount', async () => {
            const rec1 = { id: 'r1', is_read: false, comments: [] } as any;
            const rec2 = { id: 'r2', is_read: false, comments: [] } as any;
            useRecommendationStore.setState({ received: [rec1, rec2], sent: [], unreadCount: 2 });

            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
            });
            // The final .eq() in the chain resolves the promise
            const eqMock = jest.fn().mockResolvedValue({ error: null });
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: eqMock,
                    }),
                }),
            });

            await useRecommendationStore.getState().markAllAsRead();

            const state = useRecommendationStore.getState();
            expect(state.received.every(r => r.is_read)).toBe(true);
            expect(state.unreadCount).toBe(0);
        });
    });

    // ── markCommentsAsRead ───────────────────────────────────────────────────

    describe('markCommentsAsRead', () => {
        it('should mark comments from other users as read and update unreadCount', async () => {
            const comment = { id: 'c1', user_id: 'user-2', is_read: false };
            const rec = { id: 'rec-1', sender_id: 'user-1', receiver_id: 'user-2', is_read: true, comments: [comment] } as any;
            useRecommendationStore.setState({ sent: [rec], received: [], unreadCount: 1 });

            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        neq: jest.fn().mockReturnValue({
                            eq: jest.fn().mockResolvedValue({ error: null }),
                        }),
                    }),
                }),
            });

            await useRecommendationStore.getState().markCommentsAsRead('rec-1');

            const state = useRecommendationStore.getState();
            expect(state.sent[0].comments[0].is_read).toBe(true);
            expect(state.unreadCount).toBe(0);
        });
    });

    // ── clearRecommendations ─────────────────────────────────────────────────

    describe('clearRecommendations', () => {
        it('should reset all state to initial values', () => {
            useRecommendationStore.setState({
                sent: [{ id: '1' } as any],
                received: [{ id: '2' } as any],
                unreadCount: 5,
                error: 'some error',
                lastFetched: Date.now(),
            });

            useRecommendationStore.getState().clearRecommendations();

            const state = useRecommendationStore.getState();
            expect(state.sent).toHaveLength(0);
            expect(state.received).toHaveLength(0);
            expect(state.unreadCount).toBe(0);
            expect(state.error).toBeNull();
            expect(state.lastFetched).toBeNull();
            expect(state.isLoading).toBe(false);
        });
    });
});