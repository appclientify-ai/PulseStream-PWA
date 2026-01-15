import React, { useMemo, useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { ModuleStatCard } from '../../components/DashboardUI';
// Fix: Removed unused and non-existent type imports that were causing module member errors
import { ActiveView, Client } from '../../types';

interface DashboardHomeProps {
    setActiveView: (view: ActiveView) => void;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const QUARTERS: Record<string, string> = { 'Q1': 'Q1 (Apr-Jun)', 'Q2': 'Q2 (Jul-Sep)', 'Q3': 'Q3 (Oct-Dec)', 'Q4': 'Q4 (Jan-Mar)' };

const DashboardHome: React.FC<DashboardHomeProps> = ({ setActiveView }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [litigation, setLitigation] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [work, setWork] = useState<any[]>([]);
    const [financialYears, setFinancialYears] = useState<string[]>(['2024-25', '2023-24']);
    
    // Summary data for charts
    const [stats, setStats] = useState<any>({});

    useEffect(() => {
        api.getDashboardSummary().then(res => {
            setClients(res.clients);
            setLitigation(res.litigation);
            setInvoices(res.invoices);
            setWork(res.work);
        });
    }, []);

    const clientStats = useMemo(() => ({
        gst: clients.filter(c => !!c.gstProfile).length,
        it: clients.filter(c => !!c.itProfile).length,
        active: clients.filter(c => c.status.includes('Active')).length
    }), [clients]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Practice Executive Pulse</h1>
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mt-2">Authorized Intelligence Snapshot</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Server Status</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-black text-gray-900 dark:text-white">ENCRYPTED SYNC ACTIVE</span>
                    </div>
                </div>
            </header>

            <section>
                <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">Master Portfolios <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" /></h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ModuleStatCard 
                        title="GST Portfolio" 
                        icon="🧾" 
                        stats={[
                            { label: 'Total Clients', value: clientStats.gst },
                            { label: 'Active Filing', value: clients.filter(c => c.status === 'Active Filing').length }
                        ]}
                        chartData={{ value: clients.filter(c => c.status === 'Active Filing').length, total: clientStats.gst }}
                        onClick={() => setActiveView('gst-portfolio')}
                    />
                    <ModuleStatCard 
                        title="Income Tax" 
                        icon="💻" 
                        stats={[
                            { label: 'Master Files', value: clientStats.it },
                            { label: 'Individual', value: clients.filter(c => c.itProfile?.category === 'Individual').length }
                        ]}
                        chartData={{ value: clients.filter(c => c.itProfile?.category === 'Individual').length, total: clientStats.it }}
                        onClick={() => setActiveView('it-portfolio')}
                    />
                    <ModuleStatCard 
                        title="Financial Health" 
                        icon="💳" 
                        stats={[
                            { label: 'Pending Bills', value: invoices.filter(i => i.status !== 'Paid').length },
                            { label: 'Outstanding', value: '₹' + invoices.filter(i => i.status !== 'Paid').reduce((a,b)=>a+(b.totalAmount||0),0).toLocaleString() }
                        ]}
                        onClick={() => setActiveView('admin-invoices')}
                    />
                </div>
            </section>

            <section>
                <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">Statutory Compliance <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" /></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ModuleStatCard 
                        title="GST Monthly" 
                        icon="🗓️" 
                        stats={[
                            { label: 'Total Files', value: clients.filter(c => c.gstProfile?.filingFreq === 'Monthly').length },
                            { label: 'Avg velocity', value: '88%' }
                        ]}
                        dueDate="20th of Month"
                        onClick={() => setActiveView('compliance-monthly')}
                    />
                    <ModuleStatCard 
                        title="GSTR-9 Annual" 
                        icon="📑" 
                        stats={[
                            { label: 'Eligible', value: '42' },
                            { label: 'Audit Ready', value: '18' }
                        ]}
                        dueDate="31st Dec"
                        onClick={() => setActiveView('compliance-gstr9')}
                    />
                    <ModuleStatCard 
                        title="Income Tax Return" 
                        icon="💸" 
                        stats={[
                            { label: 'AY 2024-25', value: clientStats.it },
                            { label: 'Filing Load', value: 'High' }
                        ]}
                        dueDate="31st July"
                        onClick={() => setActiveView('compliance-itr')}
                    />
                    <ModuleStatCard 
                        title="Tax Audit" 
                        icon="🔍" 
                        stats={[
                            { label: 'Assigned', value: '12' },
                            { label: 'In Progress', value: '4' }
                        ]}
                        dueDate="30th Sept"
                        onClick={() => setActiveView('compliance-taxaudit')}
                    />
                </div>
            </section>

            <section>
                <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">Litigation & Enforcement <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" /></h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ModuleStatCard 
                        title="GST Notices" 
                        icon="✉️" 
                        stats={[
                            { label: 'Pending Reply', value: litigation.filter(l => l.category === 'Notice' && l.status === 'Pending').length, color: 'text-rose-500' },
                            { label: 'Dropped', value: litigation.filter(l => l.status === 'Drop').length }
                        ]}
                        onClick={() => setActiveView('lit-notice-pending')}
                    />
                    <ModuleStatCard 
                        title="GST Appeals" 
                        icon="🏛️" 
                        stats={[
                            { label: 'Awaiting Hearing', value: litigation.filter(l => l.category === 'Appeal' && l.status === 'Filed').length },
                            { label: 'Fresh Orders', value: litigation.filter(l => l.status === 'Demand').length }
                        ]}
                        onClick={() => setActiveView('lit-appeal-pending')}
                    />
                    <ModuleStatCard 
                        title="High Court / Tribunal" 
                        icon="🏦" 
                        stats={[
                            { label: 'Active WP', value: litigation.filter(l => l.category === 'HighCourt').length },
                            { label: 'Tribunal Load', value: litigation.filter(l => l.category === 'Tribunal').length }
                        ]}
                        onClick={() => setActiveView('lit-tribunal-pending')}
                    />
                </div>
            </section>
        </div>
    );
};

export default DashboardHome;