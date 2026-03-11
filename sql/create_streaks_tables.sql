-- =============================================
-- TABELAS PARA OFENSIVAS (STREAKS) E DESAFIOS DIÁRIOS (PMERJ)
-- =============================================

-- 1. Ofensiva do Usuário
CREATE TABLE IF NOT EXISTS public.pmerj_user_streaks (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Desafios Diários do Usuário
CREATE TABLE IF NOT EXISTS public.pmerj_user_challenges (
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  trainings_completed INTEGER NOT NULL DEFAULT 0,
  claimed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, challenge_date)
);

-- RLS
ALTER TABLE public.pmerj_user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmerj_user_challenges ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Users read own streak" ON public.pmerj_user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own streak" ON public.pmerj_user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own streak" ON public.pmerj_user_streaks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users read own challenges" ON public.pmerj_user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own challenges" ON public.pmerj_user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own challenges" ON public.pmerj_user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Função RPC para atualizar a atividade diária e incrementar as métricas
CREATE OR REPLACE FUNCTION pmerj_update_daily_activity(
    p_user_id UUID,
    p_is_correct BOOLEAN DEFAULT false,
    p_is_reinforcement BOOLEAN DEFAULT false
) RETURNS void AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_last_active DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
BEGIN
    -- 1. Lógica da Ofensiva (Streak)
    SELECT last_activity_date, current_streak, longest_streak 
    INTO v_last_active, v_current_streak, v_longest_streak
    FROM public.pmerj_user_streaks 
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        -- Primeiro login/atividade do usuário
        INSERT INTO public.pmerj_user_streaks (user_id, current_streak, longest_streak, last_activity_date)
        VALUES (p_user_id, 1, 1, v_today);
    ELSE
        IF v_last_active IS NULL OR v_last_active < v_today THEN
            IF v_last_active = v_today - INTERVAL '1 day' THEN
                -- Dia consecutivo -> incrementa a ofensiva
                v_current_streak := v_current_streak + 1;
            ELSE
                -- Quebrou a ofensiva -> zera e começa 1
                v_current_streak := 1;
            END IF;
            
            IF v_current_streak > v_longest_streak THEN
                v_longest_streak := v_current_streak;
            END IF;

            UPDATE public.pmerj_user_streaks
            SET current_streak = v_current_streak,
                longest_streak = v_longest_streak,
                last_activity_date = v_today,
                updated_at = now()
            WHERE user_id = p_user_id;
        END IF;
    END IF;

    -- 2. Lógica do Desafio Diário
    -- Tentar inserir o registro de hoje vazio se não existir
    BEGIN
        INSERT INTO public.pmerj_user_challenges (user_id, challenge_date)
        VALUES (p_user_id, v_today)
        ON CONFLICT (user_id, challenge_date) DO NOTHING;
    EXCEPTION WHEN unique_violation THEN
        -- Já existe, faremos o Update
    END;

    -- Atualizar as métricas baseadas no que aconteceu
    UPDATE public.pmerj_user_challenges
    SET questions_answered = questions_answered + (CASE WHEN NOT p_is_reinforcement THEN 1 ELSE 0 END),
        correct_answers = correct_answers + (CASE WHEN p_is_correct THEN 1 ELSE 0 END),
        trainings_completed = trainings_completed + (CASE WHEN p_is_reinforcement THEN 1 ELSE 0 END),
        updated_at = now()
    WHERE user_id = p_user_id AND challenge_date = v_today;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
