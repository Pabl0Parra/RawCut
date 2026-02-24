import { serve } from "https://deno.land/std@0.217.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const expoPushApiUrl = "https://exp.host/--/api/v2/push/send";

serve(async (req: Request) => {
    try {
        // Parse the incoming webhook payload from Supabase
        const payload = await req.json();
        console.log("Received payload:", payload);

        // We only care about INSERT events on the recommendations table
        if (payload.type !== 'INSERT' || payload.table !== 'recommendations') {
            return new Response(JSON.stringify({ message: "Not a recommendation insert, skipping." }), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            });
        }

        const recommendation = payload.record;
        const receiverId = recommendation.receiver_id;
        const senderId = recommendation.sender_id;
        const mediaTitle = recommendation.media_title || "un título"; 
        
        // Initialize Supabase client
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Fetch the sender's username
        const { data: senderProfile } = await supabaseAdmin
            .from('profiles')
            .select('username')
            .eq('user_id', senderId)
            .single();
            
        const senderName = senderProfile?.username || "Alguien";

        // Fetch the receiver's push token
        const { data: receiverProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('expo_push_token')
            .eq('user_id', receiverId)
            .single();

        if (profileError || !receiverProfile?.expo_push_token) {
            console.log(`No push token found for user ${receiverId}`);
            return new Response(JSON.stringify({ message: "User has no push token" }), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            });
        }

        const pushToken = receiverProfile.expo_push_token;

        // Construct the Expo Push Message
        const message = {
            to: pushToken,
            sound: 'default',
            title: '¡Nueva recomendación! 🍿',
            body: `${senderName} te ha recomendado ver "${mediaTitle}".`,
            data: { 
                url: `/`, // Deep link to home or specific screen
                recommendationId: recommendation.id 
            },
        };

        // Send the push notification via Expo API
        console.log(`Sending notification to ${pushToken}`);
        const expoRes = await fetch(expoPushApiUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const expoData = await expoRes.json();
        console.log("Expo API response:", expoData);

        return new Response(JSON.stringify({ success: true, expoResponse: expoData }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: unknown) {
        console.error("Error processing webhook:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
});
