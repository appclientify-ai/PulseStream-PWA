
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
import Balancesheet from '../Compliance/ITAudit/Balancesheet';
import NoticePending from '../LitigationSuite/GSTNotices/NoticePending';
import NoticeFiled from '../LitigationSuite/GSTNotices/NoticeFiled';
import NoticeDrop from '../LitigationSuite/GSTNotices/NoticeDrop';
import NoticeDemand from '../LitigationSuite/GSTNotices/NoticeDemand';
import AppealPending from '../LitigationSuite/GSTAppeals/AppealPending';
import AppealFiled from '../LitigationSuite/GSTAppeals/AppealFiled';
import AppealDrop from '../LitigationSuite/GSTAppeals/AppealDrop';
import AppealDemand from '../LitigationSuite/GSTAppeals/AppealDemand';
import TribunalPending from '../LitigationSuite/Tribunal/TribunalPending';
import TribunalFiled from '../LitigationSuite/Tribunal/TribunalFiled';
import TribunalDrop from '../LitigationSuite/Tribunal/TribunalDrop';
import TribunalDemand from '../LitigationSuite/Tribunal/TribunalDemand';
import CourtPending from '../LitigationSuite/HighCourt/CourtPending';
import CourtFiled from '../LitigationSuite/HighCourt/CourtFiled';
import CourtDrop from '../LitigationSuite/HighCourt/CourtDrop';
import CourtDemand from '../LitigationSuite/HighCourt/CourtDemand';
import Messenger from '../Administration/Messenger';
import Reminders from '../Administration/Reminders';
import Invoices from '../Administration/invoice/Invoices';
import PaymentReceived from '../Administration/invoice/PaymentReceived';
import Setting from '../Administration/Setting';
import Trash from '../Administration/Trash';
import AddInvoice from '../Administration/invoice/addinvoice';
import DueDateSetting from '../Administration/DueDateSetting';
import GSTRegistration from '../Miscellaneous/GSTRegistration';
import FoodLicenses from '../Miscellaneous/FoodLicenses';
import MSMERegistration from '../Miscellaneous/MSMERegistration';
import Miscellaneouswork from '../Miscellaneous/Miscellaneouswork';

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
      case 'balance-sheet': return <Balancesheet />;
      case 'lit-notice-pending': return <NoticePending />;
      case 'lit-notice-filed': return <NoticeFiled />;
      case 'lit-notice-drop': return <NoticeDrop />;
      case 'lit-notice-demand': return <NoticeDemand />;
      case 'lit-appeal-pending': return <AppealPending />;
      case 'lit-appeal-filed': return <AppealFiled />;
      case 'lit-appeal-drop': return <AppealDrop />;
      case 'lit-appeal-demand': return <AppealDemand />;
      case 'lit-tribunal-pending': return <TribunalPending />;
      case 'lit-tribunal-filed': return <TribunalFiled />;
      case 'lit-tribunal-drop': return <TribunalDrop />;
      case 'lit-tribunal-demand': return <TribunalDemand />;
      case 'lit-hc-pending': return <CourtPending />;
      case 'lit-hc-filed': return <CourtFiled />;
      case 'lit-hc-drop': return <CourtDrop />;
      case 'lit-hc-demand': return <CourtDemand />;
      case 'misc-gst-reg': return <GSTRegistration />;
      case 'food-licenses': return <FoodLicenses />;
      case 'msme-registration': return <MSMERegistration />;
      case 'misc-work': return <Miscellaneouswork />;
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
      dashboard: { label: 'Practice Intelligence', desc: 'Real-time firm metrics and health.' },
      'gst-portfolio': { label: 'GST Master Vault', desc: 'Secure repository for GST registered entities.' },
      'it-portfolio': { label: 'IT Master Vault', desc: 'Direct tax profile management.' },
      'compliance-monthly': { label: 'Monthly Returns', desc: 'Statutory GSTR-1 and GSTR-3B execution.' },
      'lit-notice-pending': { label: 'Pending Notices', desc: 'Active litigation response queue.' },
    };
    return map[activeView] || { label: activeView.toUpperCase().replace(/-/g, ' '), desc: 'Authorized Vault Module' };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
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
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-slate-50">
          <div className="max-w-[1600px] mx-auto h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
