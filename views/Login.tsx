
import React from 'react';
import { useApp } from '../AppContext';

export const Login: React.FC = () => {
  const { auth } = useApp();

  const options = [
    { label: 'Logg inn som Admin', email: 'admin@kirken.no', role: 'Administrator', icon: '🛡️' },
    { label: 'Logg inn som Lovsangsleder', email: 'lovsang@kirken.no', role: 'Teamleder', icon: '🎸' },
    { label: 'Logg inn som Teknikleder', email: 'teknikk@kirken.no', role: 'Teamleder', icon: '🎛️' },
    { label: 'Logg inn som Frivillig', email: 'frode@kirken.no', role: 'Medlem', icon: '🙋' },
    { label: 'Se som Gjest', email: 'guest@kirken.no', role: 'Read-only', icon: '👀' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/30">
            <span className="text-4xl">🎪</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">EventMaster</h1>
          <p className="text-slate-400 font-medium">Velg din rolle for å teste RBAC-systemet</p>
        </div>

        <div className="space-y-3">
          {options.map((opt) => (
            <button
              key={opt.email}
              onClick={() => auth.login(opt.email)}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700/50 p-5 rounded-3xl flex items-center gap-4 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {opt.icon}
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{opt.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{opt.role}</span>
                  <span className="text-[10px] text-slate-600 italic truncate max-w-[150px]">{opt.email}</span>
                </div>
              </div>
              <span className="text-slate-600 group-hover:text-blue-500 transition-colors">→</span>
            </button>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-4">Om dette miljøet</p>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
            Dette er et simulert innloggingsmiljø. Sesjonen lagres i din nettleser slik at du kan teste hvordan appen fungerer for ulike roller.
          </p>
        </div>
      </div>
    </div>
  );
};