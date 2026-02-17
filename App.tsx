
import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar as CalendarIcon, 
  Zap, 
  ClipboardList,
  Download,
  BarChart3,
  ShieldCheck
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import ClientsList from './pages/ClientsList';
import ClientDetail from './pages/ClientDetail';
import VisitsList from './pages/VisitsList';
import VisitDetail from './pages/VisitDetail';
import Catalogue from './pages/Catalogue';
import Calendar from './pages/Calendar';
import ExportPage from './pages/ExportPage';
import Analysis from './pages/Analysis';
import ManagerInterventions from './pages/ManagerInterventions';
import TeamCalendar from './pages/TeamCalendar';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Tableau' },
    { path: '/calendar', icon: CalendarIcon, label: 'Agenda' },
    { path: '/visits', icon: ClipboardList, label: 'Visites' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/manager/interventions', icon: ShieldCheck, label: 'Supervision' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-50 flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/');
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <item.icon size={20} className={isActive ? 'fill-blue-50' : ''} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 pb-20">
        <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <Zap className="fill-yellow-400 text-yellow-500" size={24} />
            SolarVisit <span className="text-slate-400 font-light">Pro</span>
          </h1>
          <div className="flex items-center gap-2">
            <Link to="/analysis" className="p-2 text-slate-500 hover:text-blue-600 transition-colors">
              <BarChart3 size={20} />
            </Link>
            <Link to="/export" className="p-2 text-slate-500 hover:text-blue-600 transition-colors">
              <Download size={20} />
            </Link>
          </div>
        </header>

        <main className="container mx-auto max-w-lg p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<ClientsList />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/visits" element={<VisitsList />} />
            <Route path="/visits/:id" element={<VisitDetail />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/analysis/:id" element={<Analysis />} />
            <Route path="/manager/interventions" element={<ManagerInterventions />} />
            <Route path="/manager/calendar" element={<TeamCalendar />} />
          </Routes>
        </main>

        <Navigation />
      </div>
    </HashRouter>
  );
};

export default App;
