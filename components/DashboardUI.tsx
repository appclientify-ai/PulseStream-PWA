
import React from 'react';

export const DonutChart: React.FC<{ value: number; total: number; size?: number; strokeWidth?: number }> = ({ value, total, size = 80, strokeWidth = 10 }) => {
    if (total === 0) {
        return (
             <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle cx={size / 2} cy={size / 2} r={(size - strokeWidth) / 2} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">N/A</div>
            </div>
        );
    }

    const percentage = Math.round((value / total) * 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-gray-100 dark:stroke-gray-700" strokeWidth={strokeWidth} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    className="stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-700"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-indigo-600 dark:text-indigo-400">
                {percentage}%
            </div>
        </div>
    );
};

export const StatDisplay: React.FC<{ label: string, value: string | number, color?: string }> = ({ label, value, color = 'text-gray-900 dark:text-white' }) => (
    <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</span>
        <span className={`text-sm font-black ${color}`}>{value}</span>
    </div>
);

export const ModuleStatCard: React.FC<{
    title: string; icon: React.ReactNode;
    filters?: React.ReactNode;
    stats: { label: string; value: string | number; color?: string; }[];
    chartData?: { value: number; total: number; };
    dueDate?: string;
    onClick?: () => void;
}> = ({ title, icon, filters, stats, chartData, dueDate, onClick }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition-shadow group cursor-pointer" onClick={onClick}>
        <div>
            <div className="flex items-center justify-between gap-3 mb-2">
                 <div className="flex items-center gap-3">
                    <div className="text-xl p-2 bg-indigo-50 dark:bg-gray-700 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">{icon}</div>
                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">{title}</h3>
                </div>
                {dueDate && (
                    <div className="text-[9px] text-gray-400 dark:text-gray-500 text-right leading-tight">
                        <span className="font-black uppercase block opacity-60">Target</span> <span>{dueDate}</span>
                    </div>
                )}
            </div>
            {filters && <div className="my-3">{filters}</div>}
            <div className="flex items-center gap-4 mt-2">
                <div className={`flex-grow space-y-0.5 ${chartData ? 'pr-3 border-r dark:border-gray-600' : ''}`}>
                    {stats.map(stat => <StatDisplay key={stat.label} {...stat} />)}
                </div>
                {chartData && (
                    <div className="flex-shrink-0">
                        <DonutChart value={chartData.value} total={chartData.total} />
                    </div>
                )}
            </div>
        </div>
    </div>
);
