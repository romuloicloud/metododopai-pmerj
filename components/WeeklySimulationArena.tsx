import React, { useState } from 'react';
import { View, UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';

interface Props {
    userProfile: UserProfile | null;
    onBack: () => void;
}

const WeeklySimulationArena: React.FC<Props> = ({ userProfile, onBack }) => {
    const [isLoadingPayment, setIsLoadingPayment] = useState(false);

    const handleKiwifyCheckout = () => {
        setIsLoadingPayment(true);
        // Link real de checkout Kiwify a ser substituído pelo link do cliente
        const kiwifyCheckoutUrl = "https://pay.kiwify.com.br/OcMEGk5";

        let url = kiwifyCheckoutUrl;
        if (userProfile?.email) {
            url += `?email=${encodeURIComponent(userProfile.email)}`;
        }

        setTimeout(() => {
            window.location.href = url;
            setIsLoadingPayment(false);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-900 px-6 py-8 pb-32 flex flex-col pt-12">
            <header className="flex items-center gap-3 mb-8">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 transition-colors">
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="material-icons-round text-yellow-500 animate-pulse text-2xl">local_fire_department</span>
                    <h1 className="text-xl font-bold text-white font-display uppercase tracking-widest">Simulado Inédito</h1>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] mb-8">
                    <span className="material-icons-round text-5xl text-white">workspace_premium</span>
                </div>

                <h2 className="text-3xl font-black text-white text-center mb-4 font-display leading-tight">
                    O Segredo da Aprovação <br /><span className="text-emerald-400">custa R$ 9,90.</span>
                </h2>

                <p className="text-slate-300 text-center mb-8 font-grotesk text-lg px-4 leading-relaxed">
                    Todo fim de semana, a nossa Inteligência Artificial analisa o padrão atual da FGV e cria um simulado <strong className="text-white">100% inédito</strong> que ninguém nunca viu.
                </p>

                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8 w-full space-y-4">
                    <div className="flex items-start gap-3">
                        <span className="material-icons-round text-emerald-400">check_circle</span>
                        <p className="text-sm text-slate-200">Questões exclusivas, impossíveis de achar no Google.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="material-icons-round text-emerald-400">check_circle</span>
                        <p className="text-sm text-slate-200">Ranking semanal com os concorrentes reais.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="material-icons-round text-emerald-400">check_circle</span>
                        <p className="text-sm text-slate-200">Acesso via PIX (Liberação imediata no app).</p>
                    </div>
                </div>

                <div className="w-full relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <button
                        onClick={handleKiwifyCheckout}
                        disabled={isLoadingPayment}
                        className="relative w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 px-6 rounded-xl text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:scale-100 uppercase tracking-wider shadow-xl"
                    >
                        {isLoadingPayment ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="material-icons-round">pix</span>
                                Desbloquear por R$ 9,90
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-4 font-grotesk">
                        Pagamento 100% seguro via Kiwify. Acesso vitalício a este simulado.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default WeeklySimulationArena;
