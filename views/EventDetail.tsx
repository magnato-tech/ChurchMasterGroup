
import React, { useState, useMemo } from 'react';
import { Event, TaskStatus, RecurrenceType, Task, ProgramItem, ResponsibleType, Assignment, Person, RoleDefinition, Group, EventOccurrence } from '../types';
import { useApp } from '../AppContext';
import { gemini } from '../geminiService';
import { PersonSelector } from '../components/PersonSelector';
import { calculateTimeline, TimelineItem } from '../utils/timelineLogic';

const recurrenceLabels: Record<RecurrenceType, string> = {
  [RecurrenceType.NONE]: 'Ingen (Enkeltarrangement)',
  [RecurrenceType.WEEKLY]: 'Ukentlig',
  [RecurrenceType.BI_WEEKLY]: 'Hver 2. uke',
  [RecurrenceType.TRI_WEEKLY]: 'Hver 3. uke',
  [RecurrenceType.QUAD_WEEKLY]: 'Hver 4. uke',
  [RecurrenceType.MONTHLY]: 'Månedlig (Første i mnd)',
};

export const EventDetail: React.FC<{ event: Event; selectedDate?: string; onBack: () => void }> = ({ event, selectedDate, onBack }) => {
  const { 
    people, groups, roleDefinitions, auth, canEditObject, updateTaskStatus, addTask, updateTask, deleteTask, updateEvent,
    addRoleDefinition, assignPersonToRole, deleteAssignment, addProgramItem, updateProgramItem, deleteProgramItem,
    applyTeamDefaultsToEvent, ensureOccurrenceForEdit, resetToMaster, getEventDataForDate
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'program' | 'tasks' | 'staffing'>('program');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgramItem, setEditingProgramItem] = useState<Partial<ProgramItem> | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);

  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState<{groupId: string} | null>(null);
  const [newRoleInfo, setNewRoleInfo] = useState({ name: '', description: '' });

  const { occurrence, program, assignments, tasks: eventTasks, masterAssignments } = getEventDataForDate(event.id, selectedDate);
  const currentOccId = occurrence?.id;

  const timeline = useMemo(() => {
    const eventTime = new Date(event.startTime).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
    return calculateTimeline(eventTime, program);
  }, [program, event.startTime]);

  const handleOpenProgramModal = (item?: ProgramItem, isMaster: boolean = false) => {
    if (item && !canEditObject('programItem', item)) return;
    setEditingProgramItem(item || { eventId: event.id, title: '', durationMinutes: 15, responsibleType: 'none', occurrenceId: isMaster ? undefined : currentOccId });
    setShowProgramModal(true);
  };

  const handleSaveProgramItem = () => {
    if (!editingProgramItem?.title) return;
    let targetOccId = editingProgramItem.occurrenceId;
    if (!targetOccId && selectedDate) targetOccId = ensureOccurrenceForEdit(event.id, selectedDate);
    if (editingProgramItem.id) updateProgramItem(editingProgramItem as ProgramItem);
    else addProgramItem(editingProgramItem as Omit<ProgramItem, 'id' | 'templateId' | 'orderIndex'>, targetOccId);
    setShowProgramModal(false);
  };

  const handleOpenTaskModal = (task?: Task, isMaster: boolean = false) => {
    if (task && !canEditObject('task', task)) return;
    setEditingTask(task || { eventId: event.id, title: '', description: '', assignedToId: '', dueDate: event.startTime.split('T')[0], status: TaskStatus.TODO, occurrenceId: isMaster ? undefined : currentOccId });
    setShowTaskModal(true);
  };

  const handleSaveTask = () => {
    if (!editingTask?.title) return;
    let targetOccId = editingTask.occurrenceId;
    if (!targetOccId && selectedDate) targetOccId = ensureOccurrenceForEdit(event.id, selectedDate);
    if (editingTask.id) updateTask(editingTask as Task);
    else addTask(editingTask, targetOccId);
    setShowTaskModal(false);
  };

  const handleAddTeamToEvent = (groupId: string) => {
    if (!auth.isAdmin) return;
    if (event.groupIds.includes(groupId)) return;
    updateEvent({ ...event, groupIds: [...event.groupIds, groupId] });
    setShowAddTeamModal(false);
  };

  const handleAddRoleToTeam = () => {
    if (!showAddRoleModal || !newRoleInfo.name) return;
    addRoleDefinition({
      id: crypto.randomUUID(),
      name: newRoleInfo.name,
      description: newRoleInfo.description,
      groupId: showAddRoleModal.groupId
    });
    setNewRoleInfo({ name: '', description: '' });
    setShowAddRoleModal(null);
  };

  const getResponsibleLabel = (type: ResponsibleType, id?: string) => {
    if (!id || type === 'none') return '—';
    if (type === 'person') return people.find(p => p.id === id)?.fullName || 'Ukjent';
    if (type === 'group') return groups.find(t => t.id === id)?.name || 'Ukjent';
    if (type === 'role') return roleDefinitions.find(rd => rd.id === id)?.name || 'Ukjent';
    if (type === 'assignment') {
      const ass = assignments.find(a => a.id === id) || masterAssignments.find(a => a.id === id);
      return roleDefinitions.find(rd => rd.id === ass?.roleId)?.name || 'Bemanning';
    }
    return '—';
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Er du sikker på at du vil slette denne oppgaven?")) {
      deleteTask(taskId);
    }
  };

  const handleReset = () => {
    if (!selectedDate) return;
    if (confirm("Vil du slette alle endringer for denne datoen og nullstille til Master?")) {
      resetToMaster(event.id, selectedDate);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-12">
      {selectedDate ? (
        <div className={`p-4 rounded-3xl flex items-start justify-between gap-4 border ${occurrence ? 'bg-indigo-50 border-indigo-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex gap-4">
            <span className="text-2xl">{occurrence ? '✏️' : '🔔'}</span>
            <div>
              <p className="font-bold">Du redigerer: {new Date(selectedDate).toLocaleDateString('no-NO', { day: 'numeric', month: 'long' })}</p>
              <p className="text-sm opacity-70">{occurrence ? 'Dette er et lokalt snapshot (frossen kopi).' : 'Endringer du gjør nå vil opprette en kopi for kun denne datoen.'}</p>
            </div>
          </div>
          {occurrence && auth.isAdmin && (
            <button onClick={handleReset} className="text-xs font-black uppercase bg-white text-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-200 shadow-sm hover:bg-indigo-50 transition-colors">
              🔄 Nullstill til Master
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-800 text-white p-4 rounded-3xl flex items-start gap-4">
           <span className="text-2xl">🛡️</span>
           <div>
              <p className="font-bold">Du redigerer serien (Master).</p>
              <p className="text-sm text-slate-300">Endringer her fungerer som en mal for fremtiden.</p>
           </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">⬅️</button>
        <div className="flex-1">
          <h2 className="text-3xl font-black text-slate-900">{occurrence?.title || event.name}</h2>
          <p className="text-slate-500 font-medium">{recurrenceLabels[event.recurrence]}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex border-b border-slate-50">
              <button onClick={() => setActiveTab('program')} className={`flex-1 py-4 font-bold ${activeTab === 'program' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : ''}`}>Kjøreplan</button>
              <button onClick={() => setActiveTab('tasks')} className={`flex-1 py-4 font-bold ${activeTab === 'tasks' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : ''}`}>Oppgaver ({eventTasks.length})</button>
              <button onClick={() => setActiveTab('staffing')} className={`flex-1 py-4 font-bold ${activeTab === 'staffing' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : ''}`}>Bemanning</button>
            </div>

            <div className="p-6">
              {activeTab === 'program' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold">Timeline</h4>
                    <button onClick={() => handleOpenProgramModal()} className="text-xs bg-blue-600 text-white font-black px-3 py-1.5 rounded-lg">➕ Legg til</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50">
                          <th className="pb-3 w-24">Tid</th>
                          <th className="pb-3">Tittel</th>
                          <th className="pb-3">Ansvarlig</th>
                          <th className="pb-3 text-right">Valg</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {timeline.map((item) => {
                          const canEdit = canEditObject('programItem', item);
                          return (
                            <tr key={item.id} className={`group hover:bg-slate-50/50 ${!canEdit ? 'opacity-70' : ''}`}>
                              <td className="py-4">
                                <span className="font-black">{item.displayStartTime}</span>
                              </td>
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold">{item.title}</p>
                                  {!canEdit && <span className="text-[10px]">🔒</span>}
                                </div>
                              </td>
                              <td className="py-4">
                                 <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                   {getResponsibleLabel(item.responsibleType, item.responsibleId)}
                                 </span>
                              </td>
                              <td className="py-4 text-right">
                                 {canEdit && (
                                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleOpenProgramModal(item)} className="p-1 hover:bg-slate-100 rounded">✏️</button>
                                      <button onClick={() => deleteProgramItem(item.id)} className="p-1 hover:bg-red-50 text-red-500 rounded">🗑️</button>
                                   </div>
                                 )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-4">
                   <div className="flex justify-between items-center mb-4">
                     <h4 className="font-bold">Oppgaver</h4>
                     <button onClick={() => handleOpenTaskModal()} className="text-xs bg-blue-600 text-white font-black px-3 py-1.5 rounded-lg">➕ Ny oppgave</button>
                   </div>
                   {eventTasks.map(t => (
                     <div key={t.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-blue-200 transition-all">
                        <div>
                           <div className="flex items-center gap-2">
                             <p className="font-bold">{t.title}</p>
                             {!canEditObject('task', t) && <span className="text-[10px]">🔒</span>}
                           </div>
                           <p className="text-xs text-slate-500">{t.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {canEditObject('task', t) && (
                            <>
                              <button onClick={() => handleOpenTaskModal(t)} className="opacity-0 group-hover:opacity-100 text-blue-600 text-xs font-bold hover:underline transition-all">Rediger</button>
                              <button onClick={() => handleDeleteTask(t.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">🗑️</button>
                            </>
                          )}
                        </div>
                     </div>
                   ))}
                   {eventTasks.length === 0 && <p className="text-center py-12 text-slate-400 italic">Ingen oppgaver tilknyttet arrangementet.</p>}
                </div>
              )}

              {activeTab === 'staffing' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h4 className="font-bold">Bemanning per Team</h4>
                    {auth.isAdmin && (
                      <button 
                        onClick={() => setShowAddTeamModal(true)}
                        className="text-xs font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                      >
                        ➕ Legg til Team
                      </button>
                    )}
                  </div>
                  {event.groupIds.map(tid => {
                    const group = groups.find(t => t.id === tid);
                    const rolesForTeam = roleDefinitions.filter(rd => rd.groupId === tid);
                    const currentTeamAssignments = assignments.filter(a => a.groupId === tid);
                    const canManage = auth.isAdmin || auth.ledGroups.some(t => t.id === tid);

                    return (
                      <div key={tid} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between border-b pb-2">
                           <div className="flex items-center gap-3">
                             <h5 className="font-black text-slate-900">{group?.name}</h5>
                             {canManage && (
                               <button 
                                 onClick={() => setShowAddRoleModal({groupId: tid})}
                                 className="text-[9px] font-black uppercase text-slate-400 hover:text-blue-500 transition-colors"
                               >
                                 [+ Rolle]
                               </button>
                             )}
                           </div>
                           {canManage && <button onClick={() => applyTeamDefaultsToEvent(event.id, tid, { fillOnlyEmpty: true, overwriteFilled: false }, currentOccId)} className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter hover:bg-blue-50 px-2 py-1 rounded">Fyll standard</button>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {rolesForTeam.map(role => {
                            const roleAss = currentTeamAssignments.filter(a => a.roleId === role.id);
                            return (
                              <div key={role.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <div className="flex items-center justify-between mb-2">
                                   <p className="text-xs font-black uppercase text-slate-400">{role.name}</p>
                                   {!canManage && <span className="text-[10px]">🔒</span>}
                                 </div>
                                 <div className="space-y-1">
                                    {roleAss.map(a => (
                                      <div key={a.id} className="bg-white p-2 rounded-xl text-xs flex items-center justify-between border border-slate-100">
                                         <span>{people.find(p => p.id === a.personId)?.fullName || 'Ledig'}</span>
                                         {canManage && <button onClick={() => deleteAssignment(a.id)} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>}
                                      </div>
                                    ))}
                                    {canManage && <PersonSelector people={people.filter(p=>p.active)} onSelect={(pid) => assignPersonToRole({personId: pid, roleId: role.id, groupId: tid, eventId: event.id}, currentOccId)} placeholder="Legg til..." />}
                                 </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {event.groupIds.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                      <p className="text-slate-400 italic">Ingen team er tilknyttet dette arrangementet.</p>
                      {auth.isAdmin && <button onClick={() => setShowAddTeamModal(true)} className="mt-4 text-blue-600 font-bold text-sm">Legg til ditt første team</button>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="font-bold mb-4">Informasjon</h4>
              <div className="space-y-3 text-sm">
                 <div><p className="text-xs font-black text-slate-400 uppercase">Sted</p><p className="font-medium text-slate-700">{event.location}</p></div>
                 <div><p className="text-xs font-black text-slate-400 uppercase">Tid</p><p className="font-medium text-slate-700">{new Date(event.startTime).toLocaleTimeString('no-NO', {hour:'2-digit',minute:'2-digit'})} - {new Date(event.endTime).toLocaleTimeString('no-NO', {hour:'2-digit',minute:'2-digit'})}</p></div>
                 <div className="pt-3 border-t">
                    <p className="text-xs font-black text-slate-400 uppercase mb-2">Tilknyttede Teams</p>
                    <div className="flex flex-wrap gap-2">{event.groupIds.map(tid => <span key={tid} className="bg-slate-100 px-2 py-1 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">{groups.find(t=>t.id===tid)?.name}</span>)}</div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Program Item Modal */}
      {showProgramModal && editingProgramItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-6">Rediger Programpost {!editingProgramItem.occurrenceId && '(Master)'}</h3>
            <div className="space-y-4">
              <input type="text" className="w-full bg-slate-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tittel" value={editingProgramItem.title} onChange={e => setEditingProgramItem({...editingProgramItem, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" className="w-full bg-slate-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={editingProgramItem.durationMinutes} onChange={e => setEditingProgramItem({...editingProgramItem, durationMinutes: Number(e.target.value)})} />
                <select className="w-full bg-slate-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={editingProgramItem.responsibleType} onChange={e => setEditingProgramItem({...editingProgramItem, responsibleType: e.target.value as ResponsibleType, responsibleId: undefined})}>
                  <option value="none">Ingen</option>
                  <option value="group">Team</option>
                  <option value="person">Person</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowProgramModal(false)} className="flex-1 py-3 text-slate-400 font-bold">Avbryt</button>
              <button onClick={handleSaveProgramItem} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-colors">Lagre</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && editingTask && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-6">Rediger Oppgave</h3>
            <div className="space-y-4">
              <input type="text" className="w-full bg-slate-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tittel" value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} />
              <textarea className="w-full bg-slate-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Beskrivelse" value={editingTask.description} onChange={e => setEditingTask({...editingTask, description: e.target.value})} />
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowTaskModal(false)} className="flex-1 py-3 text-slate-400 font-bold">Avbryt</button>
              <button onClick={handleSaveTask} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-colors">Lagre</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team to Event Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-6">Legg til Team i arrangement</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {groups.filter(t => !event.groupIds.includes(t.id)).map(group => (
                <button 
                  key={group.id}
                  onClick={() => handleAddTeamToEvent(group.id)}
                  className="w-full text-left p-4 hover:bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 transition-colors"
                >
                  {group.name}
                </button>
              ))}
              {groups.filter(t => !event.groupIds.includes(t.id)).length === 0 && <p className="text-slate-400 italic text-center py-4">Alle teams er allerede lagt til.</p>}
            </div>
            <div className="mt-8">
              <button onClick={() => setShowAddTeamModal(false)} className="w-full py-3 text-slate-400 font-bold">Lukk</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Role to Team Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-6">Ny Rolle for {groups.find(t=>t.id===showAddRoleModal.groupId)?.name}</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                className="w-full bg-slate-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Rollenavn (f.eks. Piano)" 
                value={newRoleInfo.name} 
                onChange={e => setNewRoleInfo({...newRoleInfo, name: e.target.value})} 
              />
              <textarea 
                className="w-full bg-slate-50 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Kort beskrivelse" 
                value={newRoleInfo.description} 
                onChange={e => setNewRoleInfo({...newRoleInfo, description: e.target.value})} 
              />
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowAddRoleModal(null)} className="flex-1 py-3 text-slate-400 font-bold">Avbryt</button>
              <button onClick={handleAddRoleToTeam} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-colors">Opprett Rolle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};