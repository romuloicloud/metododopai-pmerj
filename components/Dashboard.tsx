import React, { useState, useEffect } from 'react';
import { View, UserStreak, DailyChallenge } from '../types';
import { mockUser } from '../services/mockData';
import { getDashboardStats, DashboardStats, getUserStreak, getDailyChallenge, claimDailyChallenge } from '../services/statsService';
import { supabase } from '../services/supabaseClient';
import { AlertIcon } from './icons';
import DashboardSummary from './DashboardSummary';
import AvatarUpload from './AvatarUpload';
import StreakBadge from './StreakBadge';
import DailyChallenges from './DailyChallenges';

const SubjectStatCard: React.FC<{
    subject: string;
    accuracy: number;
    correct: number;
    total: number;
    icon: string;
    color: string;
}> = ({ subject, accuracy, correct, total, icon, color }) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-3">
            <span className={`material-icons-round text-2xl ${color}`}>{icon}</span>
            <h3 className="font-bold text-slate-800 dark:text-white">{subject}</h3>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2">
            <div className={`h-2 rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${accuracy}%`, transition: 'width 0.5s ease-in-out' }}></div>
        </div>
        <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{correct} / {total} acertos</span>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{accuracy}%</span>
        </div>
    </div>
);

import { getDiagnosticResult } from '../services/diagnosticService';
import { DiagnosticResult } from '../types';

interface Props {
    setView?: (view: View) => void;
    onSelectSubject?: (subject: string) => void;
}

