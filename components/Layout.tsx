
import React, { useState } from 'react';
import { useApp } from '../AppContext';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange }) => {
  const { auth, people } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'vaktliste', label: 'Min Vaktliste', icon: '🧠' },
    { id: 'dashboard', label: 'Kalender', icon: '📅' },
    { id: 'events', label: 'Planlegging', icon: '🎪' },
    { id: 'teams', label: 'Tjeneste-teams', icon: '🛠️' },
    { id: 'grupper', label: 'Fellesskap', icon: '👥' },
    { id: 'people', label: 'Personer', icon: '👤' },
  ];

  const sortedPeople = [...people].sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-white shrink-0 shadow-2xl z-40">
        <div className="p-8 flex items-center gap-4">
          <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20">
            <span>🎪</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Master</h1>
        </div>
        
        <nav className="flex-1 px-5 mt-6 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 group ${
                activeView === item.id 
                  ? 'bg-white text-slate-900 shadow-xl shadow-white/5' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className={`text-xl transition-transform group-hover:scale-110 ${activeView === item.id ? '' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`}>{item.icon}</span>
              <span className="font-black text-[13px] uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 mt-auto border-t border-white/5 bg-black/10">
           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3 px-1">Hvem er du?</p>
           <select 
             className="w-full bg-slate-800 text-white text-sm border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
             value={auth.currentPerson?.id || ''}
             onChange={(e) => auth.setIdentity(e.target.value)}
           >
             <option value="">Velg identitet...</option>
             {sortedPeople.map(p => (
               <option key={p.id} value={p.id}>{p.fullName}</option>
             ))}
           </select>
           {auth.isAdmin && (
             <div className="mt-4 text-[9px] text-amber-400 font-black uppercase tracking-tighter text-center bg-amber-400/5 py-2 rounded-lg border border-amber-400/10">
                🛡️ Full tilgang (🔒 ulåst)
             </div>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 md:px-12 shrink-0 z-30">
          <div className="flex items-center gap-6">
            <button 
              className="md:hidden w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              ☰
            </button>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">
              {menuItems.find(i => i.id === activeView)?.label || 'Planlegger'}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            {auth.currentPerson && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900">{auth.currentPerson.fullName}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Aktiv identitet</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-600/30">
                  {auth.currentPerson.fullName[0]}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          <div className="max-w-full">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-slate-900 p-8 flex flex-col animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
             <div className="flex items-center gap-4 mb-10">
                <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center text-xl">🎪</div>
                <h1 className="text-white text-xl font-black italic uppercase tracking-tighter">Master</h1>
             </div>
             <nav className="space-y-2 flex-1">
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { onViewChange(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all ${activeView === item.id ? 'bg-white text-slate-900' : 'text-slate-400'}`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
             </nav>
             <div className="mt-auto border-t border-white/5 pt-8">
                <select 
                  className="w-full bg-slate-800 text-white text-sm p-4 rounded-xl font-bold appearance-none"
                  value={auth.currentPerson?.id || ''}
                  onChange={(e) => auth.setIdentity(e.target.value)}
                >
                  <option value="">Hvem er du?</option>
                  {sortedPeople.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                </select>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
