import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Question, AiExplanation, TheoryLesson } from '../types';
import { mockQuestions, mockLesson, mockLessonPortugues } from './mockData';
import { supabase } from './supabaseClient';
import { syllabus } from './syllabusData';

// A chave de API é injetada pelo Vite via VITE_GEMINI_API_KEY
// Usamos uma inicialização segura que não crasha o app se a chave estiver ausente
let ai: any;
try {
    const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
        console.log("GoogleGenAI initialized successfully!");
    } else {
        console.warn("API Key is empty during initialization.");
    }
} catch (e) {
    console.warn('GoogleGenAI não inicializado:', e);
}


const editalContentPlaceholder = `
CONTEÚDO PROGRAMÁTICO - COLÉGO PEDRO II / FAETEC (6º ANO)

I - LÍNGUA PORTUGUESA
1. Compreensão Textual: Textos verbais/não verbais, literários/não literários. Identificação de tema, informações explícitas e implícitas. Distinção entre fato e opinião. Inferência de sentido de palavras e expressões. Recursos de expressividade e ironia/humor.
2. Análise Linguística: Linguagem figurada. Classes de palavras e seu papel no texto. Processos de flexão e derivação. Tonicidade das palavras (sílaba tônica). Verbos (Indicativo e Subjuntivo). Pronomes (pessoais, demonstrativos e possessivos) e referencialidade.
3. Mecanismos de Coesão: Retomada pronominal, substituição lexical (hiperônimos/hipônimos) e conectivos. Pontuação e concordância nominal/verbal.

II - MATEMÁTICA
1. Números: Naturais (leitura, escrita, ordenação e as 4 operações). Racionais (frações, decimais finitos e reta numérica). Equivalência, comparação e ordenação. Operações com decimais e frações (incluindo divisão por natural). Porcentagem e contagem.
2. Álgebra: Termo desconhecido, propriedades da igualdade e equivalência. Partes proporcionais. Padrões e sequências.
3. Geometria: Figuras planas (características e ângulos). Coordenadas cartesianas (1º quadrante). Figuras poligonais em malhas (ampliação/redução). Figuras espaciais (características e planificações).
4. Grandezas e Medidas: Comprimento, área, massa, tempo, temperatura e capacidade. Perímetro e área de polígonos. Volume de cubos.
5. Probabilidade e Estatística: Experimentos aleatórios, espaço amostral e cálculo de chances. Leitura e interpretação de tabelas e gráficos.
`;

const subtopics = {
    'LÍNGUA PORTUGUESA': [
        'Compreensão de Crônicas',
        'Interpretação de Notícias',
        'Análise de Poemas',
        'Leitura de Tirinhas',
        'Figuras de Linguagem',
        'Classes de Palavras',
        'Uso de Conjunções e Conectivos',
        'Regras de Pontuação',
        'Concordância Nominal e Verbal',
    ],
    'MATEMÁTICA': [
        'Operações com Números Naturais',
        'Soma e Subtração de Frações',
        'Multiplicação e Divisão de Frações',
        'Cálculos com Números Decimais',
        'Porcentagem e Proporcionalidade',
        'Resolução de Expressões (Álgebra)',
        'Padrões e Sequências Lógicas',
        'Perímetro e Área de Figuras Planas',
        'Volume de Sólidos Geométricos',
        'Coordenadas Cartesianas',
        'Leitura de Tabelas e Gráficos',
        'Cálculo de Probabilidade Simples',
    ]
};

const difficulties = [
    'Fácil (nível de dificuldade similar à prova de 2017)',
    'Médio (nível de dificuldade similar à prova de 2022)',
    'Desafio (nível de dificuldade similar à prova de 2025)',
];

const portugueseTextTypes = ['uma crônica curta', 'uma notícia breve', 'um poema simples', 'uma tirinha'];