const Dashboard: React.FC<Props> = ({ setView, onSelectSubject }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
    const [userName, setUserName] = useState<string>('Aluno');
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState('');

    // Novas states de engajamento
    const [streak, setStreak] = useState<UserStreak | null>(null);
    const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
    const [currentGlobalMastery, setCurrentGlobalMastery] = useState<number>(0);
    const [subjectMastery, setSubjectMastery] = useState({ portugues: 0, matematica: 0, direitosHumanos: 0, legislacao: 0 });

    const getSubjectGradient = (value: number) => {
        if (value >= 75) return 'from-emerald-400 to-emerald-600';
        if (value >= 50) return 'from-blue-400 to-primary';
        return 'from-amber-400 to-orange-500';
    };

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserName(user.user_metadata.full_name || 'Aluno');
                setUserId(user.id);
                setAvatarUrl(user.user_metadata.avatar_url || null);

                const userStats = await getDashboardStats(user.id);
                setStats(userStats);

                const diagnosticData = await getDiagnosticResult(user.id);
                setDiagnostic(diagnosticData);

                const userStreak = await getUserStreak(user.id);
                setStreak(userStreak);

                const dailyChallenge = await getDailyChallenge(user.id);
                setChallenge(dailyChallenge);

                if (diagnosticData?.pmerjGlobalMastery !== undefined) {
                    let mastery = diagnosticData.pmerjGlobalMastery;

                    // Se o aluno já praticou (tem stats), fundir os dados para um progresso contínuo
                    if (userStats) {
                        const diagPtCorrect = diagnosticData.answers.filter(a => a.subject.includes('Portugu') && a.isCorrect).length;
                        const diagPtTotal = diagnosticData.answers.filter(a => a.subject.includes('Portugu')).length || 1;
                        const diagMatCorrect = diagnosticData.answers.filter(a => a.subject.includes('Matem') && a.isCorrect).length;
                        const diagMatTotal = diagnosticData.answers.filter(a => a.subject.includes('Matem')).length || 1;
                        const diagDhCorrect = diagnosticData.answers.filter(a => a.subject.includes('Humanos') && a.isCorrect).length;
                        const diagDhTotal = diagnosticData.answers.filter(a => a.subject.includes('Humanos')).length || 1;
                        const diagLegCorrect = diagnosticData.answers.filter(a => a.subject.includes('Legisla') && a.isCorrect).length;
                        const diagLegTotal = diagnosticData.answers.filter(a => a.subject.includes('Legisla')).length || 1;

                        const ptPercent = (diagPtCorrect + userStats.portuguesCorrect) / (diagPtTotal + userStats.portuguesTotal);
                        const matPercent = (diagMatCorrect + userStats.matematicaCorrect) / (diagMatTotal + userStats.matematicaTotal);
                        const dhPercent = (diagDhCorrect + userStats.direitosHumanosCorrect) / (diagDhTotal + userStats.direitosHumanosTotal);
                        const legPercent = (diagLegCorrect + userStats.legislacaoCorrect) / (diagLegTotal + userStats.legislacaoTotal);

                        setSubjectMastery({
                            portugues: Math.round(ptPercent * 100),
                            matematica: Math.round(matPercent * 100),
                            direitosHumanos: Math.round(dhPercent * 100),
                            legislacao: Math.round(legPercent * 100)
                        });

                        mastery = Math.round(
                            (ptPercent * 30) +
                            (legPercent * 30) +
                            (dhPercent * 20) +
                            (matPercent * 20)
                        );
                    } else {
                        // Diagnostic without practice yet
                        // Calculate basic subject mastery only from diagnostic
                        const ptScore = diagnosticData.answers.filter(a => a.subject.includes('Portugu') && a.isCorrect).length;
                        const ptTotal = diagnosticData.answers.filter(a => a.subject.includes('Portugu')).length || 1;

                        const matScore = diagnosticData.answers.filter(a => a.subject.includes('Matem') && a.isCorrect).length;
                        const matTotal = diagnosticData.answers.filter(a => a.subject.includes('Matem')).length || 1;

                        const dhScore = diagnosticData.answers.filter(a => a.subject.includes('Humanos') && a.isCorrect).length;
                        const dhTotal = diagnosticData.answers.filter(a => a.subject.includes('Humanos')).length || 1;

                        const legScore = diagnosticData.answers.filter(a => a.subject.includes('Legisla') && a.isCorrect).length;
                        const legTotal = diagnosticData.answers.filter(a => a.subject.includes('Legisla')).length || 1;

                        setSubjectMastery({
                            portugues: Math.round((ptScore / ptTotal) * 100),
                            matematica: Math.round((matScore / matTotal) * 100),
                            direitosHumanos: Math.round((dhScore / dhTotal) * 100),
                            legislacao: Math.round((legScore / legTotal) * 100)
                        });
                    }

                    setCurrentGlobalMastery(mastery);

                    if (mastery < 50) {
                        setAlertMessage(`⚠️ Atenção: Seu aproveitamento global focado no edital está em ${mastery}%. A meta para aprovação na PMERJ é cruzar os 75%. Siga sua Jornada Diária e foque nas revisões!`);
                    } else if (mastery >= 50 && mastery < 75) {
                        setAlertMessage(`🔥 Quase lá! Seu nível global na PMERJ é ${mastery}%. Continue treinando as matérias que você teve pior desempenho.`);
                    } else {
                        setAlertMessage(`🏆 Excelente! Com ${mastery}%, você está dentro da margem de aprovação. Pratique usando os Simulados Inéditos para blindar essa nota!`);
                    }
                } else if (userStats) {
                    // Fallback para as stats originais se o diagnostic falhar
                    const totals = [
                        { name: 'Língua Portuguesa', count: userStats.portuguesTotal },
                        { name: 'Matemática Básica', count: userStats.matematicaTotal },
                        { name: 'Direitos Humanos', count: userStats.direitosHumanosTotal },
                        { name: 'Legislação', count: userStats.legislacaoTotal },
                    ].filter(s => s.count > 0);

                    if (totals.length >= 2) {
                        totals.sort((a, b) => b.count - a.count);
                        const highest = totals[0];
                        const lowest = totals[totals.length - 1];
                        if (highest.count > lowest.count * 1.5) {
                            setAlertMessage(`⚠️ Foco no equilíbrio! Você está mandando bem em ${highest.name}, mas não esqueça de praticar ${lowest.name}.`);
                        } else {
                            setAlertMessage(null);
                        }
                    }
                }
            }
        };
        fetchData();
    }, []);

    const handleSaveName = async () => {
        const trimmed = editName.trim();
        if (!trimmed || trimmed === userName) {
            setIsEditingName(false);
            return;
        }
        const { error } = await supabase.auth.updateUser({
            data: { full_name: trimmed }
        });
        if (!error) {
            setUserName(trimmed);
            // Sincronizar com tabela profiles para o ranking
            if (userId) {
                await supabase.from('profiles').upsert({
                    id: userId,
                    full_name: trimmed,
                    avatar_url: avatarUrl || null,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });
            }
        }
        setIsEditingName(false);
    };

    const handleClaimChallenge = async () => {
        if (userId && challenge) {
            const success = await claimDailyChallenge(userId);
            if (success) {
                setChallenge({ ...challenge, claimed: true });
                // Aqui no futuro podemos despachar um evento visual "Ganhou 50 XP!"
            }
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-full pb-safe">
            <header className="bg-primary text-white px-4 py-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <span className="material-icons-round text-2xl animate-spin-slow opacity-90">military_tech</span>
                    <h1 className="text-lg font-bold font-display tracking-wide uppercase">Centro de Inteligência</h1>
                </div>
                <div className="flex items-center gap-3">
                    <StreakBadge streak={streak} />
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="p-1.5 rounded-full hover:bg-white/20 transition-colors bg-white/10"
                        title="Sair da Conta"
                    >
                        <span className="material-icons-round text-[20px]">logout</span>
                    </button>
                </div>
            </header>

            <main className="p-3 space-y-4 max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-4 px-2">
                    <AvatarUpload
                        userId={userId}
                        currentAvatarUrl={avatarUrl}
                        onAvatarChange={(newUrl) => setAvatarUrl(newUrl)}
                    />
                    <div className="flex-1 min-w-0">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveName();
                                        if (e.key === 'Escape') setIsEditingName(false);
                                    }}
                                    autoFocus
                                    maxLength={20}
                                    className="text-lg font-bold text-primary dark:text-blue-400 bg-white dark:bg-slate-800 border border-primary/30 rounded-lg px-3 py-1 w-full outline-none focus:border-primary"
                                    placeholder="Seu nome"
                                />
                                <button onClick={handleSaveName} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                    <span className="material-icons-round text-sm">check</span>
                                </button>
                                <button onClick={() => setIsEditingName(false)} className="p-1.5 bg-slate-400 text-white rounded-lg hover:bg-slate-500 transition-colors">
                                    <span className="material-icons-round text-sm">close</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setEditName(userName); setIsEditingName(true); }}
                                className="flex items-center gap-2 group"
                            >
                                <h2 className="text-xl font-bold text-primary dark:text-blue-400 truncate">{userName}</h2>
                                <span className="material-icons-round text-sm text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                            </button>
                        )}
                        <div className="flex gap-2 mt-1">
                            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Soldado PMERJ</span>
                            <span className="text-xs font-bold bg-accent-gold/10 text-accent-gold px-2 py-0.5 rounded-full">Foco Total</span>
                        </div>
                    </div>
                </div>

                {alertMessage && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 rounded-r-lg flex items-start gap-3">
                        <AlertIcon className="text-amber-500 mt-0.5" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">{alertMessage}</p>
                    </div>
                )}

                <DailyChallenges challenge={challenge} onClaim={handleClaimChallenge} />

                {/* Card Simulado Inédito Semanal (Novo Premium) */}
                <div
                    onClick={() => setView?.('WEEKLY_SIMULATION')}
                    className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl p-5 text-white shadow-lg cursor-pointer hover:scale-[1.01] transition-transform relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <span className="material-icons-round text-7xl">assignment_turned_in</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                        <span className="material-icons-round text-yellow-300">star</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">Exclusivo Premium</span>
                    </div>
                    <h3 className="text-xl font-bold font-display relative z-10 mb-1">Simulado Inédito da Semana</h3>
                    <p className="text-sm text-emerald-50 max-w-[85%] relative z-10 mb-4 font-grotesk">
                        Prepare-se com questões que nunca caíram antes. Novo simulado liberado toda sexta-feira!
                    </p>
                    <button className="bg-white/20 hover:bg-white/30 text-white text-sm font-bold py-2 px-4 rounded-lg backdrop-blur-sm transition-colors relative z-10">
                        Acessar Simulado
                    </button>
                </div>

                {/* Você vs A Prova PMERJ (Evolução Global) */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-md border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-icons-round text-primary text-2xl">radar</span>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Você <span className="text-slate-400 font-normal mx-1">vs</span> A Prova PMERJ</h3>
                    </div>

                    <div className="mb-2 flex justify-between items-end">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Aproveitamento Global (Pesos do Edital)</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-slate-800 dark:text-white">
                                    {currentGlobalMastery}%
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Meta de Aprovação</p>
                            <span className="text-xl font-bold text-slate-400 dark:text-slate-500">75%</span>
                        </div>
                    </div>

                    <div className="relative w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
                        {/* Linha de Meta 75% */}
                        <div className="absolute top-0 bottom-0 left-[75%] w-1 bg-emerald-500 z-10"></div>

                        {/* Barra de Progresso Real */}
                        <div
                            className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2
                                ${currentGlobalMastery >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                                    currentGlobalMastery >= 50 ? 'bg-gradient-to-r from-blue-400 to-primary' :
                                        'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                            style={{ width: `${currentGlobalMastery}%` }}
                        >
                            {currentGlobalMastery > 15 && (
                                <span className="text-[10px] font-bold text-white shadow-sm">
                                    Atual
                                </span>
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1.5">
                        <span className="material-icons-round text-[14px]">info</span>
                        Cálculo baseado no seu Diagnóstico Inicial cruzado com os pesos da FGV.
                    </p>

                    {/* Desempenho por Matéria (Degradê) */}
                    <div className="mt-8">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-4 uppercase tracking-wider">Aproveitamento por Matéria</h4>
                        <div className="space-y-4">
                            {[
                                { id: 'portugues', name: 'Língua Portuguesa', value: subjectMastery.portugues, gradient: getSubjectGradient(subjectMastery.portugues) },
                                { id: 'matematica', name: 'Matemática Básica', value: subjectMastery.matematica, gradient: getSubjectGradient(subjectMastery.matematica) },
                                { id: 'direitosHumanos', name: 'Direitos Humanos', value: subjectMastery.direitosHumanos, gradient: getSubjectGradient(subjectMastery.direitosHumanos) },
                                { id: 'legislacao', name: 'Legislação Aplicada', value: subjectMastery.legislacao, gradient: getSubjectGradient(subjectMastery.legislacao) }
                            ].map(subj => (
                                <div
                                    key={subj.id}
                                    onClick={() => onSelectSubject?.(subj.name)}
                                    className="cursor-pointer group flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                    title="Clique para abrir os tópicos do edital desta matéria"
                                >
                                    <div className="flex-1 mr-4">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{subj.name}</span>
                                            <span className="text-sm font-bold text-slate-500">{subj.value}%</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${subj.gradient}`}
                                                style={{ width: `${subj.value}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="material-icons-round text-slate-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">chevron_right</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SubjectStatCard
                        subject="Língua Portuguesa"
                        accuracy={stats?.portuguesAccuracy ?? 0}
                        correct={stats?.portuguesCorrect ?? 0}
                        total={stats?.portuguesTotal ?? 0}
                        icon="menu_book"
                        color="text-primary"
                    />
                    <SubjectStatCard
                        subject="Matemática Básica"
                        accuracy={stats?.matematicaAccuracy ?? 0}
                        correct={stats?.matematicaCorrect ?? 0}
                        total={stats?.matematicaTotal ?? 0}
                        icon="functions"
                        color="text-amber-500"
                    />
                    <SubjectStatCard
                        subject="Direitos Humanos"
                        accuracy={stats?.direitosHumanosAccuracy ?? 0}
                        correct={stats?.direitosHumanosCorrect ?? 0}
                        total={stats?.direitosHumanosTotal ?? 0}
                        icon="gavel"
                        color="text-emerald-500"
                    />
                    <SubjectStatCard
                        subject="Legislação PMERJ"
                        accuracy={stats?.legislacaoAccuracy ?? 0}
                        correct={stats?.legislacaoCorrect ?? 0}
                        total={stats?.legislacaoTotal ?? 0}
                        icon="policy"
                        color="text-indigo-500"
                    />
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-800 dark:text-white">Assuntos Críticos</h3>
                        {stats && stats.criticalTopics.length > 0 &&
                            <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">{stats.criticalTopics.length} ITENS DE ATENÇÃO</span>
                        }
                    </div>
                    {stats && stats.criticalTopics.length > 0 ? (
                        <div className="space-y-3">
                            {stats.criticalTopics.map(topic => (
                                <button key={topic.topic} onClick={() => setView?.('STUDY_CENTER')} className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-4 border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left">
                                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                        <AlertIcon className="text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">{topic.topic}</h4>
                                        <p className="text-xs text-slate-500">{topic.mastery}% de acerto em {topic.questionsAttempted} questões</p>
                                    </div>
                                    <span className="material-icons-round text-slate-400">chevron_right</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-slate-500 py-4">Nenhum ponto crítico detectado. Continue assim!</p>
                    )}
                </div>

                <div className="bg-gradient-to-br from-primary to-blue-800 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-icons-round text-6xl">auto_awesome</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                        <span className="material-icons-round text-accent-gold">auto_awesome</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-100">Insight Estratégico AI</span>
                    </div>
                    <p className="text-sm leading-relaxed mb-4 relative z-10 text-blue-50">
                        {stats?.criticalTopics && stats.criticalTopics.length > 0
                            ? `"Notamos uma dificuldade em ${stats.criticalTopics[0].topic}. Sugerimos revisar as anotações sobre esse tópico e focar na sua resolução de questões."`
                            : '"Você está com um ótimo nível de acertos gerais, mantenha a frequência de estudos para chegar voando na prova!"'}
                    </p>
                </div>

                {/* Área de Suporte / Feedback VIP */}
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl relative mt-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                            {/* WhatsApp Icon placeholder */}
                            <span className="material-icons-round text-green-400 text-3xl">speaker_notes</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold mb-1">Fale com o Pai (Suporte)</h3>
                            <p className="text-sm text-slate-400 mb-4">Encontrou algum erro bobo, travamento ou tem sugestões para a plataforma? Mande um zap direto para os desenvolvedores!</p>
                            <a
                                href="mailto:metododopai@gmail.com?subject=Feedback%20MVP"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                            >
                                <span className="material-icons-round text-sm">email</span>
                                Enviar por E-mail
                            </a>
                        </div>
                    </div>
                </div>

            </main>
            <div className="h-28"></div>
        </div>
    );
};

export default Dashboard;