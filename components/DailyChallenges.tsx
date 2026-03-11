import React from 'react';
import { DailyChallenge } from '../types';

interface Props {
    challenge: DailyChallenge | null;
    onClaim: () => void;
}

const DailyChallenges: React.FC<Props> = ({ challenge, onClaim }) => {
    // If null, we default to 0s
    const qA = challenge?.questionsAnswered || 0;
    const cA = challenge?.correctAnswers || 0;
    const tC = challenge?.trainingsCompleted || 0;
    const isClaimed = challenge?.claimed || false;

    // Goals (can be parameterized later)
    const TARGET_QUESTIONS = 10;
    const TARGET_CORRECT = 5;
    const TARGET_TRAINING = 1;

    const progress1 = Math.min(100, (qA / TARGET_QUESTIONS) * 100);
    const progress2 = Math.min(100, (cA / TARGET_CORRECT) * 100);
    const progress3 = Math.min(100, (tC / TARGET_TRAINING) * 100);

    const isAllComplete = (qA >= TARGET_QUESTIONS) && (cA >= TARGET_CORRECT) && (tC >= TARGET_TRAINING);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-icons-round text-amber-500">emoji_events</span>
                    <h3 className="font-bold text-slate-800 dark:text-white">Desafios Diários</h3>
                </div>
                {!isAllComplete && (
                    <span className="text-xs font-bold text-slate-400">Restam alguns!</span>
                )}
                {isAllComplete && isClaimed && (
                    <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Prontinho!</span>
                )}
            </div>

            <div className="space-y-4">
                {/* Desafio 1 */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            🌟 Responder {TARGET_QUESTIONS} questões
                        </span>
                        <span className="text-xs font-bold text-slate-500">{Math.min(qA, TARGET_QUESTIONS)}/{TARGET_QUESTIONS}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 flex overflow-hidden">
                        <div className="bg-amber-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress1}%` }}></div>
                    </div>
                </div>

                {/* Desafio 2 */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            🎯 Acertar {TARGET_CORRECT} questões
                        </span>
                        <span className="text-xs font-bold text-slate-500">{Math.min(cA, TARGET_CORRECT)}/{TARGET_CORRECT}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 flex overflow-hidden">
                        <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress2}%` }}></div>
                    </div>
                </div>

                {/* Desafio 3 */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            🏋️ Fazer 1 Treino de Reforço
                        </span>
                        <span className="text-xs font-bold text-slate-500">{Math.min(tC, TARGET_TRAINING)}/{TARGET_TRAINING}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 flex overflow-hidden">
                        <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress3}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Recompensa */}
            {isAllComplete && !isClaimed && (
                <div className="mt-5 animate-slide-up">
                    <button
                        onClick={onClaim}
                        className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-round">redeem</span>
                        Resgatar 50 XP!
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">A recompensa expira à meia-noite!</p>
                </div>
            )}
        </div>
    );
};

export default DailyChallenges;
