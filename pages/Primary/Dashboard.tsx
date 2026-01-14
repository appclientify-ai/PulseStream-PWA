
import React, { useMemo, useState, useEffect } from 'react';
import { useClientData } from '../../hooks/useClientData';
import { useDueDate } from '../../hooks/useDueDate';
import { View, ClientStatus, AuditStatus, BalanceSheetStatus, Client, TaxpayerType, FilingFrequency } from '../../types';
import { 
    ClientIcon, GstReturnIcon, IncomeTaxIcon, GstNoticeIcon, GstAppealIcon, 
    AuditIcon, PaymentIcon, ReminderIcon, SettingsIcon, ReminderMessagesIcon 
} from './icons';

interface DashboardProps {
    setActiveView: (view: View) => void;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const QUARTERS: Record<string, string> = { 'Q1': 'Q1 (Apr-Jun)', 'Q2': 'Q2 (Jul-Sep)', 'Q3': 'Q3 (Oct-Dec)', 'Q4': 'Q4 (Jan-Mar)' };

// --- Helper Functions ---
const getGstFilingPeriod = (date = new Date()) => {
    const aDate = new Date(date);
    aDate.setMonth(aDate.getMonth() - 1);
    const month = aDate.toLocaleString('default', { month: 'long' });
    const year = aDate.getFullYear();
    let financialYear;
    if (aDate.getMonth() < 3) {
        financialYear = `${year - 1}-${String(year).slice(-2)}`;
    } else {
        financialYear = `${year}-${String(year + 1).slice(-2)}`;
    }
    return { month, financialYear };
};

const fyToAy = (fy: string) => {
    if (!fy || !fy.includes('-')) return '';
    const startYear = parseInt(fy.split('-')[0]);
    return `${startYear + 1}-${String(startYear + 2).slice(-2)}`;
};

const getCurrentQuarter = () => {
    const month = new Date().getMonth();
    if (month >= 3 && month <= 5) return 'Q1';
    if (month >= 6 && month <= 8) return 'Q2';
    if (month >= 9 && month <= 11) return 'Q3';
    return 'Q4';
};

// --- UI Components ---
const DonutChart: React.FC<{ value: number; total: number; size?: number; strokeWidth?: number }> = ({ value, total, size = 80, strokeWidth = 10 }) => {
    if (total === 0) {
        return (
             <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle cx={size / 2} cy={size / 2} r={(size - strokeWidth) / 2} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-500">N/A</div>
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
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth={strokeWidth} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-500" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{percentage}%</div>
        </div>
    );
};

const StatDisplay: React.FC<{ label: string, value: string | number, color?: string }> = ({ label, value, color = 'text-gray-900 dark:text-white' }) => (
    <div className="flex justify-between items-center py-1.5">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
        <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
);

const ClientStatCard: React.FC<{ title: string; view: View; setActiveView: (v: View) => void; stats: {label: string; value: number}[]; icon: React.ReactNode; chartData?: { value: number, total: number }; }> = ({ title, view, setActiveView, stats, icon, chartData }) => (
     <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col justify-between">
        <div>
            <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">{icon}</div>
                <h3 className="font-bold text-gray-800 dark:text-white">{title}</h3>
            </div>
            <div className={`flex items-center gap-4 ${!chartData ? 'justify-center' : ''}`}>
                 <div className={`flex-grow space-y-1 ${chartData ? 'pr-2 border-r dark:border-gray-600' : ''}`}>{stats.map(stat => <StatDisplay key={stat.label} label={stat.label} value={stat.value} />)}</div>
                {chartData && <div className="flex-shrink-0"><DonutChart value={chartData.value} total={chartData.total} /></div>}
            </div>
        </div>
        <button onClick={() => setActiveView(view)} className="mt-4 w-full text-center py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-gray-700 rounded-lg hover:bg-indigo-100 dark:hover:bg-gray-600 transition">View Details</button>
    </div>
);

const ModuleStatCard: React.FC<{ title: string; view: View; setActiveView: (v: View) => void; icon: React.ReactNode; filters: React.ReactNode; stats: { label: string; value: string | number; color?: string; }[]; chartData: { value: number; total: number; }; dueDate?: string; }> = ({ title, view, setActiveView, icon, filters, stats, chartData, dueDate }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col justify-between">
        <div>
            <div className="flex items-center justify-between gap-3 mb-2">
                 <div className="flex items-center gap-3">
                    <div className="text-2xl">{icon}</div>
                    <h3 className="font-bold text-gray-800 dark:text-white">{title}</h3>
                </div>
                {dueDate && <div className="text-xs text-gray-500 dark:text-gray-400 text-right"><span className="font-semibold block">Due Date:</span> <span>{dueDate}</span></div>}
            </div>
            <div className="my-3">{filters}</div>
            <div className="flex items-center gap-4">
                <div className="flex-grow space-y-1 pr-2 border-r dark:border-gray-600">{stats.map(stat => <StatDisplay key={stat.label} {...stat} />)}</div>
                <div className="flex-shrink-0"><DonutChart value={chartData.value} total={chartData.total} /></div>
            </div>
        </div>
         <button onClick={() => setActiveView(view)} className="mt-4 w-full text-center py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-gray-700 rounded-lg hover:bg-indigo-100 dark:hover:bg-gray-600 transition">View Details</button>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
    const { clients, reminders, payments, gstNotices, gstAppeals, gstTribunalAppeals, highCourtAppeals, gstRegistrations, foodLicenses, msmeRegistrations, miscellaneousWork } = useClientData();
    const { getDueDate } = useDueDate();
    const [financialYears, setFinancialYears] = useState<string[]>([]);
    
    const [monthlyPeriod, setMonthlyPeriod] = useState({ fy: '', month: '' });
    const [quarterlyPeriod, setQuarterlyPeriod] = useState({ fy: '', quarter: '' });
    const [compositionPeriod, setCompositionPeriod] = useState({ fy: '', quarter: '' });
    const [gstr4Fy, setGstr4Fy] = useState('');
    const [gstr9Fy, setGstr9Fy] = useState('');
    const [itAuditFy, setItAuditFy] = useState('');
    const [auditFy, setAuditFy] = useState('');
    const [bsFy, setBsFy] = useState('');

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB');
    };

    useEffect(() => {
        const storedFys = localStorage.getItem('financialYears');
        const { month: initialMonth, financialYear: initialFy } = getGstFilingPeriod();
        const initialQuarter = getCurrentQuarter();
        let initialFys: string[];
        if (storedFys) {
            try {
                initialFys = JSON.parse(storedFys);
                if (!initialFys.includes(initialFy)) initialFys.push(initialFy);
            } catch { initialFys = [initialFy]; }
        } else { initialFys = [initialFy]; }
        const sortedFys = [...new Set(initialFys)].sort().reverse();
        setFinancialYears(sortedFys);
        setMonthlyPeriod({ fy: initialFy, month: initialMonth });
        setQuarterlyPeriod({ fy: initialFy, quarter: initialQuarter });
        setCompositionPeriod({ fy: initialFy, quarter: initialQuarter });
        setGstr4Fy(initialFy);
        setGstr9Fy(sortedFys.length > 1 ? sortedFys[1] : initialFy);
        setItAuditFy(initialFy);
        setAuditFy(initialFy);
        setBsFy(initialFy);
    }, []);

    const clientStats = useMemo(() => {
        const gstClients = clients.filter(c => !!c.gstProfile);
        const itClients = clients.filter(c => !!c.itProfile);
        return {
            totalGst: gstClients.length,
            activeGst: gstClients.filter(c => c.status === 'Active Filing').length,
            totalIt: itClients.length,
            activeIt: itClients.filter(c => c.status === 'Active Filing' || c.status === 'Active').length,
        };
    }, [clients]);

    const renderFilters = (period: any, setPeriod: Function, type: 'monthly' | 'quarterly' | 'yearly', yearLabel: 'F.Y.' | 'A.Y.' = 'F.Y.') => (
        <div className="flex items-center gap-2 flex-wrap">
            <select value={period.fy || period} onChange={e => type === 'yearly' ? setPeriod(e.target.value) : setPeriod((p:any) => ({...p, fy: e.target.value}))} className="px-2 py-1 text-xs border rounded-md bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" onClick={e => e.stopPropagation()}>
                {financialYears.map(fy => <option key={fy} value={fy}>{yearLabel}: {yearLabel === 'A.Y.' ? fyToAy(fy) : fy}</option>)}
            </select>
            {type === 'monthly' && <select value={period.month} onChange={e => setPeriod((p:any) => ({...p, month: e.target.value}))} className="px-2 py-1 text-xs border rounded-md bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" onClick={e => e.stopPropagation()}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>}
             {type === 'quarterly' && <select value={period.quarter} onChange={e => setPeriod((p:any) => ({...p, quarter: e.target.value}))} className="px-2 py-1 text-xs border rounded-md bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" onClick={e => e.stopPropagation()}>
                {Object.entries(QUARTERS).map(([qKey, qValue]) => <option key={qKey} value={qKey}>{qValue}</option>)}
            </select>}
        </div>
    );

    return (
        <div className="space-y-8 p-6 md:p-10">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Practice Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ClientStatCard title="GST Clients" view={View.GstClientDetails} setActiveView={setActiveView} icon={<ClientIcon />} stats={[
                    { label: 'Total Portfolio', value: clientStats.totalGst },
                    { label: 'Active Filing', value: clientStats.activeGst },
                ]} chartData={{ value: clientStats.activeGst, total: clientStats.totalGst }} />
                <ClientStatCard title="Income Tax" view={View.ItClientDetails} setActiveView={setActiveView} icon={<IncomeTaxIcon />} stats={[
                    { label: 'Total Clients', value: clientStats.totalIt },
                    { label: 'Active Status', value: clientStats.activeIt },
                ]} chartData={{ value: clientStats.activeIt, total: clientStats.totalIt }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ModuleStatCard title="Monthly Compliance" view={View.GstRegularMonthly} setActiveView={setActiveView} icon={<GstReturnIcon />} filters={renderFilters(monthlyPeriod, setMonthlyPeriod, 'monthly')}
                    stats={[{label: 'In Progress', value: 'Syncing...', color: 'text-indigo-600'}]}
                    chartData={{value: 0, total: 100 }}
                    dueDate={formatDate(getDueDate('GSTR-1 Monthly', monthlyPeriod.fy, monthlyPeriod.month))}
                />
            </div>
        </div>
    );
};

export default Dashboard;