export const getAIExplanation = async (question: Question, incorrectAnswer: string): Promise<AiExplanation | null> => {
    const prompt = `
    Você é um tutor de IA especializado em preparação para Concursos Públicos e Carreiras Policiais, focado na PMERJ. Sua missão é explicar conceitos complexos de forma objetiva, didática e direta para um adulto concurseiro. Use linguagem clara e técnica quando necessário, mantendo o tom encorajador voltado à aprovação na polícia militar.

    ${question.baseText ? `**Texto Base da Questão:**\n---\n${question.baseText}\n---\n` : ''}

    A pergunta era: "${question.text}"
    As opções eram: ${question.options.join(', ')}
    A resposta correta era: "${question.options[question.correctOptionIndex]}"
    O aluno respondeu incorretamente: "${incorrectAnswer}"

    Explique por que a resposta do aluno está errada e por que a resposta correta está certa. Foque em explicar o conceito por trás da resposta correta.
    Sua resposta deve ser *exclusivamente* o objeto JSON puro, sem markdown ou qualquer outro texto.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        attentionDetail: { type: Type.STRING },
                        keyInsight: { type: Type.STRING },
                        analogy: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                imageUrl: { type: Type.STRING }
                            }
                        },
                        quickChallenge: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                correctAnswer: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as AiExplanation;
        }
        return null;

    } catch (error) {
        console.error("Error fetching AI explanation:", error);
        return {
            attentionDetail: "Houve uma falha ao conectar com o servidor do Professor Virtual (IA) para analisar o seu erro nesta questão.",
            keyInsight: "Isso costuma ocorrer quando a chave de estabilidade da API não responde a tempo ou se há um pico de acessos. Tente recarregar a tela ou aguarde alguns minutos.",
            analogy: { text: "Os robôs também precisam respirar fundo de vez em quando.", imageUrl: "" },
            quickChallenge: {
                question: "Que tal tentarmos novamente mais tarde?",
                correctAnswer: "Sim!"
            }
        };
    }
};

export const generateQuestionFromEdital = async (subject: 'LÍNGUA PORTUGUESA' | 'MATEMÁTICA'): Promise<Question | null> => {
    const randomSubtopic = subtopics[subject][Math.floor(Math.random() * subtopics[subject].length)];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    let portugueseInstruction = "";
    if (subject === 'LÍNGUA PORTUGUESA' && randomSubtopic.toLowerCase().includes('interpretação') || randomSubtopic.toLowerCase().includes('crônica') || randomSubtopic.toLowerCase().includes('notícia') || randomSubtopic.toLowerCase().includes('poema') || randomSubtopic.toLowerCase().includes('tirinhas')) {
        const randomTextType = portugueseTextTypes[Math.floor(Math.random() * portugueseTextTypes.length)];
        portugueseInstruction = `Como o subtópico envolve leitura, é OBRIGATÓRIO que você crie um 'baseText' original no formato de ${randomTextType}. O texto deve ser inédito e ter linguagem adequada para concurseiro prestando PMERJ adulto. A pergunta deve ser sobre este texto.`;
    }

    const prompt = `
    Você é um assistente de criação de conteúdo educacional especialista no concurso da Polícia Militar do Estado do Rio de Janeiro (PMERJ) - FGV. Sua tarefa é criar uma questão de múltipla escolha focada no nível deste concurso de soldado, baseada *estritamente* no conteúdo do edital fornecido.
    Conteúdo do Edital:
    ---
    ${editalContentPlaceholder}
    ---
    Instruções:
    1. Matéria: '${subject}'.
    2. Tópico Específico: '${randomSubtopic}'.
    3. Nível de Dificuldade: '${randomDifficulty}'.
    4. Instrução de Conteúdo: ${portugueseInstruction}
    5. Formato: 4 opções de resposta (A, B, C, D), apenas uma correta.
    6. Saída: Apenas o objeto JSON puro.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subject: { type: Type.STRING },
                        topic: { type: Type.STRING },
                        baseText: { type: Type.STRING },
                        text: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctOptionIndex: { type: Type.INTEGER },
                    },
                    required: ['subject', 'topic', 'text', 'options', 'correctOptionIndex']
                },
                seed: Math.floor(Math.random() * 1000000)
            }
        });

        if (response.text) {
            const generatedQuestion = JSON.parse(response.text) as Omit<Question, 'id'>;
            const typedSubject = subject === 'LÍNGUA PORTUGUESA' ? 'Língua Portuguesa' : 'Matemática Básica';
            return { ...generatedQuestion, subject: typedSubject as any, id: `gen-${Date.now()}` };
        }
        throw new Error("Empty response from AI.");

    } catch (error) {
        console.error("Error generating question from edital, returning mock question:", error);
        // Fallback para uma questão padrão em caso de erro.
        return mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
    }
};

