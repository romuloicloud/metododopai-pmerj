import { supabase } from './supabaseClient';
import { Question, DiagnosticAnswer, DiagnosticResult } from '../types';

/**
 * Verifica se o aluno já completou o diagnóstico.
 */
export const hasCompletedDiagnostic = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('diagnostic_results')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar diagnóstico:', error);
    }
    return !!data;
};

/**
 * Sorteia questões aleatórias do banco de dados para o diagnóstico.
 * 5 de Português + 5 de Matemática, embaralhadas.
 */
export const fetchDiagnosticQuestions = async (): Promise<Question[]> => {
    // Buscar questões de Português
    const { data: ptQuestions, error: ptError } = await supabase
        .from('questoes')
        .select('*')
        .ilike('exam_id', 'pmerj%')
        .ilike('subject', '%Português%')
        .limit(100);

    if (ptError) console.error('Erro buscando questões PT:', ptError);

    // Buscar questões de Matemática
    const { data: matQuestions, error: matError } = await supabase
        .from('questoes')
        .select('*')
        .ilike('exam_id', 'pmerj%')
        .ilike('subject', '%Matemática%')
        .limit(100);

    if (matError) console.error('Erro buscando questões MAT:', matError);

    // Buscar questões de Direitos Humanos
    const { data: dhQuestions, error: dhError } = await supabase
        .from('questoes')
        .select('*')
        .ilike('exam_id', 'pmerj%')
        .ilike('subject', '%Direitos Humanos%')
        .limit(100);

    if (dhError) console.error('Erro buscando questões DH:', dhError);

    // Buscar questões de Legislação
    const { data: legQuestions, error: legError } = await supabase
        .from('questoes')
        .select('*')
        .ilike('exam_id', 'pmerj%')
        .ilike('subject', '%Legislação%')
        .limit(100);

    if (legError) console.error('Erro buscando questões LEG:', legError);

    // Filtrar questões que referenciam textos mas não têm o conteúdo real
    const hasValidText = (q: any): boolean => {
        const text = (q.text || '').toLowerCase();
        const needsBaseText = text.includes('texto i') || text.includes('texto ii') ||
            text.includes('texto iii') || text.includes('poema') || text.includes('trecho') ||
            text.includes('leia o') || text.includes('leia a') ||
            text.includes('charge') || text.includes('tirinha') || text.includes('quadrinho');
        if (needsBaseText && (!q.base_text || q.base_text.length < 200)) return false;
        return true;
    };

    // Obter 3 PT, 3 MAT, 2 DH, 2 LEG (Total: 10)
    const shuffled = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
    const validPT = (ptQuestions || []).filter(hasValidText);
    const validMAT = (matQuestions || []).filter(hasValidText);
    const validDH = (dhQuestions || []).filter(hasValidText);
    const validLEG = (legQuestions || []).filter(hasValidText);

    const selectedPT = shuffled(validPT).slice(0, 3);
    const selectedMAT = shuffled(validMAT).slice(0, 3);
    const selectedDH = shuffled(validDH).slice(0, 2);
    const selectedLEG = shuffled(validLEG).slice(0, 2);

    // Mapear para o formato Question
    const mapToQuestion = (q: any): Question => ({
        id: q.id,
        topic: q.topic || 'Geral',
        subject: q.subject?.includes('Portugu') ? 'Língua Portuguesa' :
            q.subject?.includes('Matem') ? 'Matemática Básica' :
                q.subject?.includes('Humanos') ? 'Direitos Humanos' :
                    'Legislação Aplicada à PMERJ',
        text: q.text,
        baseText: q.base_text || undefined,
        imageUrl: q.image_url || undefined,
        imageUrl2: q.image_url_2 || undefined,
        options: q.options,
        correctOptionIndex: q.correct_option_index,
    });

    const { shuffleOptionsWithCorrectIndex } = require('../src/utils/helpers');

    // Combinar e embaralhar a ordem final
    const all = shuffled([...selectedPT, ...selectedMAT, ...selectedDH, ...selectedLEG]);
    return all.map(mapToQuestion).map(q => {
        const { shuffledOptions, newCorrectIndex } = shuffleOptionsWithCorrectIndex(q.options, q.correctOptionIndex);
        return { ...q, options: shuffledOptions, correctOptionIndex: newCorrectIndex };
    });
};

/**
 * Analisa as respostas e identifica tópicos fortes/fracos, aplicando pesos do Edital da PMERJ.
 */
