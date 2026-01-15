
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import DashboardHome from './DashboardHome';
import GSTPortfolio from '../ClientHub/GSTPortfolio';
import ITPortfolio from '../ClientHub/ITPortfolio';
import MonthlyFiling from '../Compliance/GSTReturn/MonthlyFiling';
import QuarterlyFiling from '../Compliance/GSTReturn/QuarterlyFiling';
import CompositionFiling from '../Compliance/GSTReturn/CompositionFiling';
import GSTR4 from '../Compliance/AnnualReturns/GSTR4';
import GSTR9_9C from '../Compliance/AnnualReturns/GSTR9_9C';
import ITRReturn from '../Compliance/ITAudit/ITRReturn';
import TAXAudit from '../Compliance/ITAudit/TAXAudit';
import NoticePending from '../LitigationSuite/GSTNotices/NoticePending';
import NoticeFiled from '../LitigationSuite/GSTNotices/NoticeFiled';
import NoticeDrop from '../LitigationSuite/GSTNotices/NoticeDrop';
import NoticeDemand from '../LitigationSuite/GSTNotices/NoticeDemand';
import AppealPending from '../LitigationSuite/GSTAppeals/AppealPending';
import AppealFiled from '../LitigationSuite/GSTAppeals/AppealFiled';
import AppealDrop from '../LitigationSuite/GSTAppeals/AppealDrop';
import AppealDemand from '../LitigationSuite/GSTAppeals/AppealDemand';
import Messenger from '../Administration/Messenger';
import Reminders from '../Administration/Reminders';
import Invoices from '../Administration/invoice/Invoices';
import PaymentReceived from '../Administration/invoice/PaymentReceived';
import Setting from '../Administration/Setting';
import Trash from '../Administration/Trash';
import AddInvoice from '../Administration/invoice/addinvoice';
import DueDateSetting from '../Administration/DueDateSetting';

import { useAuth } from '../../auth/AuthContext';
import { socketService } from '../../services/socketService';
import { ActiveView } from '../../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketService.connect();
    socketService.on('connect', () => setIsConnected(true));
    socketService.on('disconnect', () => setIsConnected(false));
    return () => socketService.disconnect();
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardHome setActiveView={setActiveView} />;
      case 'gst-portfolio': return <GSTPortfolio />;
      case 'it-portfolio': return <ITPortfolio />;
      case 'compliance-monthly': return <MonthlyFiling />;
      case 'compliance-quarterly': return <QuarterlyFiling />;
      case 'compliance-composition': return <CompositionFiling />;
      case 'compliance-gstr4': return <GSTR4 />;
      case 'compliance-gstr9': return <GSTR9_9C />;
      case 'compliance-itr': return <ITRReturn />;
      case 'compliance-taxaudit': return <TAXAudit />;
      case 'lit-notice-pending': return <NoticePending />;
      case 'lit-notice-filed': return <NoticeFiled />;
      case 'lit-notice-drop': return <NoticeDrop />;
      case 'lit-notice-demand': return <NoticeDemand />;
      case 'lit-appeal-pending': return <AppealPending />;
      case 'lit-appeal-filed': return <AppealFiled />;
      case 'lit-appeal-drop': return <AppealDrop />;
      case 'lit-appeal-demand': return <AppealDemand />;
      case 'messenger': return <Messenger />;
      case 'reminders': return <Reminders />;
      case 'admin-invoices': return <Invoices onViewChange={(v) => setActiveView(v as ActiveView)} />;
      case 'admin-payments': return <PaymentReceived />;
      case 'admin-duedates': return <DueDateSetting />;
      case 'settings': return <Setting />;
      case 'trash': return <Trash />;
      case 'admin-add-invoice': return <AddInvoice onBack={() => setActiveView('admin-invoices')} />;
      default: return <DashboardHome setActiveView={setActiveView} />;
    }
  };

  const getHeaderInfo = () => {
    const map: Record<string, { label: string, desc: string }> = {
      dashboard: { label: 'Executive Nerve Center', desc: 'Real-time practice intelligence and filing velocity.' },
      'gst-portfolio': { label: 'GST Master Vault', desc: 'Secure repository for GST registered entities.' },
      'it-portfolio': { label: 'IT Master Vault', desc: 'Direct tax profile management and PAN hub.' },
      'compliance-monthly': { label: 'Monthly Filing', desc: 'Statutory GSTR-1 and GSTR-3B execution.' },
      'compliance-taxaudit': { label: 'Audit & Financials', desc: 'Tax audit lifecycle and balance sheet preparation.' },
      'lit-notice-pending': { label: 'GST Notices', desc: 'Critical response tracking for departmental notices.' },
      'settings': { label: 'Vault Configuration', desc: 'Practitioner profile and professional settings.' },
    };
    return map[activeView] || { label: activeView.toUpperCase().replace(/-/g, ' '), desc: 'Authorized Vault Module' };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      <main className={`flex flex-col flex-1 transition-all duration-500 overflow-hidden ${isSidebarCollapsed ? 'ml-20' : 'ml-80'}`}>
        <Header 
          isConnected={isConnected} 
          currentUser={user} 
          onMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activeViewLabel={headerInfo.label}
          activeViewDescription={headerInfo.desc}
          onViewChange={setActiveView}
        />
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 bg-gray-50 dark:bg-gray-950">
          <div className="max-w-[1600px] mx-auto h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
