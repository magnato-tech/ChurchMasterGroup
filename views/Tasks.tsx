
import React from 'react';
import { useApp } from '../AppContext';
import { TaskStatus } from '../types';

export const Tasks: React.FC = () => {
  const { getMyTasks, updateTaskStatus, events } = useApp();
  const myTasks = getMyTasks(60); // 60 days projection

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900">Mine Oppgaver</h2>
        <p className="text-slate-500 mt-1">Ditt personlige veikart for de neste 60 dagene.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
        {myTasks.length > 0 ? myTasks.map(task => {
          const event = events.find(e => e.id === task.eventId);
          const taskDate = task.occurrenceDate || (task.dueDate ? task.dueDate.split('T')[0] : '');
          
          return (
            <div key={`${task.id}-${taskDate}`} className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 transition-colors group">
              <button 
                onClick={() => updateTaskStatus(task.id, task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE)}
                className={`w-10 h-10 shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all ${task.status === TaskStatus.DONE ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200 text-transparent hover:border-blue-400'}`}
              >
                <span className="text-xl">✓</span>
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {new Date(taskDate).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })} • {event?.name || 'Generell'}
                  </span>
                  {task.status === TaskStatus.DONE && <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded">Ferdig</span>}
                  {task.occurrenceId && <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest bg-indigo-50 px-2 rounded-full">Override</span>}
                </div>
                <h4 className={`text-lg font-bold text-slate-900 ${task.status === TaskStatus.DONE ? 'line-through text-slate-400' : ''}`}>{task.title}</h4>
                <p className="text-sm text-slate-500">{task.description}</p>
              </div>
            </div>
          );
        }) : (
          <div className="py-20 text-center flex flex-col items-center gap-4 grayscale opacity-50">
             <span className="text-6xl">🛀</span>
             <h3 className="text-xl font-bold text-slate-900">Alt er gjort!</h3>
             <p className="text-slate-500 max-w-xs">Ingen oppgaver tildelt deg de neste 60 dagene.</p>
          </div>
        )}
      </div>
    </div>
  );
};