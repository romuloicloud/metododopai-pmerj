import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Validação de segurança Oficial Kiwify
const KIWIFY_TOKEN = Deno.env.get('KIWIFY_WEBHOOK_TOKEN') || 'rhcvcnmkh2v';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload = await req.json()
        const { webhook_token, order_status, customer, Subscription } = payload

        // 1. Validar token da Kiwify para evitar fraudes
        if (webhook_token !== KIWIFY_TOKEN) {
            console.error('Invalid token sent', webhook_token);
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
        }

        const email = customer?.email
        if (!email) {
            return new Response(JSON.stringify({ error: 'No email provided' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
        }

        // 2. Conectar com o Supabase de forma autorizada (Bypassing RLS para alterar perfis do banco secretamente)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

        console.log(`Avaliando Webhook Kiwify para ${email} - Venda Status: ${order_status}`);

        let subscription_status = 'free';

        // 3. Regra de Negócio: Liberação ou Bloqueio Diante do Status do Kiwify
        if (order_status === 'paid' || order_status === 'approved' || Subscription?.status === 'active') {
            subscription_status = 'premium';
        } else if (order_status === 'refunded' || order_status === 'chargedback' || Subscription?.status === 'canceled') {
            subscription_status = 'free';
        }

        let errorResult = null;

        // 4. Executando a Modificação da Coluna subscription_status criada pelo SQL inicial
        if (subscription_status === 'premium') {
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    subscription_status: 'premium',
                    kiwify_subscription_id: Subscription?.id || null,
                    premium_since: new Date().toISOString()
                })
                .eq('email', email)

            errorResult = error;
        } else if (subscription_status === 'free' && (order_status === 'refunded' || order_status === 'chargedback')) {
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    subscription_status: 'free',
                    kiwify_subscription_id: null
                })
                .eq('email', email)

            errorResult = error;
        }

        if (errorResult) {
            console.error('Falha ao atualizar banco de dados:', errorResult);
            throw errorResult;
        }

        console.log(`Sucesso! Aluno com e-mail ${email} foi atualizado para ${subscription_status}`);

        return new Response(JSON.stringify({ success: true, message: `Perfil do aluno atualizado para ${subscription_status}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (err) {
        console.error('Erro geral Webhhok:', err);
        return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }
})
