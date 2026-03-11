
import React from 'react';
import { DashboardStats } from '../services/statsService';

interface DashboardSummaryProps {
    stats: DashboardStats | null;
}

const StatBox: React.FC<{ label: string; value: string | number; subtext?: string; icon: string; color: string }> = ({ label, value, subtext, icon, color }) => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full ${color.replace('text-', 'bg-').replace('500', '100').replace('600', '100')} dark:bg-opacity-20 flex items-center justify-center`}>
            <span className={`material-icons-round ${color} text-2xl`}>{icon}</span>
        </div>
        <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white">{value}</h4>
            {subtext && <p className="text-xs text-slate-400 font-medium">{subtext}</p>}
        </div>
    </div>
);

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ stats }) => {
    const totalQuestions = (stats?.portuguesTotal || 0) + (stats?.matematicaTotal || 0) + (stats?.direitosHumanosTotal || 0) + (stats?.legislacaoTotal || 0);
    const totalCorrect = (stats?.portuguesCorrect || 0) + (stats?.matematicaCorrect || 0) + (stats?.direitosHumanosCorrect || 0) + (stats?.legislacaoCorrect || 0);
    const overallAcc = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatBox
                label="Total Resolvido"
                value={totalQuestions}
                subtext="Questões no sistema"
                icon="quiz"
                color="text-blue-600"
            />
            <StatBox
                label="Desempenho Geral"
                value={`${overallAcc}%`}
                subtext={`${totalCorrect} acertos no total`}
                icon="track_changes"
                color="text-green-500"
            />
            <StatBox
                label="Atenção"
                value={stats?.criticalTopics.length || 0}
                subtext="Tópicos críticos para focar"
                icon="warning"
                color="text-amber-500"
            />
        </div>
    );
};

export default DashboardSummary;