export const generateTheoryLesson = async (topic: string): Promise<TheoryLesson> => {
    // Estratégia de Cache com Supabase
    const { data: cachedData, error: cacheError } = await supabase
        .from('lessons_cache')
        .select('lesson_data')
        .eq('topic', topic)
        .single();

    if (cacheError && cacheError.code !== 'PGRST116') { // PGRST116: "No rows found"
        console.error('Error fetching from Supabase cache:', cacheError.message);
    }

    if (cachedData) {
        console.log(`Supabase Cache HIT for topic: ${topic}`);
        return cachedData.lesson_data as TheoryLesson;
    }

    console.log(`Supabase Cache MISS for topic: ${topic}. Fetching from API.`);

    const systemInstruction = 'Act as: Police Exam Tutor. Level: Adult (Concurso PMERJ). Output: STRICT JSON. No filler text, just the raw JSON object.';
    const prompt = `Generate a micro-lesson for the topic: "${topic}". 
    The content must have:
    1. A theory explanation of max 300 words, clear and objective for an adult studying for PMERJ.
    2. Exactly 8 multiple-choice questions (MCQs) with progressive difficulty:
       - Questions 1-3: Fácil (basic concepts)
       - Questions 4-6: Médio (application)  
       - Questions 7-8: Desafio (exam-level, tricky)
    Each question must have 4 options and a detailed explanation of why the correct answer is correct.
    Focus: PMERJ/FGV exam level for Soldiers (adults).`;

    try {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('API Timeout')), 25000) // 25s for 8 questions
        );

        const response = await Promise.race([
            ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            topic: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            exercises: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        question: { type: Type.STRING },
                                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        correctOptionIndex: { type: Type.INTEGER },
                                        explanation: { type: Type.STRING, description: "Detailed explanation of why the correct answer is correct and others are wrong." }
                                    },
                                    required: ['question', 'options', 'correctOptionIndex', 'explanation']
                                }
                            }
                        },
                        required: ['topic', 'explanation', 'exercises']
                    },
                    temperature: 0.2
                }
            }),
            timeoutPromise
        ]) as GenerateContentResponse;

        if (!response.text) {
            throw new Error("Empty response from AI.");
        }

        const lessonData = JSON.parse(response.text) as TheoryLesson;

        // Salva no cache do Supabase para a próxima vez
        const { error: upsertError } = await supabase
            .from('lessons_cache')
            .upsert({ topic: topic, lesson_data: lessonData });

        if (upsertError) {
            console.error('Error saving lesson to Supabase cache:', upsertError.message);
        }

        return lessonData;

    } catch (error) {
        console.error(`Error generating theory lesson for topic "${topic}", returning mock lesson:`, error);

        // Intelligent Fallback: Check which subject the topic belongs to
        let subject: keyof typeof syllabus | 'Unknown' = 'Unknown';
        for (const subj in syllabus) {
            if (syllabus[subj as keyof typeof syllabus].includes(topic)) {
                subject = subj as keyof typeof syllabus;
                break;
            }
        }

        if (subject === 'Língua Portuguesa') {
            console.log("Serving Portuguese fallback lesson.");
            return mockLessonPortugues;
        } else {
            console.log("Serving Math fallback lesson.");
            return mockLesson; // Default to math mock
        }
    }
};

