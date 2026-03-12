import { supabase } from './supabaseClient';
import { TopicProgress, RankEntry, UserStreak, DailyChallenge } from '../types';/**
 * Interface para os dados consolidados do painel por matéria.
 */
export interface DashboardStats {
    portuguesTotal: number;
    portuguesCorrect: number;
    portuguesAccuracy: number;
    matematicaTotal: number;
    matematicaCorrect: number;
    matematicaAccuracy: number;
    direitosHumanosTotal: number;
    direitosHumanosCorrect: number;
    direitosHumanosAccuracy: number;
    legislacaoTotal: number;
    legislacaoCorrect: number;
    legislacaoAccuracy: number;
    criticalTopics: TopicProgress[];
}

/**
 * Normaliza o nome da matéria para o padrão do stats
 */
const normalizeSubject = (subject: string): string => {
    if (subject === 'Língua Portuguesa' || subject === 'Português') return 'Língua Portuguesa';
    if (subject === 'Matemática' || subject === 'Matemática Básica') return 'Matemática Básica';
    if (subject === 'Direitos Humanos') return 'Direitos Humanos';
    if (subject === 'Legislação Aplicada à PMERJ' || subject === 'Legislação') return 'Legislação Aplicada à PMERJ';
    return subject;
};

/**
 * Busca as estatísticas de um aluno no Supabase.
 */
export const getDashboardStats = async (userId: string): Promise<DashboardStats> => {
    const { data: subjectData, error: subjectError } = await supabase
        .from('student_stats')
        .select('subject, score, total_questions')
        .eq('user_id', userId);

    if (subjectError) console.error('Error fetching student stats:', subjectError);

    let pCorrect = 0, pTotal = 0;
    let mCorrect = 0, mTotal = 0;
    let dhCorrect = 0, dhTotal = 0;
    let lCorrect = 0, lTotal = 0;

    if (subjectData) {
        for (const row of subjectData) {
            const subj = normalizeSubject(row.subject);
            if (subj === 'Língua Portuguesa') {
                pCorrect = row.score ?? 0;
                pTotal = row.total_questions ?? 0;
            } else if (subj === 'Matemática Básica') {
                mCorrect = row.score ?? 0;
                mTotal = row.total_questions ?? 0;
            } else if (subj === 'Direitos Humanos') {
                dhCorrect = row.score ?? 0;
                dhTotal = row.total_questions ?? 0;
            } else if (subj === 'Legislação Aplicada à PMERJ') {
                lCorrect = row.score ?? 0;
                lTotal = row.total_questions ?? 0;
            }
        }
    }

    const { data: topicData, error: topicError } = await supabase
        .from('topic_stats')
        .select('subject, topic, score, total_questions')
        .eq('user_id', userId);

    if (topicError) console.error('Error fetching topic stats:', topicError);

    const criticalTopics: TopicProgress[] = [];

    if (topicData) {
        for (const row of topicData) {
            const total = row.total_questions ?? 0;
            const score = row.score ?? 0;
            if (total === 0) continue;

            const mastery = Math.round((score / total) * 100);
            const subject = normalizeSubject(row.subject) as 'Língua Portuguesa' | 'Matemática Básica' | 'Direitos Humanos' | 'Legislação Aplicada à PMERJ';

            if (mastery < 50) {
                criticalTopics.push({
                    topic: row.topic,
                    subject,
                    mastery,
                    questionsAttempted: total,
                    status: mastery < 25 ? 'critical' : 'warning',
                });
            }
        }
        criticalTopics.sort((a, b) => a.mastery - b.mastery);
    }

    return {
        portuguesCorrect: pCorrect,
        portuguesTotal: pTotal,
        portuguesAccuracy: pTotal > 0 ? Math.round((pCorrect / pTotal) * 100) : 0,
        matematicaCorrect: mCorrect,
        matematicaTotal: mTotal,
        matematicaAccuracy: mTotal > 0 ? Math.round((mCorrect / mTotal) * 100) : 0,
        direitosHumanosCorrect: dhCorrect,
        direitosHumanosTotal: dhTotal,
        direitosHumanosAccuracy: dhTotal > 0 ? Math.round((dhCorrect / dhTotal) * 100) : 0,
        legislacaoCorrect: lCorrect,
        legislacaoTotal: lTotal,
        legislacaoAccuracy: lTotal > 0 ? Math.round((lCorrect / lTotal) * 100) : 0,
        criticalTopics,
    };
};

/**
 * Salva o resultado de uma questão usando RPCs atômicas (sem race conditions).
 */
