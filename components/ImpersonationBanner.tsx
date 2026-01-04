
import React from 'react';
import { useApp } from '../AppContext';

export const ImpersonationBanner: React.FC = () => {
  const { auth } = useApp();
  const { currentPerson, isAdmin, ledGroups, isReadOnly } = auth;

  if (auth.authStatus !== 'authenticated') return null;

  const roleLabel = isAdmin ? 'Admin' : (ledGroups.length > 0 ? 'Teamleder' : (isReadOnly ? 'Read-only' : 'Bruker'));
  const bgColor = isAdmin ? 'bg-indigo-600' : (ledGroups.length > 0 ? 'bg-blue-600' : 'bg-slate-700');

  return (
    <div className={`${bgColor} text-white px-6 py-2 flex items-center justify-between text-xs font-bold animate-in slide-in-from-top duration-300 relative z-[200]`}>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">
          <span className="text-[10px]">🎭</span> {roleLabel}
        </span>
        <p>
          Du ser appen som: <span className="underline decoration-white/40 underline-offset-2">{currentPerson?.fullName || 'Gjest'}</span> ({auth.sessionEmail})
        </p>
      </div>
      <div className="flex items-center gap-4">
        {ledGroups.length > 0 && (
          <p className="hidden md:block text-white/70">
            Leder for: {ledGroups.map(t => t.name).join(', ')}
          </p>
        )}
        <button 
          onClick={() => auth.logout()}
          className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-all border border-white/10"
        >
          Bytt bruker / Logg ut
        </button>
      </div>
    </div>
  );
};