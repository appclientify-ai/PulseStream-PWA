
import React, { useMemo, useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { ModuleStatCard } from '../../components/DashboardUI';
import { ActiveView, Client } from '../../types';

interface DashboardHomeProps {
    setActiveView: (view: ActiveView) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ setActiveView }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [litigation, setLitigation] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [work, setWork] = useState<any[]>([]);
    
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
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Redundant header removed as per user request */}

            <section>
                <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 mb-5 uppercase tracking-[0.4em] flex items-center gap-4">
                    Master Portfolios 
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                </h2>
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
                <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 mb-5 uppercase tracking-[0.4em] flex items-center gap-4">
                    Statutory Compliance 
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                </h2>
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
                <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 mb-5 uppercase tracking-[0.4em] flex items-center gap-4">
                    Litigation & Enforcement 
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                </h2>
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