export const saveResult = async (userId: string, subject: string, topic: string, isCorrect: boolean, _timeTaken: number) => {
    const normalizedSubject = normalizeSubject(subject);

    // Chamar RPCs atômicas em paralelo
    const [subjectResult, topicResult, activityResult] = await Promise.all([
        supabase.rpc('increment_student_stats', {
            p_user_id: userId,
            p_subject: normalizedSubject,
            p_is_correct: isCorrect,
        }),
        supabase.rpc('increment_topic_stats', {
            p_user_id: userId,
            p_subject: normalizedSubject,
            p_topic: topic,
            p_is_correct: isCorrect,
        }),
        supabase.rpc('pmerj_update_daily_activity', {
            p_user_id: userId,
            p_is_correct: isCorrect,
            p_is_reinforcement: false, // Default is false, but reinforcement arenas will pass true
        }),
    ]);

    if (subjectResult.error) {
        console.error('Error saving subject stats:', subjectResult.error);
    }
    if (topicResult.error) {
        console.error('Error saving topic stats:', topicResult.error);
    }
    if (activityResult.error) {
        console.error('Error updating daily activity:', activityResult.error);
    }
};

/**
 * Registra atividade no Treino de Reforço
 */
export const registerReinforcementActivity = async (userId: string, isCorrect: boolean) => {
    const { error } = await supabase.rpc('pmerj_update_daily_activity', {
        p_user_id: userId,
        p_is_correct: isCorrect,
        p_is_reinforcement: true,
    });
    if (error) console.error('Error updating daily activity for reinforcement:', error);
};

/**
 * Busca os dados de Ofensiva (Streak) do usuário.
 */
export const getUserStreak = async (userId: string): Promise<UserStreak | null> => {
    const { data, error } = await supabase
        .from('pmerj_user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        return null;
    }
    return {
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        lastActivityDate: data.last_activity_date,
    };
};

/**
 * Busca o desafio diário do usuário.
 */
export const getDailyChallenge = async (userId: string): Promise<DailyChallenge | null> => {
    // Current date in YYYY-MM-DD local time or UTC as needed
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('pmerj_user_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_date', today)
        .single();

    if (error) {
        return {
            challengeDate: today,
            questionsAnswered: 0,
            correctAnswers: 0,
            trainingsCompleted: 0,
            claimed: false,
        };
    }

    return {
        challengeDate: data.challenge_date,
        questionsAnswered: data.questions_answered,
        correctAnswers: data.correct_answers,
        trainingsCompleted: data.trainings_completed,
        claimed: data.claimed,
    };
};

/**
 * Resgata a recompensa do desafio diário
 */
export const claimDailyChallenge = async (userId: string): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
        .from('pmerj_user_challenges')
        .update({ claimed: true })
        .eq('user_id', userId)
        .eq('challenge_date', today);

    if (error) {
        console.error('Erro ao resgatar recompensa:', error);
        return false;
    }
    return true;
};

/**
 * Busca o ranking real dos alunos no Supabase.
 * Calcula XP como: (total de acertos) * 10
 */
export const getRankingData = async (): Promise<RankEntry[]> => {
    // 1. Buscar todas as stats de todos os alunos
    const { data: allStats, error: statsError } = await supabase
        .from('student_stats')
        .select('user_id, score, total_questions');

    if (statsError || !allStats) {
        console.error('Erro ao buscar ranking:', statsError);
        return [];
    }

    // 2. Agregar pontos por user_id
    const userScores: Record<string, { score: number; total: number }> = {};
    for (const row of allStats) {
        if (!userScores[row.user_id]) {
            userScores[row.user_id] = { score: 0, total: 0 };
        }
        userScores[row.user_id].score += row.score ?? 0;
        userScores[row.user_id].total += row.total_questions ?? 0;
    }

    // 3. Buscar nomes e avatares dos usuários via tabela profiles (se existir) ou auth
    const userIds = Object.keys(userScores);

    // Tentar buscar de profiles primeiro
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

    const profileMap: Record<string, { name: string; avatar: string }> = {};
    if (profiles) {
        for (const p of profiles) {
            profileMap[p.id] = {
                name: p.full_name || 'Aluno',
                avatar: p.avatar_url || '',
            };
        }
    }

    // 4. Montar ranking ordenado por XP
    const entries: RankEntry[] = userIds.map((uid, _i) => {
        const xp = (userScores[uid].score) * 10;
        const profile = profileMap[uid];
        return {
            userId: uid,
            rank: 0,
            name: profile?.name || 'Aluno',
            xp,
            avatarUrl: profile?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name || uid.slice(0, 4)}`,
            trend: 'same' as const,
        };
    });

    // Ordenar por XP (maior primeiro)
    entries.sort((a, b) => b.xp - a.xp);

    // Atribuir posições
    entries.forEach((e, i) => { e.rank = i + 1; });

    return entries;
};