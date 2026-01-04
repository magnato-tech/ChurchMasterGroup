
import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { Group, GroupCategory } from '../types';
import { PersonSelector } from '../components/PersonSelector';

export const Groups: React.FC = () => {
  const { groups, groupMembers, people, auth, addGroup, updateGroup, deleteGroup, addGroupMember, removeGroupMember } = useApp();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGroup, setNewGroup] = useState<Partial<Group>>({ name: '', category: 'fellowship', description: '', active: true });

  const nonServiceGroups = groups.filter(g => g.category !== 'service');
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

  const groupLeaders = members.filter(m => m.membershipRole === 'leader');
  const regularMembers = members.filter(m => m.membershipRole === 'member');

  // Pastor-verktøy logikk
  const allLeaders = useMemo(() => {
    const leaderIds = new Set(groupMembers.filter(gm => gm.membershipRole === 'leader' && gm.active).map(gm => gm.personId));
    return people.filter(p => leaderIds.has(p.id));
  }, [groupMembers, people]);

  const outsidePeople = useMemo(() => {
    const activeMemberIds = new Set(groupMembers.filter(gm => gm.active).map(gm => gm.personId));
    return people.filter(p => !activeMemberIds.has(p.id) && p.active);
  }, [groupMembers, people]);

  const handleSave = () => {
    if (newGroup.name && newGroup.category) {
      addGroup(newGroup as Omit<Group, 'id'>);
      setShowAddModal(false);
      setNewGroup({ name: '', category: 'fellowship', description: '', active: true });
    }
  };

  const handleToggleActive = (g: Group) => {
    updateGroup({...g, active: !g.active});
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-right-6 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Fellesskap & Strategi</h2>
          <p className="text-slate-500 mt-1 font-medium">Oversikt over husgrupper, eldsteteams og prosjektgrupper.</p>
        </div>
        {auth.isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-3"
          >
            <span>➕</span> Ny Gruppe
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Gruppeliste */}
        <div className="lg:col-span-1 space-y-6">
           {(['leadership', 'strategy', 'fellowship'] as GroupCategory[]).map(cat => {
             const catGroups = nonServiceGroups.filter(g => g.category === cat);
             if (catGroups.length === 0) return null;
             return (
               <div key={cat} className="space-y-3">
                 <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest px-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                    {cat === 'fellowship' ? 'Husgrupper' : cat === 'leadership' ? 'Ledelse' : 'Strategi'}
                 </h4>
                 {catGroups.map(g => (
                   <button
                     key={g.id}
                     onClick={() => setSelectedGroupId(g.id)}
                     className={`w-full text-left p-5 rounded-2xl border transition-all ${selectedGroupId === g.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20 -translate-y-1' : 'bg-white border-slate-100 hover:border-indigo-300 hover:shadow-md text-slate-600'}`}
                   >
                     <p className="font-bold truncate text-lg">{g.name}</p>
                     <p className={`text-[10px] font-black uppercase mt-1 tracking-tighter ${selectedGroupId === g.id ? 'opacity-80' : 'text-slate-400'}`}>
                        {groupMembers.filter(gm => gm.groupId === g.id && gm.active).length} medlemmer
                     </p>
                   </button>
                 ))}
               </div>
             );
           })}
        </div>

        {/* Gruppedetaljer */}
        <div className="lg:col-span-3">
           {selectedGroup ? (
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
                <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex justify-between items-start">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                         <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg">{selectedGroup.category}</span>
                         {!selectedGroup.active && <span className="text-[10px] font-black uppercase bg-slate-200 text-slate-600 px-3 py-1 rounded-lg">Inaktiv</span>}
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedGroup.name}</h3>
                      <p className="text-slate-500 font-medium mt-2 max-w-2xl">{selectedGroup.description || 'Ingen beskrivelse lagt til.'}</p>
                   </div>
                   {auth.isAdmin && (
                     <div className="flex gap-2">
                        <button onClick={() => handleToggleActive(selectedGroup)} className="text-xs font-black uppercase text-slate-400 hover:text-indigo-600 px-3 py-2 rounded-xl transition-colors">Pause</button>
                        <button onClick={() => { if(confirm("Slette gruppen permanent?")) deleteGroup(selectedGroup.id); }} className="text-xs font-black uppercase text-slate-300 hover:text-red-500 px-3 py-2 rounded-xl transition-colors">Slett</button>
                     </div>
                   )}
                </div>
                
                <div className="p-10 space-y-12">
                   {/* Ledere */}
                   <section>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">👑 Ledere</h4>
                        {auth.isAdmin && (
                          <div className="w-56"><PersonSelector people={people} onSelect={pid => addGroupMember(selectedGroupId!, pid, 'leader')} placeholder="Legg til leder..." className="shadow-sm" /></div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupLeaders.map(m => (
                          <div key={m.id} className="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-between group transition-all hover:bg-indigo-100/50">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-200 text-indigo-700 flex items-center justify-center font-black text-sm uppercase">{m.person.fullName[0]}</div>
                                <span className="font-black text-indigo-900">{m.person.fullName}</span>
                             </div>
                             {auth.isAdmin && <button onClick={() => removeGroupMember(m.id)} className="w-8 h-8 rounded-full bg-indigo-200/50 text-indigo-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">✕</button>}
                          </div>
                        ))}
                      </div>
                   </section>

                   {/* Medlemmer */}
                   <section>
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">👥 Medlemsliste</h4>
                        {auth.isAdmin && (
                          <div className="w-56"><PersonSelector people={people} onSelect={pid => addGroupMember(selectedGroupId!, pid, 'member')} placeholder="Legg til medlem..." className="shadow-sm" /></div>
                        )}
                      </div>
                      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                        {regularMembers.map(m => (
                          <div key={m.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                             <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs uppercase">{m.person.fullName[0]}</div>
                                <span className="font-bold text-slate-700">{m.person.fullName}</span>
                             </div>
                             {auth.isAdmin && <button onClick={() => removeGroupMember(m.id)} className="text-[10px] font-black uppercase text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">Fjern fra gruppe</button>}
                          </div>
                        ))}
                        {regularMembers.length === 0 && <p className="p-12 text-center text-slate-400 italic font-medium">Ingen registrerte medlemmer ennå.</p>}
                      </div>
                   </section>
                </div>
             </div>
           ) : (
             <div className="space-y-12">
                <div className="h-[40vh] flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300 text-center p-12">
                   <span className="text-7xl mb-6">🏠</span>
                   <p className="font-black text-xl text-slate-400">Velg en gruppe for å se administrasjon</p>
                   <p className="text-slate-300 mt-2 font-medium">Ledere og medlemmer administreres her.</p>
                </div>

                {/* Pastor-verktøy (Kun Admin/Pastor) */}
                {auth.isAdmin && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col animate-in slide-in-from-bottom-4 duration-1000">
                        <div className="flex items-center gap-3 mb-8">
                           <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">👑</div>
                           <h4 className="text-2xl font-black text-slate-900 tracking-tight">Lederlisten</h4>
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                           {allLeaders.map(p => (
                             <div key={p.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:border-blue-200 transition-all group">
                                <span className="font-bold text-slate-700">{p.fullName}</span>
                                <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">Aktiv Leder</span>
                             </div>
                           ))}
                           {allLeaders.length === 0 && <p className="text-center text-slate-400 italic py-10">Ingen registrerte ledere.</p>}
                        </div>
                     </div>

                     <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col animate-in slide-in-from-bottom-4 duration-1000 delay-100">
                        <div className="flex items-center gap-3 mb-8">
                           <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-2xl">❓</div>
                           <h4 className="text-2xl font-black text-slate-900 tracking-tight">Utenfor-listen</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase mb-6 tracking-widest px-1">Aktive personer uten noe medlemskap</p>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                           {outsidePeople.map(p => (
                             <div key={p.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:border-red-200 transition-all">
                                <span className="font-bold text-slate-700">{p.fullName}</span>
                                <button className="text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600">📧 Send invitasjon</button>
                             </div>
                           ))}
                           {outsidePeople.length === 0 && <p className="text-center text-slate-400 italic py-10">Alle aktive er med i minst én gruppe!</p>}
                        </div>
                     </div>
                  </div>
                )}
             </div>
           )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}>
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <h3 className="text-3xl font-black mb-8 tracking-tight text-slate-900">Opprett ny gruppe</h3>
              <div className="space-y-6">
                 <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 tracking-widest px-1">Navn på gruppen</label>
                    <input type="text" placeholder="F.eks. Husgruppe Sør" className="w-full bg-slate-50 border-none rounded-2xl p-5 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 tracking-widest px-1">Kategori</label>
                    <select className="w-full bg-slate-50 border-none rounded-2xl p-5 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" value={newGroup.category} onChange={e => setNewGroup({...newGroup, category: e.target.value as GroupCategory})}>
                       <option value="fellowship">Husgruppe / Sosialt Fellesskap</option>
                       <option value="leadership">Ledergruppe / Eldsteråd</option>
                       <option value="strategy">Strategi / Prosjektgruppe</option>
                       <option value="service">Tjenesteteam (Operativt)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 tracking-widest px-1">Beskrivelse</label>
                    <textarea placeholder="Hva gjør gruppen?" className="w-full bg-slate-50 border-none rounded-2xl p-5 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] font-medium text-slate-700" value={newGroup.description} onChange={e => setNewGroup({...newGroup, description: e.target.value})} />
                 </div>
              </div>
              <div className="flex gap-6 mt-10">
                 <button onClick={() => setShowAddModal(false)} className="flex-1 py-5 font-black text-slate-400 hover:text-slate-600 transition-colors">Avbryt</button>
                 <button onClick={handleSave} className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 text-lg">Lagre Gruppe</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
