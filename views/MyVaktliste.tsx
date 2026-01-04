
import React, { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { generateCalendarInstances } from '../utils/dateUtils';
import { RoleDefinition } from '../types';

export const MyVaktliste: React.FC = () => {
  const { auth, events, assignments, eventOccurrences, groups, groupMembers, roleDefinitions } = useApp();
  const { currentPerson, isAdmin } = auth;
  const [selectedRoleTasks, setSelectedRoleTasks] = useState<RoleDefinition | null>(null);

  const futureInstances = useMemo(() => {
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    return generateCalendarInstances(events, start, end);
  }, [events]);

  const myServices = useMemo(() => {
    if (!currentPerson) return [];
    return futureInstances.flatMap(inst => {
      const occ = eventOccurrences.find(o => o.eventId === inst.eventId && o.instanceDate === inst.instanceDate);
      const relevantAssignments = assignments.filter(a => 
        a.personId === currentPerson.id && 
        a.eventId === inst.eventId &&
        (occ ? a.occurrenceId === occ.id : !a.occurrenceId)
      );
      return relevantAssignments.map(a => ({
        instance: inst,
        assignment: a,
        role: roleDefinitions.find(rd => rd.id === a.roleId)
      }));
    });
  }, [currentPerson, futureInstances, assignments, eventOccurrences, roleDefinitions]);

  const myGroups = useMemo(() => {
    if (!currentPerson) return [];
    const groupIds = groupMembers.filter(gm => gm.personId === currentPerson.id && gm.active).map(gm => gm.groupId);
    return groups.filter(g => groupIds.includes(g.id) && g.category !== 'service');
  }, [currentPerson, groupMembers, groups]);

  const adminDeadlines = [
    { title: "Facebook: Opprett arrangement", freq: "Mandag etter gudstjeneste", kanal: "Sosiale Medier", icon: "📱" },
    { title: "By og Bygd: Sende info", freq: "Onsdag kl. 12:00", kanal: "Lokalavis", icon: "🗞️" },
    { title: "Frifond: Medlemsliste & Styrevalg", deadline: "31. desember", kanal: "Rapport", icon: "💰" },
    { title: "Frifond: Årsrapport", deadline: "15. mars", kanal: "Rapport", icon: "📊" },
  ];

  if (!currentPerson) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
        <span className="text-6xl mb-6">🤫</span>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Velg din identitet</h2>
        <p className="text-slate-500 max-w-sm mt-2 font-medium">Bruk menyen nederst til venstre for å fortelle systemet hvem du er.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tight">Hei, {currentPerson.fullName.split(' ')[0]} 👋</h2>
           <p className="text-slate-500 mt-2 font-medium text-lg">Din personlige oversikt over tjenester og ansvar.</p>
        </div>
      </header>

      {/* Tjenester */}
      <section>
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-600/20">📅</div>
           <h3 className="text-2xl font-black text-slate-900">Mine Tjenester (Vakter)</h3>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
           <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                   <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Dato & Tid</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Aktivitet</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Rolle</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Instruks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {myServices.map((srv, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900">{new Date(srv.instance.instanceDate).toLocaleDateString('no-NO', { day:'numeric', month:'short' })}</p>
                      <p className="text-[10px] font-black text-blue-600 uppercase mt-1">Kl. {srv.instance.startTime}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-700 text-lg">{srv.instance.title}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black border border-blue-100">
                        {srv.role?.name || 'Tildelt'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       {srv.role?.tasks && srv.role.tasks.length > 0 ? (
                         <button 
                           onClick={() => setSelectedRoleTasks(srv.role!)}
                           className="w-10 h-10 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all font-black text-lg active:scale-90"
                           title="Se sjekkliste"
                         >ℹ️</button>
                       ) : <span className="text-slate-200">—</span>}
                    </td>
                  </tr>
                ))}
                {myServices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">Ingen planlagte vakter de neste 3 månedene.</td>
                  </tr>
                )}
              </tbody>
           </table>
        </div>
      </section>

      {/* Grupper og Verv */}
      <section>
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-600/20">👥</div>
           <h3 className="text-2xl font-black text-slate-900">Mine Grupper & Verv</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {myGroups.map(g => (
             <div key={g.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-full">
                <div>
                   <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg mb-3 inline-block tracking-tighter">
                     {g.category}
                   </span>
                   <h4 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{g.name}</h4>
                   <p className="text-sm text-slate-500 font-medium">{g.description}</p>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-400">?</div>
                   </div>
                   <span className="text-[10px] font-black text-slate-300 uppercase">Aktiv</span>
                </div>
             </div>
           ))}
           {myGroups.length === 0 && (
             <div className="col-span-full py-16 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 italic font-medium">
                Du er ikke medlem i noen ikke-tjenestegrupper ennå.
             </div>
           )}
        </div>
      </section>

      {/* Administrative Frister (Pastor/Admin) */}
      {(isAdmin || currentPerson.email.includes('pastor')) && (
        <section className="animate-in slide-in-from-bottom-6 duration-1000">
          <div className="bg-amber-50/50 border-2 border-amber-100 rounded-[3rem] p-10">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-amber-200 rounded-2xl flex items-center justify-center text-2xl shadow-inner shadow-amber-900/10">🏛️</div>
               <h3 className="text-2xl font-black text-amber-900">Administrative Frister (Admin/Styre)</h3>
            </div>
            <div className="bg-white rounded-3xl shadow-xl shadow-amber-900/5 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-amber-100/30 border-b border-amber-100">
                    <tr>
                       <th className="px-8 py-5 text-[10px] font-black uppercase text-amber-700 tracking-widest">Gjøremål</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase text-amber-700 tracking-widest">Frekvens / Dato</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase text-amber-700 tracking-widest">Kanal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50/50">
                    {adminDeadlines.map((dl, i) => (
                      <tr key={i} className="hover:bg-amber-50/20 transition-colors">
                        <td className="px-8 py-6 font-bold text-slate-800 flex items-center gap-4 text-lg">
                          <span className="text-2xl">{dl.icon}</span> {dl.title}
                        </td>
                        <td className="px-8 py-6 text-sm font-black text-amber-800">{dl.freq || dl.deadline}</td>
                        <td className="px-8 py-6">
                           <span className="text-[10px] font-black uppercase border-2 border-amber-200 text-amber-600 px-3 py-1 rounded-xl">
                             {dl.kanal}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </section>
      )}

      {/* Task Checklist Modal */}
      {selectedRoleTasks && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md" onClick={() => setSelectedRoleTasks(null)}>
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedRoleTasks.name}</h3>
                  <p className="text-slate-500 font-medium mt-1">Viktige instruksjoner og oppgaver</p>
                </div>
                <button onClick={() => setSelectedRoleTasks(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">✕</button>
              </div>
              
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                 {selectedRoleTasks.tasks?.map(t => (
                   <div key={t.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4 hover:border-blue-200 transition-colors">
                      <div className="w-6 h-6 rounded-lg border-2 border-blue-400 mt-0.5 shrink-0 bg-white flex items-center justify-center">
                         <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm opacity-0 group-hover:opacity-20 transition-opacity"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 leading-snug">{t.title}</p>
                        {(t.deadline || t.channel) && (
                          <div className="flex gap-3 mt-3">
                             {t.deadline && <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded">⏰ {t.deadline}</span>}
                             {t.channel && <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-100 px-2 py-0.5 rounded">📢 {t.channel}</span>}
                          </div>
                        )}
                      </div>
                   </div>
                 ))}
                 {(!selectedRoleTasks.tasks || selectedRoleTasks.tasks.length === 0) && (
                   <div className="py-12 text-center text-slate-400 italic font-medium bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                     Ingen spesifikke oppgaver definert for denne rollen.
                   </div>
                 )}
              </div>
              
              <div className="mt-10">
                <button onClick={() => setSelectedRoleTasks(null)} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 text-lg">Forstått!</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
