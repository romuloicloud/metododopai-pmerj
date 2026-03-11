import React from 'react';
import { UserStreak } from '../types';

interface Props {
    streak: UserStreak | null;
}

const StreakBadge: React.FC<Props> = ({ streak }) => {
    const days = streak ? streak.currentStreak : 0;

    // If streak is 0, show a grayscale or simple badge
    if (days === 0) {
        return (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm" title="Comece sua ofensiva hoje!">
                <span className="text-xl grayscale opacity-50">🔥</span>
                <span className="font-bold text-slate-500 dark:text-slate-400 text-sm">0</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-500/30 shadow-sm" title={`Ofensiva de ${days} dias!`}>
            <span className="text-xl animate-pulse">🔥</span>
            <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">{days}</span>
        </div>
    );
};

export default StreakBadge;
