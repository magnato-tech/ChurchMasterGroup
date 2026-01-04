
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Events } from './views/Events';
import { EventDetail } from './views/EventDetail';
import { Tasks } from './views/Tasks';
import { Teams } from './views/Teams';
import { People } from './views/People';
import { Groups } from './views/Groups';
import { MyVaktliste } from './views/MyVaktliste';
import { AppProvider, useApp } from './AppContext';
import { Event } from './types';

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState('vaktliste');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const { events } = useApp();

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setActiveView('event-detail');
  };

  const handleInstanceSelect = (eventId: string, date: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setSelectedDate(date);
      setActiveView('event-detail');
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'vaktliste': return <MyVaktliste />;
      case 'dashboard': return <Dashboard onSelectInstance={handleInstanceSelect} />;
      case 'events': return <Events onSelectEvent={handleEventSelect} />;
      case 'event-detail': return selectedEvent ? (
        <EventDetail 
          event={selectedEvent} 
          selectedDate={selectedDate}
          onBack={() => setActiveView(selectedDate ? 'dashboard' : 'events')} 
        />
      ) : <Events onSelectEvent={handleEventSelect} />;
      case 'tasks': return <Tasks />;
      case 'people': return <People />;
      case 'teams': return <Teams />;
      case 'grupper': return <Groups />;
      default: return <MyVaktliste />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Layout activeView={activeView} onViewChange={setActiveView}>
        {renderView()}
      </Layout>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
