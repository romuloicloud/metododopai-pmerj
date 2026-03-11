import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export interface SubscriptionData {
    status: 'free' | 'premium' | 'canceled';
    kiwify_subscription_id: string | null;
    premium_since: string | null;
}

export function useSubscription() {
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchSubscription() {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    if (isMounted) {
                        setSubscription(null);
                        setLoading(false);
                    }
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('subscription_status, kiwify_subscription_id, premium_since')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                if (isMounted && data) {
                    setSubscription({
                        status: data.subscription_status || 'free',
                        kiwify_subscription_id: data.kiwify_subscription_id || null,
                        premium_since: data.premium_since || null,
                    });
                }
            } catch (err) {
                console.error('Error loading subscription status:', err);
                if (isMounted) setSubscription({ status: 'free', kiwify_subscription_id: null, premium_since: null });
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchSubscription();

        // Opcional: Escutar mudanças em tempo real no banco
        const channel = supabase
            .channel('profile_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                },
                (payload) => {
                    if (isMounted && payload.new) {
                        setSubscription({
                            status: payload.new.subscription_status || 'free',
                            kiwify_subscription_id: payload.new.kiwify_subscription_id || null,
                            premium_since: payload.new.premium_since || null,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, []);

    return { subscription, loading, isPremium: subscription?.status === 'premium' };
}
