
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../AppContext';
// Import Role to filter out admin activity logs correctly
import { TaskStatus, Role } from '../types';
import { 
  generateCalendarInstances, 
  getStartOfMonth, 
  getEndOfMonth, 
  getStartOfWeek, 
  getEndOfWeek, 
  formatToISODate,
  CalendarInstance
} from '../utils/dateUtils';

export const Dashboard: React.FC<{ onSelectInstance: (id: string, date: string) => void }> = ({ onSelectInstance }) => {
  const { events, groups, auth, tasks, eventOccurrences, activityLogs, people } = useApp();
  const { isAdmin } = auth;
  
  // View State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [intervalMode, setIntervalMode] = useState<'month' | 'week'>('month');
  const [displayMode, setDisplayMode] = useState<'calendar' | 'list'>('calendar');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Filter State (Search only)
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setDisplayMode('list');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate Range
  const range = useMemo(() => {
    if (intervalMode === 'month') {
      return { start: getStartOfMonth(currentDate), end: getEndOfMonth(currentDate) };
    } else {
      return { start: getStartOfWeek(currentDate), end: getEndOfWeek(currentDate) };
    }
  }, [currentDate, intervalMode]);

  // Generate Instances
  const allInstances = useMemo(() => {
    return generateCalendarInstances(events, range.start, range.end);
  }, [events, range]);

  // Filtered Instances
  const filteredInstances = useMemo(() => {
    return allInstances.filter(inst => 
      inst.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allInstances, searchQuery]);

  // Task Stats for the top bar
  const myTasks = auth.currentPerson ? tasks.filter(t => t.assignedToId === auth.currentPerson?.id) : [];
  const pendingTasksCount = myTasks.filter(t => t.status !== TaskStatus.DONE).length;

  const navigate = (direction: number) => {
    const next = new Date(currentDate);
    if (intervalMode === 'month') {
      next.setMonth(next.getMonth() + direction);
    } else {
      next.setDate(next.getDate() + direction * 7);
    }
    setCurrentDate(next);
  };

  const hasOverride = (eventId: string, date: string) => {
    return eventOccurrences.some(o => o.eventId === eventId && o.instanceDate === date);
  };

  const adminLogs = useMemo(() => {
    // Show changes made by team leaders for the admin
    return activityLogs
      .filter(log => {
        const person = people.find(p => p.id === log.personId);
        // Fixed: Only show non-admin logs by checking Role.ADMIN instead of non-existent ADMIN_EMAILS constant
        return person && !person.roles.includes(Role.ADMIN);
      })
      .slice(0, 8);
  }, [activityLogs, people]);

  const renderList = () => {
    const groupedByDate: Record<string, CalendarInstance[]> = {};
    filteredInstances.forEach(inst => {
      if (!groupedByDate[inst.instanceDate]) groupedByDate[inst.instanceDate] = [];
      groupedByDate[inst.instanceDate].push(inst);
    });

    const sortedDates = Object.keys(groupedByDate).sort();

    return (
      <div className="space-y-6">
        {sortedDates.map(dateStr => (
          <div key={dateStr} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-xs font-black uppercase text-slate-400 mb-2 px-1">
              {new Date(dateStr).toLocaleDateString('no-NO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h4>
            <div className="space-y-2">
              {groupedByDate[dateStr].map(inst => (
                <button 
                  key={`${inst.eventId}-${inst.instanceDate}`}
                  onClick={() => onSelectInstance(inst.eventId, inst.instanceDate)}
                  className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-blue-600 w-12">{inst.startTime}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{inst.title}</p>
                        {hasOverride(inst.eventId, inst.instanceDate) && (
                          <span title="Overstyrt dato" className="text-[10px] bg-indigo-100 text-indigo-600 px-1 rounded font-bold">Overstyrt ✏️</span>
                        )}
                        <div className="flex gap-1">
                          {inst.teamIds.map(tid => {
                            const group = groups.find(g => g.id === tid);
                            return (
                              <span 
                                key={tid} 
                                className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded"
                                title={group?.name}
                              >
                                {group?.name.substring(0, 2) || 'T'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">→</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {filteredInstances.length === 0 && (
          <div className="py-20 text-center text-slate-400 italic bg-white rounded-3xl border border-dashed border-slate-200">
            Ingen arrangementer i valgt periode.
          </div>
        )}
      </div>
    );
  };

  const renderGrid = () => {
    const days = [];
    const start = intervalMode === 'month' ? getStartOfMonth(currentDate) : getStartOfWeek(currentDate);
    const end = intervalMode === 'month' ? getEndOfMonth(currentDate) : getEndOfWeek(currentDate);

    if (intervalMode === 'month') {
      const firstDay = start.getDay();
      const padding = firstDay === 0 ? 6 : firstDay - 1;
      for (let i = 0; i < padding; i++) days.push(null);
    }

    const totalDays = intervalMode === 'month' ? end.getDate() : 7;
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(start);
      d.setDate(i);
      days.push(d);
    }

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(d => (
          <div key={d} className="bg-slate-50 py-2 text-center text-[10px] font-black uppercase text-slate-400">{d}</div>
        ))}
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="bg-slate-50 min-h-[120px]"></div>;
          
          const iso = formatToISODate(day);
          const dayInstances = filteredInstances.filter(inst => inst.instanceDate === iso);
          const isToday = iso === formatToISODate(new Date());

          return (
            <div key={iso} className={`bg-white min-h-[120px] p-2 hover:bg-slate-50/50 transition-colors ${isToday ? 'ring-inset ring-2 ring-blue-500/20' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-bold ${isToday ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-400'}`}>
                  {day.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {dayInstances.slice(0, 3).map(inst => {
                  const overridden = hasOverride(inst.eventId, inst.instanceDate);
                  return (
                    <button 
                      key={`${inst.eventId}-${inst.instanceDate}`}
                      onClick={() => onSelectInstance(inst.eventId, inst.instanceDate)}
                      className={`w-full text-left p-1.5 rounded-lg group transition-all border ${overridden ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-600' : 'bg-blue-50 border-blue-100 hover:bg-blue-600'}`}
                    >
                      <p className={`text-[10px] font-black group-hover:text-white truncate ${overridden ? 'text-indigo-700' : 'text-blue-700'}`}>
                        {inst.startTime} {inst.title} {overridden && '✏️'}
                      </p>
                    </button>
                  );
                })}
                {dayInstances.length > 3 && (
                  <p className="text-[9px] font-bold text-slate-400 text-center mt-1">+{dayInstances.length - 3} flere</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Top Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">📅</div>
          <div>
            <p className="text-sm font-medium text-slate-500">Aktiviteter</p>
            <p className="text-2xl font-black text-slate-900">{filteredInstances.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl">✅</div>
          <div>
            <p className="text-sm font-medium text-slate-500">Dine oppgaver</p>
            <p className="text-2xl font-black text-slate-900">{pendingTasksCount} åpne</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl">👥</div>
          <div>
            <p className="text-sm font-medium text-slate-500">Teams</p>
            <p className="text-2xl font-black text-slate-900">{groups.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          {/* Synchronized Control Toolbar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-600" aria-label="Forrige">◀</button>
                 <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 font-bold text-xs uppercase hover:bg-white rounded-lg transition-all text-slate-600">I dag</button>
                 <button onClick={() => navigate(1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-600" aria-label="Neste">▶</button>
              </div>
              <h3 className="text-lg font-black text-slate-900 min-w-[200px] text-center">
                {currentDate.toLocaleDateString('no-NO', { month: 'long', year: 'numeric' })}
              </h3>
            </div>

            <div className="flex flex-1 max-w-sm w-full gap-2">
               <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                  <input 
                    type="text" 
                    placeholder="Søk i arrangementer..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
               </div>
            </div>

            <div className="flex gap-4">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setIntervalMode('month')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${intervalMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Måned
                </button>
                <button 
                  onClick={() => setIntervalMode('week')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${intervalMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Uke
                </button>
              </div>

              {!isMobile && (
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setDisplayMode('calendar')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${displayMode === 'calendar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Kalender
                  </button>
                  <button 
                    onClick={() => setDisplayMode('list')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${displayMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Liste
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="animate-in fade-in duration-500">
            {displayMode === 'list' || isMobile ? renderList() : renderGrid()}
          </div>
        </div>

        {/* Activity Log / Audit Trail (Admin only) */}
        {isAdmin && (
          <div className="xl:col-span-1 space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest px-1 flex items-center gap-2">
              <span>🛡️</span> Siste endringer (Teamledere)
            </h4>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
               {adminLogs.map(log => {
                 const person = people.find(p => p.id === log.personId);
                 const event = events.find(e => e.id === log.eventId);
                 const date = log.occurrenceId ? eventOccurrences.find(o => o.id === log.occurrenceId)?.instanceDate : undefined;
                 
                 return (
                   <button 
                     key={log.id} 
                     onClick={() => onSelectInstance(log.eventId, date || '')}
                     className="w-full text-left p-4 hover:bg-slate-50 transition-colors group"
                   >
                      <div className="flex items-center justify-between mb-1">
                         <span className="text-[10px] font-bold text-blue-600">{person?.fullName || 'System'}</span>
                         <span className="text-[8px] text-slate-400 font-medium">
                            {new Date(log.timestamp).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{log.description}</p>
                      <p className="text-[9px] text-slate-400 mt-1 truncate">
                         {event?.name} {date && `(${date})`}
                      </p>
                   </button>
                 );
               })}
               {adminLogs.length === 0 && (
                 <div className="p-8 text-center text-slate-400 italic text-xs">
                    Ingen ferske endringer fra teamledere.
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};