export const validateExamAnswer = async (question: Question, incorrectAnswer: string): Promise<AiExplanation | null> => {
    const prompt = `
    Você é um tutor de IA especialista no concurso da PMERJ (Polícia Militar do Rio de Janeiro). Sua missão é fornecer explicações claras e detalhadas para questões de provas anteriores, ajudando um concurseiro adulto a entender não apenas o porquê errou, mas como o conteúdo é cobrado pela banca (ex: FGV).

    ${question.baseText ? `**Texto Base da Questão:**\n---\n${question.baseText}\n---\n` : ''}

    **Análise da Questão:**
    **Tópico da Questão:** ${question.topic}
    **Questão da Prova:** "${question.text}"
    **Opções:** ${question.options.join('; ')}
    **Resposta Correta:** "${question.options[question.correctOptionIndex]}"
    **Resposta do Aluno (Incorreta):** "${incorrectAnswer}"

    **Sua Tarefa (Retorne em formato JSON):**

    1.  **attentionDetail:** Explique de forma simples e direta por que a resposta do aluno está incorreta. Foque no raciocínio errado que ele pode ter tido.
    2.  **keyInsight:** Com base no tópico "${question.topic}", explique o conceito teórico chave que a questão está avaliando e como a banca usou a questão para testar esse conhecimento.
    3.  **analogy.text:** Mostre o passo a passo ou o raciocínio correto para chegar à resposta certa.
    Sua resposta deve ser *exclusivamente* o objeto JSON puro, sem markdown ou qualquer outro texto.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        attentionDetail: { type: Type.STRING },
                        keyInsight: { type: Type.STRING },
                        analogy: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                imageUrl: { type: Type.STRING }
                            },
                            required: ['text']
                        },
                    },
                    required: ['attentionDetail', 'keyInsight', 'analogy']
                }
            }
        });

        if (response.text) {
            // Gemini might return an object without the optional fields, so we ensure they exist.
            const parsed = JSON.parse(response.text);
            return {
                ...parsed,
                quickChallenge: parsed.quickChallenge || null,
                analogy: {
                    imageUrl: parsed.analogy?.imageUrl || '',
                    ...parsed.analogy
                }
            } as AiExplanation;
        }
        return null;

    } catch (error) {
        console.error("Error validating exam answer:", error);
        return getAIExplanation(question, incorrectAnswer); // Fallback to the generic explanation
    }
};

export const generateReinforcementQuestions = async (subject: string, topic: string): Promise<Question[] | null> => {
    const prompt = `
    Você é um tutor de IA especializado no concurso da Polícia Militar do Estado do Rio de Janeiro (PMERJ) - FGV.
    O aluno errou uma questão ou solicitou um Treino de Reforço no seguinte tópico:
    
    Matéria: ${subject}
    Tópico: ${topic}
    
    Sua missão é gerar exatamente 3 (três) questões de múltipla escolha INÉDITAS focadas neste tópico, no nível de dificuldade da banca FGV para soldados.
    
    Regras:
    1. Se for compreensão de texto de Língua Portuguesa, crie um pequeno texto base ('baseText') comum para as 3 questões ou um para cada.
    2. Cada questão deve ter 4 alternativas (A, B, C, D).
    3. Apenas uma alternativa correta por questão.
    4. Forneça o índice da alternativa correta (0 para A, 1 para B, etc).
    
    Sua resposta deve ser *exclusivamente* o objeto JSON puro, seguindo exatamente este array:
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            subject: { type: Type.STRING },
                            topic: { type: Type.STRING },
                            baseText: { type: Type.STRING },
                            text: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctOptionIndex: { type: Type.INTEGER },
                        },
                        required: ['subject', 'topic', 'text', 'options', 'correctOptionIndex']
                    }
                }
            }
        });

        if (response.text) {
            const generatedQuestions = JSON.parse(response.text) as Omit<Question, 'id'>[];
            return generatedQuestions.map(q => ({
                ...q,
                id: `gen-reinforce-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
            }));
        }
        return null;

    } catch (error) {
        console.error("Error generating reinforcement questions:", error);
        return null;
    }
};