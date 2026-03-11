import React, { useState } from 'react';
import { Question, AiExplanation } from '../types';
import { validateExamAnswer } from '../services/geminiService';
import { saveResult } from '../services/statsService';
import { supabase } from '../services/supabaseClient';
import { CheckCircleIcon, CloseIcon } from './icons';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface Props {
    questions: Question[];
    topic: string;
    onClose: () => void;
}

const ReinforcementArena: React.FC<Props> = ({ questions, topic, onClose }) => {
    const [questionIndex, setQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [aiExplanation, setAiExplanation] = useState<AiExplanation | null>(null);
    const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const { play, stop, isPlaying, isSupported } = useTextToSpeech();

    const currentQuestion = questions[questionIndex];

    const handleAnswer = async (index: number) => {
        if (isCorrect !== null) return;

        setSelectedOption(index);
        const correct = index === currentQuestion.correctOptionIndex;
        setIsCorrect(correct);

        // Opcional: Salvar estatísticas do treino
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await saveResult(user.id, currentQuestion.subject as any, currentQuestion.topic, correct, 0);
        }

        if (correct) {
            setScore(s => s + 1);
            setTimeout(handleNextQuestion, 1200);
        } else {
            setIsLoadingExplanation(true);
            setShowExplanation(true);
            const explanation = await validateExamAnswer(currentQuestion, currentQuestion.options[index]);
            setAiExplanation(explanation);
            setIsLoadingExplanation(false);
        }
    };

    const handleNextQuestion = () => {
        setSelectedOption(null);
        setIsCorrect(null);
        setShowExplanation(false);
        setAiExplanation(null);

        if (questionIndex + 1 < questions.length) {
            setQuestionIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    const getOptionClasses = (index: number) => {
        let classes = 'w-full p-4 text-left border rounded-xl transition-all flex items-center gap-4 ';
        if (selectedOption === index) {
            classes += isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20';
        } else if (isCorrect !== null && index === currentQuestion.correctOptionIndex) {
            classes += 'border-green-500 bg-green-50 dark:bg-green-900/20';
        } else {
            classes += 'bg-slate-800/40 border-slate-700/50 hover:bg-indigo-500/10 hover:border-indigo-500/30';
        }
        return classes;
    };

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 rounded-2xl shadow-2xl h-full pb-20">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold font-display text-white mb-2">Treino Concluído!</h2>
                <p className="text-slate-300 font-grotesk text-center mb-6">
                    Você treinou o tópico <span className="font-bold text-indigo-300">{topic}</span>.
                </p>
                <div className="text-4xl font-black text-indigo-400 mb-8">{score} / {questions.length} <span className="text-lg font-bold text-slate-500">Acertos</span></div>

                <button
                    onClick={onClose}
                    className="w-full max-w-sm px-6 py-4 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] active:scale-95 transition-all text-lg"
                >
                    Voltar para a Prova Anterior
                </button>
            </div>
        );
    }

    const progressPercentage = ((questionIndex + 1) / questions.length) * 100;

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white rounded-xl shadow-2xl overflow-hidden border border-indigo-500/20">
            <header className="px-6 pt-6 pb-4 bg-gradient-to-r from-indigo-900 to-slate-900 border-b border-indigo-500/20 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-bold font-grotesk uppercase tracking-widest text-indigo-300">
                    <span>⚡ Treino de Reforço Infinito</span>
                    <span>{questionIndex + 1} DE {questions.length}</span>
                </div>
                {/* Barra de Progresso do Treino */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 transition-all duration-300" style={{ width: progressPercentage + "%" }} />
                </div>
            </header>
            <main className="flex-1 overflow-y-auto px-6 py-6 pb-24">
                <div className="mb-6">
                    <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">{currentQuestion.subject} • {currentQuestion.topic}</span>

                    {currentQuestion.baseText && (
                        <div className="mb-4 p-4 bg-slate-800 border border-slate-700 rounded-xl shadow-inner max-h-48 overflow-y-auto">
                            <p className="text-sm text-slate-300 whitespace-pre-wrap font-grotesk">{currentQuestion.baseText}</p>
                        </div>
                    )}

                    <div className="flex items-start justify-between gap-3 mb-4">
                        <h2 className="text-xl font-bold font-display text-white flex-1 leading-snug">
                            {currentQuestion.text}
                        </h2>
                        {isSupported && (
                            <button
                                onClick={() => {
                                    if (isPlaying) {
                                        stop();
                                    } else {
                                        const textBasePart = currentQuestion.baseText ? currentQuestion.baseText + '. ' : '';
                                        const optionsPart = currentQuestion.options.map((opt, i) => "Letra " + String.fromCharCode(65 + i) + ": " + opt).join('. ');
                                        const textToRead = textBasePart + currentQuestion.text + ". As alternativas são: " + optionsPart + ".";
                                        play(textToRead);
                                    }
                                }}
                                className={`p-3 rounded-full shrink-0 transition-colors shadow-sm cursor-pointer ${isPlaying ? 'bg-indigo-500 text-white shadow-indigo-500/30 animate-pulse' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                                title={isPlaying ? "Parar leitura" : "Ouvir questão"}
                            >
                                <span className="material-icons-round text-xl">{isPlaying ? 'stop' : 'volume_up'}</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                        <button key={index} onClick={() => handleAnswer(index)} className={getOptionClasses(index)} disabled={isCorrect !== null}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${selectedOption === index ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-300'}`}>{String.fromCharCode(65 + index)}</div>
                            <span className="text-sm font-medium flex-1 text-left text-slate-200">{option}</span>
                            {selectedOption === index && isCorrect && <CheckCircleIcon className="text-green-500" />}
                            {selectedOption === index && !isCorrect && isCorrect !== null && <CloseIcon className="text-red-500" />}
                        </button>
                    ))}
                </div>

                {isCorrect && (
                    <div className="mt-8 animate-fade-in">
                        <button onClick={handleNextQuestion} className="w-full py-4 text-white font-bold bg-green-500 hover:bg-green-600 rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95 text-lg">
                            ✅ Acertou! Próxima →
                        </button>
                    </div>
                )}

                {/* Área do Tutor em caso de erro no treino */}
                {showExplanation && (
                    <div className="mt-8 p-6 bg-slate-800/80 rounded-2xl border border-indigo-500/30 shadow-lg animate-slide-up relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
                        <h3 className="text-indigo-400 font-bold font-display flex items-center gap-2 mb-4">
                            <span className="material-icons-round">smart_toy</span> A IA do Pai Explica
                        </h3>
                        {isLoadingExplanation ? (
                            <div className="flex items-center gap-3 text-slate-400 font-grotesk text-sm">
                                <span className="material-icons-round animate-spin">loop</span> Formulando resposta...
                            </div>
                        ) : aiExplanation ? (
                            <div className="space-y-4 font-grotesk relative z-10">
                                <div className="p-4 bg-red-500/10 border-l-2 border-red-500 rounded-r-lg">
                                    <p className="text-sm text-red-200">{aiExplanation.attentionDetail}</p>
                                </div>
                                <div className="p-4 bg-indigo-500/10 border-indigo-500/30 border rounded-xl">
                                    <p className="text-xs text-indigo-300 font-bold mb-1">Dica de Ouro:</p>
                                    <p className="text-sm text-slate-300">{aiExplanation.keyInsight}</p>
                                </div>
                                <button onClick={handleNextQuestion} className="w-full mt-2 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-white transition-colors">
                                    {questionIndex + 1 < questions.length ? 'Ir para Próxima Questão do Treino' : 'Finalizar Treino'}
                                </button>
                            </div>
                        ) : null}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ReinforcementArena;
