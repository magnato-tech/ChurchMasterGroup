
import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { EventStatus, RecurrenceType, Event } from '../types';

export const Events: React.FC<{ onSelectEvent: (e: Event) => void }> = ({ onSelectEvent }) => {
  const { events, addEvent } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    name: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    recurrence: RecurrenceType.NONE,
    status: EventStatus.PLANNED,
    groupIds: []
  });

  const handleCreate = () => {
    if (newEvent.name && newEvent.startTime) {
      addEvent({
        ...newEvent,
        id: `e-${Date.now()}`,
      } as Event);
      setShowAddModal(false);
      // Reset form
      setNewEvent({
        name: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        recurrence: RecurrenceType.NONE,
        status: EventStatus.PLANNED,
        groupIds: []
      });
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Arrangementer</h2>
          <p className="text-slate-500 mt-1">Planlegg og administrer organisasjonens aktiviteter.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
        >
          <span>➕</span> Nytt Arrangement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <div 
            key={event.id} 
            onClick={() => onSelectEvent(event)}
            className="group bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer"
          >
            <div className="h-32 bg-slate-100 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent"></div>
               <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm">
                  {event.recurrence === RecurrenceType.NONE ? 'Single' : event.recurrence.replace('_', ' ')}
               </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{event.name}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-4">{event.description}</p>
              
              <div className="flex flex-col gap-2 border-t border-slate-50 pt-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <span>📅</span>
                  {new Date(event.startTime).toLocaleDateString('no-NO', { day: 'numeric', month: 'long' })}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <span>📍</span>
                  {event.location}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <h3 className="text-2xl font-bold mb-6 text-slate-900">Opprett nytt arrangement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Navn</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Hva skal arrangementet hete?"
                  value={newEvent.name}
                  onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Beskrivelse</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                  placeholder="Gi en kort beskrivelse av innholdet..."
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Sted</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Fysisk adresse eller link"
                  value={newEvent.location}
                  onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Starttid</label>
                  <input 
                    type="datetime-local" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newEvent.startTime}
                    onChange={e => setNewEvent({...newEvent, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Sluttid</label>
                  <input 
                    type="datetime-local" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newEvent.endTime}
                    onChange={e => setNewEvent({...newEvent, endTime: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Gjentagelsesmønster</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newEvent.recurrence}
                  onChange={e => setNewEvent({...newEvent, recurrence: e.target.value as RecurrenceType})}
                >
                  <option value={RecurrenceType.NONE}>Ingen (Enkeltarrangement)</option>
                  <option value={RecurrenceType.WEEKLY}>Ukentlig</option>
                  <option value={RecurrenceType.BI_WEEKLY}>Annenhver uke (2. hver uke)</option>
                  <option value={RecurrenceType.MONTHLY}>Månedlig</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  Gjentagende arrangementer vil automatisk generere forekomster frem i tid.
                </p>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all"
              >
                Avbryt
              </button>
              <button 
                onClick={handleCreate}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
              >
                Lagre Arrangement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};