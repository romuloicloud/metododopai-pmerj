-- Adicionando campos de controle de assinatura na tabela de usuários
-- Se a sua tabela de perfis de usuário tiver outro nome (ex: profiles), troque 'users' abaixo por 'profiles'.

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS kiwify_subscription_id text,
ADD COLUMN IF NOT EXISTS premium_since timestamp with time zone;

-- Criando um índice no status da assinatura para facilitar/acelerar pesquisas no backend (ex: buscar todos os alunos premium)
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
