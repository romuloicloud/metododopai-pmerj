-- Table for tracking weekly simulation purchases via PIX
CREATE TABLE IF NOT EXISTS public.pmerj_simulation_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    simulation_id TEXT NOT NULL, -- e.g., 'week-1', 'week-2', etc.
    payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, refunded
    kiwify_order_id TEXT, -- To track the order from the Kiwify Webhook
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pmerj_simulation_purchases_updated_at ON public.pmerj_simulation_purchases;
CREATE TRIGGER update_pmerj_simulation_purchases_updated_at
    BEFORE UPDATE ON public.pmerj_simulation_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE public.pmerj_simulation_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own purchases
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.pmerj_simulation_purchases;
CREATE POLICY "Users can view their own purchases"
    ON public.pmerj_simulation_purchases
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Note: Inserting and updating should be done via a secure backend (like a Supabase Edge Function or Next.js API route) listening to Kiwify Webhooks.
-- But for local dev/testing, we might allow inserts or handle it via service role key.
