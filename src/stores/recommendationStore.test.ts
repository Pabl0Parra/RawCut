import { useRecommendationStore } from './recommendationStore';
import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';
import { resetAllStores } from '../../__mocks__/zustand';

describe('recommendationStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetAllStores(); // Reset Zustand state
        
        // Mock user session
        useAuthStore.setState({ user: { id: 'user-1' } as any });
    });

    describe('fetchRecommendations', () => {
        it('should structure sent and received data properly', async () => {
            const mockSent = [
                { id: '1', sender_id: 'user-1', receiver_id: 'user-2', is_read: false, comments: [], rating: null }
            ];
             const mockReceived = [
                { id: '2', sender_id: 'user-3', receiver_id: 'user-1', is_read: false, comments: [], rating: null }
            ];

            // Setup double mock return for the two chained queries
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn()
                    .mockResolvedValueOnce({ data: mockSent, error: null }) // First call: Sent
                    .mockResolvedValueOnce({ data: mockReceived, error: null }) // Second call: Received
            });

            await useRecommendationStore.getState().fetchRecommendations({ force: true });

            const state = useRecommendationStore.getState();
            expect(state.sent.length).toBe(1);
            expect(state.received.length).toBe(1);
            expect(state.isLoading).toBe(false);
            
            // Should have 1 unread message (the received one)
            expect(state.unreadCount).toBe(1);
        });

        it('should skip fetching if recent cache exists (unless forced)', async () => {
             useRecommendationStore.setState({ lastFetched: Date.now() });

             const mockSupabaseCall = jest.fn();
             (supabase.from as jest.Mock).mockReturnValue({ select: mockSupabaseCall });

             await useRecommendationStore.getState().fetchRecommendations();
             expect(mockSupabaseCall).not.toHaveBeenCalled();

             await useRecommendationStore.getState().fetchRecommendations({ force: true });
             expect(mockSupabaseCall).toHaveBeenCalled();
        });
    });

    describe('calculateUnreadCount', () => {
        it('should count unread received recommendations and unread comments dynamically', async () => {
             // We inject state directly for pure logic testing
             const sentRec = {
                 id: '1', 
                 sender_id: 'user-1', 
                 receiver_id: 'user-2', 
                 is_read: true, 
                 comments: [
                     { id: 'c1', user_id: 'user-2', is_read: false } // Unread comment from receiver
                 ], 
                 rating: null 
             } as any;

             const receivedRec = {
                 id: '2', 
                 sender_id: 'user-3', 
                 receiver_id: 'user-1', 
                 is_read: false, // Unread recommendation
                 comments: [
                    { id: 'c2', user_id: 'user-1', is_read: false }, // Own comment (should ignore)
                    { id: 'c3', user_id: 'user-3', is_read: false } // Unread comment from sender
                 ], 
                 rating: null 
             } as any;

             useRecommendationStore.setState({
                 sent: [sentRec],
                 received: [receivedRec]
             });

             // The store uses calculateUnreadCount internally during updates. To test it:
             // 1 unread received message + 1 unread comment on sent + 1 unread comment on received = 3
             // Let's call an action that forces recalculation manually in the store
            
             // To accurately test internal logic, we trigger a fetch that returns the mock payload
             (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn()
                    .mockResolvedValueOnce({ data: [sentRec], error: null })
                    .mockResolvedValueOnce({ data: [receivedRec], error: null })
            });

            await useRecommendationStore.getState().fetchRecommendations({ force: true });
            expect(useRecommendationStore.getState().unreadCount).toBe(3);
        });
    });

    describe('deleteRecommendation (Soft Delete)', () => {
        it('should use the RPC call to soft delete and recalculate unread count on success', async () => {
            const receivedRec = { id: 'delete-me', is_read: false, comments: [] } as any;

             useRecommendationStore.setState({
                 received: [receivedRec],
                 sent: [],
                 unreadCount: 1
             });

             (supabase.rpc as jest.Mock).mockResolvedValue({
                 data: true,
                 error: null
             });

             const success = await useRecommendationStore.getState().deleteRecommendation('delete-me');
             
             expect(success).toBe(true);
             expect(supabase.rpc).toHaveBeenCalledWith('soft_delete_recommendation', { p_recommendation_id: 'delete-me' });
             
             const state = useRecommendationStore.getState();
             expect(state.received.length).toBe(0);
             // Since the unread message was deleted, unreadCount should drop to 0
             expect(state.unreadCount).toBe(0); 
        });

        it('should not mutate state if the RPC call fails', async () => {
            const receivedRec = { id: 'keep-me', is_read: false, comments: [] } as any;

            useRecommendationStore.setState({
                received: [receivedRec],
                sent: [],
                unreadCount: 1
            });

            (supabase.rpc as jest.Mock).mockResolvedValue({
                data: false,
                error: new Error('RPC Failed')
            });

            const success = await useRecommendationStore.getState().deleteRecommendation('keep-me');
            
            expect(success).toBe(false);
            
            const state = useRecommendationStore.getState();
            expect(state.received.length).toBe(1);
            expect(state.unreadCount).toBe(1); 
       });
    });
});