export const analyzeDiagnosticResults = (answers: DiagnosticAnswer[]): DiagnosticResult => {
    const scoreTotal = answers.filter(a => a.isCorrect).length;
    const scorePortugues = answers.filter(a => a.subject.includes('Portugu') && a.isCorrect).length;
    const scoreMatematica = answers.filter(a => a.subject.includes('Matem') && a.isCorrect).length;
    const scoreDireitosHumanos = answers.filter(a => a.subject.includes('Humanos') && a.isCorrect).length;
    const scoreLegislacao = answers.filter(a => a.subject.includes('Legisla') && a.isCorrect).length;

    // Calcular o % de maestria baseado nos pesos REAIS do edital
    // Exemplo de pesos genéricos PMERJ (pode ser ajustado):
    // Português: Peso 3 (30%)
    // Legislação: Peso 3 (30%) 
    // Direitos Humanos: Peso 2 (20%)
    // Matemática: Peso 2 (20%)

    // Total de questões no diagnóstico (são 10) divididos pela amostra de matéria
    const totalPt = answers.filter(a => a.subject.includes('Portugu')).length || 1;
    const totalMat = answers.filter(a => a.subject.includes('Matem')).length || 1;
    const totalDh = answers.filter(a => a.subject.includes('Humanos')).length || 1;
    const totalLeg = answers.filter(a => a.subject.includes('Legisla')).length || 1;

    const ptPercent = (scorePortugues / totalPt);
    const matPercent = (scoreMatematica / totalMat);
    const dhPercent = (scoreDireitosHumanos / totalDh);
    const legPercent = (scoreLegislacao / totalLeg);

    // Global Mastery (Pontuação ponderada)
    const pmerjGlobalMastery = Math.round(
        (ptPercent * 30) +
        (legPercent * 30) +
        (dhPercent * 20) +
        (matPercent * 20)
    );

    // Agrupar por tópico e calcular acerto
    const topicMap: Record<string, { correct: number; total: number }> = {};
    answers.forEach(a => {
        if (!topicMap[a.topic]) topicMap[a.topic] = { correct: 0, total: 0 };
        topicMap[a.topic].total++;
        if (a.isCorrect) topicMap[a.topic].correct++;
    });

    const weakTopics: string[] = [];
    const strongTopics: string[] = [];

    Object.entries(topicMap).forEach(([topic, stats]) => {
        const accuracy = stats.correct / stats.total;
        if (accuracy < 0.5) weakTopics.push(topic);
        else strongTopics.push(topic);
    });

    return {
        scoreTotal,
        scorePortugues,
        scoreMatematica,
        scoreDireitosHumanos,
        scoreLegislacao,
        weakTopics,
        strongTopics,
        answers,
        pmerjGlobalMastery,
    };
};

/**
 * Salva o resultado do diagnóstico no Supabase.
 */
export const saveDiagnosticResult = async (userId: string, result: DiagnosticResult): Promise<boolean> => {
    const { error } = await supabase
        .from('diagnostic_results')
        .insert({
            user_id: userId,
            score_total: result.scoreTotal,
            score_portugues: result.scorePortugues,
            score_matematica: result.scoreMatematica,
            score_direitos_humanos: result.scoreDireitosHumanos,
            score_legislacao: result.scoreLegislacao,
            weak_topics: result.weakTopics,
            strong_topics: result.strongTopics,
            answers: result.answers,
            pmerj_global_mastery: result.pmerjGlobalMastery || 0,
        });

    if (error) {
        console.error('Erro ao salvar diagnóstico:', error);
        return false;
    }
    return true;
};

/**
 * Busca o resultado do diagnóstico salvo para exibir na tela de resultado.
 */
export const getDiagnosticResult = async (userId: string): Promise<DiagnosticResult | null> => {
    const { data, error } = await supabase
        .from('diagnostic_results')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;

    return {
        scoreTotal: data.score_total,
        scorePortugues: data.score_portugues,
        scoreMatematica: data.score_matematica,
        scoreDireitosHumanos: data.score_direitos_humanos || 0,
        scoreLegislacao: data.score_legislacao || 0,
        weakTopics: data.weak_topics,
        strongTopics: data.strong_topics,
        answers: data.answers as DiagnosticAnswer[],
        pmerjGlobalMastery: data.pmerj_global_mastery || 0,
    };
};
