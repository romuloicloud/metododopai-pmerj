
import React, { useState, useEffect } from 'react';
import { getRankingData } from '../services/statsService';
import { RankEntry } from '../types';
import { CrownIcon, TrendUpIcon, TrendSameIcon } from './icons';
import { supabase } from '../services/supabaseClient';

const Podium: React.FC<{ topThree: RankEntry[] }> = ({ topThree }) => {
    const p1 = topThree[0];
    const p2 = topThree[1];
    const p3 = topThree[2];

    return (
        <div className="flex items-end justify-center gap-3 mt-8 mb-4 h-48">
            {p2 && (
                <div className="flex flex-col items-center">
                    <div className="relative mb-2">
                        <img alt="Avatar 2" className="w-14 h-14 rounded-full border-4 border-custom-silver object-cover bg-slate-700" src={p2.avatarUrl} />
                        <div className="absolute -bottom-2 -right-1 bg-custom-silver text-primary text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-primary">2º</div>
                    </div>
                    <span className="text-xs font-bold truncate w-16 text-center text-white">{p2.name}</span>
                    <div className="h-14 w-12 bg-custom-silver/20 rounded-t-lg mt-1 flex items-end justify-center pb-2">
                        <span className="text-xs font-black text-white">{p2.xp}</span>
                    </div>
                </div>
            )}
            {p1 && (
                <div className="flex flex-col items-center">
                    <div className="relative mb-2 scale-110">
                        <img alt="Avatar 1" className="w-16 h-16 rounded-full border-4 border-custom-gold object-cover shadow-lg bg-slate-700" src={p1.avatarUrl} />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-custom-gold animate-bounce">
                            <CrownIcon />
                        </div>
                        <div className="absolute -bottom-2 -right-1 bg-custom-gold text-primary text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-primary">1º</div>
                    </div>
                    <span className="text-sm font-black truncate w-20 text-center text-white">{p1.name}</span>
                    <div className="h-20 w-16 bg-custom-gold/30 rounded-t-lg mt-1 flex items-end justify-center pb-2 border-x border-t border-custom-gold/40">
                        <span className="text-sm font-black text-custom-gold">{p1.xp}</span>
                    </div>
                </div>
            )}
            {p3 && (
                <div className="flex flex-col items-center">
                    <div className="relative mb-2">
                        <img alt="Avatar 3" className="w-14 h-14 rounded-full border-4 border-custom-bronze object-cover bg-slate-700" src={p3.avatarUrl} />
                        <div className="absolute -bottom-2 -right-1 bg-custom-bronze text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-primary">3º</div>
                    </div>
                    <span className="text-xs font-bold truncate w-16 text-center text-white">{p3.name}</span>
                    <div className="h-10 w-12 bg-custom-bronze/20 rounded-t-lg mt-1 flex items-end justify-center pb-2">
                        <span className="text-xs font-black text-white">{p3.xp}</span>
                    </div>
                </div>
            )}
        </div>
    )
};


