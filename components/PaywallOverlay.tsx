import React from 'react';
import { ShieldAlert, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { UserProfile } from '../types';

interface PaywallOverlayProps {
    userProfile?: UserProfile | null;
    featureName: string;
}

export function PaywallOverlay({ userProfile, featureName }: PaywallOverlayProps) {
    // Preenchendo o email no checkout da Kiwify para conciliação automática do webhook
    const kiwifyCheckoutUrl = userProfile?.email
        ? `https://pay.kiwify.com.br/XizzAgJ?email=${encodeURIComponent(userProfile.email)}`
        : 'https://pay.kiwify.com.br/XizzAgJ';

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            {/* Background Blur */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm dark:bg-gray-900/60 transition-all duration-300 rounded-2xl" />

            {/* Main Card */}
            <div className="relative z-10 max-w-lg w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 mx-auto mt-[-10vh] animate-in fade-in zoom-in duration-300">

                {/* Header Gradient */}
                <div className="h-32 bg-gradient-to-br from-green-500 to-emerald-700 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
                        <Lock className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Acesso Exclusivo Premium
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        O recurso <strong className="text-green-600 dark:text-green-400">{featureName}</strong> é exclusivo para assinantes da Plataforma Método do Pai.
                    </p>

                    <div className="space-y-3 mb-8 text-left max-w-sm mx-auto">
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                            Simulados Inéditos Semanais
                        </div>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                            Tutor de Inteligência Artificial Particular
                        </div>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                            Estatísticas Avançadas de Posicionamento
                        </div>
                    </div>

                    <a
                        href={kiwifyCheckoutUrl}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all bg-green-600 hover:bg-green-700 rounded-full shadow-lg shadow-green-500/30 hover:scale-105"
                    >
                        Desbloquear Acesso Completo
                        <ChevronRight className="w-5 h-5 ml-2" />
                    </a>

                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4 mr-1 opacity-70" />
                        Liberação Imediata Pós-Pagamento
                    </p>
                </div>
            </div>
        </div>
    );
}
