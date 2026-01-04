
import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { Group, RoleDefinition, RoleTask } from '../types';
import { PersonSelector } from '../components/PersonSelector';

export const Teams: React.FC = () => {
  const { 
    groups, roleDefinitions, groupMembers, people, auth,
    addRoleDefinition, updateRoleDefinition, deleteRoleDefinition,
    addGroupMember, removeGroupMember
  } = useApp();
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [newTaskInfo, setNewTaskInfo] = useState({ title: '', deadline: '', channel: '' });

  const serviceGroups = groups.filter(g => g.category === 'service');
  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const members = useMemo(() => {
    if (!selectedGroupId) return [];
    return groupMembers
      .filter(gm => gm.groupId === selectedGroupId && gm.active)
      .map(gm => ({
        ...gm,
        person: people.find(p => p.id === gm.personId)!
      }))
      .filter(m => !!m.person);
  }, [selectedGroupId, groupMembers, people]);

  const roles = useMemo(() => {
    return roleDefinitions.filter(rd => rd.groupId === selectedGroupId);
  }, [roleDefinitions, selectedGroupId]);

  const handleAddRoleTask = () => {
    if (editingRole && newTaskInfo.title.trim()) {
      const updatedTasks: RoleTask[] = [...(editingRole.tasks || []), { 
        id: crypto.randomUUID(), 
        title: newTaskInfo.title.trim(),
        deadline: newTaskInfo.deadline.trim() || undefined,
        channel: newTaskInfo.channel.trim() || undefined
      }];
      setEditingRole({ ...editingRole, tasks: updatedTasks });
      setNewTaskInfo({ title: '', deadline: '', channel: '' });
    }
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Operative Teams</h2>
          <p className="text-slate-500 mt-1 font-medium italic">Tjenesteroller, instruksjoner og bemanning.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-1 space-y-3">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Dine Teams</h4>
          {serviceGroups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGroupId(g.id)}
              className={`w-full text-left p-5 rounded-2xl border transition-all ${selectedGroupId === g.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md text-slate-600'}`}
            >
              <p className="font-bold text-lg">{g.name}</p>
              <p className={`text-[10px] font-black uppercase mt-1 tracking-tighter ${selectedGroupId === g.id ? 'opacity-80' : 'text-slate-400'}`}>
                {roleDefinitions.filter(rd => rd.groupId === g.id).length} definerte roller
              </p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          {selectedGroup ? (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
              <div className="p-10 border-b border-slate-50 bg-slate-50/50">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedGroup.name}</h3>
                <p className="text-slate-500 font-medium mt-2">{selectedGroup.description}</p>
              </div>

              <div className="p-10 space-y-12">
                 <section>
                    <div className="flex items-center justify-between mb-8">
                       <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">🏷️ Roller & Sjekklister</h4>
                       {auth.isAdmin && <button onClick={() => setEditingRole({ id: crypto.randomUUID(), name: '', description: '', groupId: selectedGroup.id, tasks: [] })} className="text-xs font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">➕ Ny rolle</button>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {roles.map(role => (
                         <div key={role.id} className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:border-blue-200 transition-all">
                            <div className="flex justify-between items-start mb-4">
                               <div>
                                  <h5 className="text-xl font-bold text-slate-900">{role.name}</h5>
                                  <p className="text-sm text-slate-500 font-medium mt-1">{role.description || 'Ingen instruks.'}</p>
                               </div>
                               {auth.isAdmin && (
                                 <button onClick={() => setEditingRole(role)} className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">✏️</button>
                               )}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100/50">
                               {role.tasks?.slice(0, 3).map(t => <span key={t.id} className="text-[9px] font-black uppercase bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-400">📋 {t.title}</span>)}
                               {role.tasks && role.tasks.length > 3 && <span className="text-[9px] font-black uppercase bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-400">+{role.tasks.length - 3}</span>}
                               {(!role.tasks || role.tasks.length === 0) && <span className="text-[10px] text-slate-300 italic">Ingen sjekkliste</span>}
                            </div>
                         </div>
                       ))}
                       {roles.length === 0 && <p className="col-span-full py-12 text-center text-slate-400 italic bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">Ingen roller opprettet for dette teamet.</p>}
                    </div>
                 </section>

                 <section>
                    <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-8">👥 Teammedlemmer</h4>
                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden divide-y divide-slate-50">
                       {members.map(m => (
                         <div key={m.id} className="p-5 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm uppercase shadow-sm">{m.person.fullName[0]}</div>
                               <div>
                                  <p className="text-sm font-black text-slate-900">{m.person.fullName}</p>
                                  {m.membershipRole === 'leader' && <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Teamleder</span>}
                               </div>
                            </div>
                            {auth.isAdmin && <button onClick={() => removeGroupMember(m.id)} className="text-[10px] font-black uppercase text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">Fjern</button>}
                         </div>
                       ))}
                       {auth.isAdmin && (
                         <div className="p-6 bg-slate-50/30">
                            <PersonSelector people={people} onSelect={pid => addGroupMember(selectedGroup.id, pid)} placeholder="Legg til ny person i teamet..." className="shadow-sm" />
                         </div>
                       )}
                    </div>
                 </section>
              </div>
            </div>
          ) : (
            <div className="h-[50vh] flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300 text-center p-12">
               <span className="text-7xl mb-6">🛠️</span>
               <p className="font-black text-xl text-slate-400 uppercase tracking-tighter">Velg et team for å se detaljer</p>
               <p className="text-slate-300 mt-2 font-medium">Alle Operative teams dukker opp i listen til venstre.</p>
            </div>
          )}
        </div>
      </div>

      {/* Role Edit Modal */}
      {editingRole && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md" onClick={() => setEditingRole(null)}>
           <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-8">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight">{editingRole.name ? 'Rediger' : 'Ny'} Rolle</h3>
                 <button onClick={() => setEditingRole(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">✕</button>
              </div>
              
              <div className="space-y-6">
                 <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 px-1 tracking-widest">Rollenavn</label>
                    <input type="text" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" placeholder="F.eks. Lydansvarlig" value={editingRole.name} onChange={e => setEditingRole({...editingRole, name: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 px-1 tracking-widest">Beskrivelse / Ansvar</label>
                    <textarea className="w-full bg-slate-50 border-none rounded-2xl p-4 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" placeholder="Kort beskrivelse av rollen" value={editingRole.description} onChange={e => setEditingRole({...editingRole, description: e.target.value})} />
                 </div>
                 
                 <div className="pt-8 border-t border-slate-100">
                    <h5 className="text-[11px] font-black uppercase text-slate-400 mb-4 tracking-widest px-1">Sjekkliste / Instruks</h5>
                    <div className="space-y-2 mb-6 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                       {editingRole.tasks?.map(t => (
                         <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:border-blue-200">
                            <div className="flex-1">
                               <p className="text-sm font-bold text-slate-700 leading-snug">{t.title}</p>
                               {t.deadline && <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg mt-2 inline-block">⏰ {t.deadline}</span>}
                            </div>
                            <button onClick={() => setEditingRole({...editingRole, tasks: editingRole.tasks?.filter(x => x.id !== t.id)})} className="w-8 h-8 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center">✕</button>
                         </div>
                       ))}
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 shadow-inner">
                       <input type="text" className="w-full bg-white border-none rounded-xl p-3 text-sm font-bold shadow-sm" placeholder="Ny oppgave (f.eks. Slå på miksepult)" value={newTaskInfo.title} onChange={e => setNewTaskInfo({...newTaskInfo, title: e.target.value})} />
                       <div className="flex gap-4">
                          <input type="text" className="flex-1 bg-white border-none rounded-xl p-3 text-[10px] font-black uppercase" placeholder="Frist (valgfritt)" value={newTaskInfo.deadline} onChange={e => setNewTaskInfo({...newTaskInfo, deadline: e.target.value})} />
                          <button onClick={handleAddRoleTask} disabled={!newTaskInfo.title} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50">Legg til</button>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="flex gap-6 mt-12">
                 <button onClick={() => setEditingRole(null)} className="flex-1 py-5 font-black text-slate-400 hover:text-slate-600 transition-colors">Avbryt</button>
                 <button onClick={() => { updateRoleDefinition(editingRole); setEditingRole(null); }} className="flex-1 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 text-lg">Lagre Rolle</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