const Ranking: React.FC = () => {
    const [ranking, setRanking] = useState<RankEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'GERAL' | 'SIMULADO'>('GERAL');

    useEffect(() => {
        const fetchRanking = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);

            const data = await getRankingData();
            setRanking(data);
            setIsLoading(false);
        };
        fetchRanking();
    }, []);

    const currentUserRank = ranking.find(u => u.name !== 'Aluno' && u.userId === currentUserId)
        || ranking.find(u => u.userId === currentUserId);

    const myEntry = currentUserRank;
    const totalXP = ranking.length > 0 ? (ranking.find(r => r.rank === 1)?.xp || 0) : 0;

    // Conquistas dinâmicas baseadas nos dados
    const achievements = [
        { id: 'first_steps', icon: 'emoji_events', name: 'Primeiros Passos', achieved: (myEntry?.xp || 0) > 0, description: 'Completou sua primeira questão' },
        { id: 'math_star', icon: 'functions', name: 'Estrela da Matemática', achieved: (myEntry?.xp || 0) >= 500, description: 'Acerte 50 questões de Matemática' },
        { id: 'port_master', icon: 'menu_book', name: 'Mestre do Português', achieved: (myEntry?.xp || 0) >= 1000, description: 'Acerte 50 questões de Português' },
        { id: 'fire_streak', icon: 'local_fire_department', name: '5 Dias de Fogo', achieved: false, description: 'Estude 5 dias seguidos' },
        { id: 'fast_thinker', icon: 'bolt', name: 'Pensador Veloz', achieved: false, description: 'Responda 10 questões em menos de 30s' },
        { id: 'top3', icon: 'workspace_premium', name: 'Top 3 Ranking', achieved: myEntry ? myEntry.rank <= 3 : false, description: 'Fique entre os 3 primeiros' },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-background-dark">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <h2 className="mt-4 text-lg font-semibold text-slate-300">Carregando ranking...</h2>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-full pb-24">
            <header className="pt-10 px-6 pb-4 bg-primary text-white shadow-xl relative z-10">
                <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-extrabold tracking-tight">Ranking Oficial</h1>
                    <p className="text-blue-200 text-sm mt-1 opacity-90">Como você está em relação à concorrência?</p>
                </div>

                {/* Abas do Ranking */}
                <div className="flex justify-center mt-6 bg-white/10 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('GERAL')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'GERAL' ? 'bg-white text-primary shadow-sm' : 'text-blue-100 hover:bg-white/5'}`}
                    >
                        Público Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('SIMULADO')}
                        className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-sm font-bold rounded-lg transition-colors relative overflow-hidden ${activeTab === 'SIMULADO' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md' : 'text-emerald-300 hover:bg-white/5'}`}
                    >
                        {activeTab !== 'SIMULADO' && <span className="material-icons-round text-[14px] text-yellow-300">workspace_premium</span>}
                        Elite (Simulados)
                    </button>
                </div>
            </header>

            <main className="px-5 pt-6 space-y-8 max-w-5xl mx-auto w-full relative z-0">
                {activeTab === 'GERAL' && (
                    <div className="animate-fade-in-up">
                        {ranking.length === 0 && (
                            <p className="text-slate-500 text-center text-sm mt-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                Nenhum candidato pontuou ainda hoje. Pratique para ser o primeiro! 🎯
                            </p>
                        )}
                        {ranking.length > 0 && <Podium topThree={ranking.slice(0, 3)} />}
                        {ranking.length > 3 && (
                            <section className="space-y-3">
                                <div className="flex justify-between items-center px-1 mb-2">
                                    <h3 className="text-xs font-black text-primary/50 dark:text-slate-400 uppercase tracking-widest">Top Estudantes</h3>
                                </div>
                                <div className="space-y-2">
                                    {ranking.slice(3).map(entry => (
                                        <div key={entry.rank} className="flex items-center gap-4 bg-white dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <span className="text-sm font-black text-slate-400 w-4">{entry.rank}º</span>
                                            <img className="w-10 h-10 rounded-full bg-slate-700 object-cover" src={entry.avatarUrl} alt={entry.name} />
                                            <div className="flex-1">
                                                <h5 className="text-sm font-bold text-slate-800 dark:text-white">{entry.name}</h5>
                                                <p className="text-[10px] text-slate-500">{entry.xp} pontos</p>
                                            </div>
                                            {entry.trend === 'up' && <TrendUpIcon className="text-green-500" />}
                                            {entry.trend === 'same' && <TrendSameIcon className="text-slate-400" />}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="space-y-4">
                            <h3 className="text-xs font-black text-primary/50 dark:text-slate-400 uppercase tracking-widest">Suas Conquistas</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {achievements.map(badge => (
                                    <div key={badge.id} className={`flex flex-col items-center text-center gap-2 ${!badge.achieved && 'opacity-50 grayscale'}`}>
                                        <div className={`w-16 h-16 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border-4 ${badge.achieved ? 'border-custom-gold' : 'border-slate-200 dark:border-slate-700'}`}>
                                            <span className={`material-icons-round text-3xl ${badge.achieved ? 'text-custom-gold' : 'text-slate-300 dark:text-slate-600'}`}>{badge.icon}</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{badge.name}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'SIMULADO' && (
                    <div className="animate-fade-in-up">
                        <section className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-6 text-center border border-slate-700 shadow-2xl relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

                            <span className="material-icons-round text-6xl text-emerald-400 mb-3 block">lock_person</span>
                            <h2 className="text-2xl font-black text-white mb-2 leading-tight">Elite da PMERJ</h2>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed px-4">
                                Concorrentes focados não revelam seus resultados à toa. Apenas quem faz os <strong className="text-emerald-400">Simulados Inéditos</strong> tem acesso à verdadeira Nota de Corte e média dos aprovados do final de semana.
                            </p>

                            <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/50 space-y-3">
                                {[1, 2, 3].map((pos) => (
                                    <div key={pos} className="flex flex-row items-center justify-between opacity-50 blur-[2px] pointer-events-none p-2 border-b border-slate-800 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-500">{pos}º</span>
                                            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center"><span className="material-icons-round text-sm text-slate-400">person</span></div>
                                            <span className="w-24 h-4 bg-slate-700 rounded block"></span>
                                        </div>
                                        <span className="w-12 h-4 bg-emerald-900/50 rounded block hidden sm:block"></span>
                                    </div>
                                ))}
                            </div>

                            <a href="https://pay.kiwify.com.br/OcMEGk5" target="_blank" rel="noopener noreferrer" className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-wider py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform hover:scale-[1.02]">
                                Desbloquear Simulado e Ranking (R$ 9,90)
                            </a>
                            <p className="text-xs text-slate-500 mt-4 flex items-center justify-center gap-1">
                                <span className="material-icons-round text-[14px]">verified_user</span> Compare-se com quem vai assumir as vagas
                            </p>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Ranking;
