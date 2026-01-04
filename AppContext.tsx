
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  Person, Group, GroupMember, Event, Task, Role, RoleDefinition, 
  Assignment, ProgramItem, TeamRoleMember, EventOccurrence, ActivityLog, 
  RecurrenceType, EventStatus, TaskStatus, GroupCategory
} from './types';
import { generateCalendarInstances } from './utils/dateUtils';

const ADMIN_EMAILS = ['admin@kirken.no', 'pastor@kirken.no'];
const IDENTITY_KEY = "eventmaster_identity_id";

interface AppContextType {
  people: Person[];
  groups: Group[];
  groupMembers: GroupMember[];
  events: Event[];
  tasks: Task[];
  roleDefinitions: RoleDefinition[];
  assignments: Assignment[];
  programItems: ProgramItem[];
  teamRoleMembers: TeamRoleMember[];
  eventOccurrences: EventOccurrence[];
  activityLogs: ActivityLog[];
  auth: {
    currentPerson: Person | null;
    isAdmin: boolean;
    setIdentity: (personId: string) => void;
    ledGroups: Group[];
    logout: () => void;
    login: (email: string) => void;
    authStatus: 'authenticated' | 'unauthenticated';
    sessionEmail: string;
    isReadOnly: boolean;
  };
  addEvent: (event: Event) => void;
  updateEvent: (event: Event) => void;
  addGroup: (group: Omit<Group, 'id'>) => void;
  updateGroup: (group: Group) => void;
  deleteGroup: (id: string) => void;
  addGroupMember: (groupId: string, personId: string, role?: 'member' | 'leader') => void;
  removeGroupMember: (memberId: string) => void;
  addRoleDefinition: (role: RoleDefinition) => void;
  updateRoleDefinition: (role: RoleDefinition) => void;
  deleteRoleDefinition: (id: string) => void;
  assignPersonToRole: (assignment: Omit<Assignment, 'id' | 'templateId'>, occurrenceId?: string) => void;
  deleteAssignment: (id: string) => void;
  addProgramItem: (item: Omit<ProgramItem, 'id' | 'templateId' | 'orderIndex'>, occurrenceId?: string) => void;
  updateProgramItem: (item: ProgramItem) => void;
  deleteProgramItem: (id: string) => void;
  reorderProgramItem: (eventId: string, oldIdx: number, newIdx: number, occurrenceId?: string) => void;
  addTask: (task: Partial<Task>, occurrenceId?: string) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addPerson: (p: Omit<Person, 'id' | 'createdAt'>) => void;
  updatePerson: (p: Person) => void;
  getMyTasks: (daysAhead: number) => Task[];
  applyTeamDefaultsToEvent: (eventId: string, groupId: string, config: { fillOnlyEmpty: boolean, overwriteFilled: boolean }, occurrenceId?: string) => void;
  resetToMaster: (eventId: string, date: string) => void;
  ensureOccurrenceForEdit: (eventId: string, date: string) => string;
  getEventDataForDate: (eventId: string, date?: string) => any;
  canEdit: (type: 'event' | 'group' | 'assignment' | 'program' | 'programItem' | 'task', obj?: any) => boolean;
  canEditObject: (type: 'event' | 'group' | 'assignment' | 'program' | 'programItem' | 'task', obj?: any) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [programItems, setProgramItems] = useState<ProgramItem[]>([]);
  const [teamRoleMembers, setTeamRoleMembers] = useState<TeamRoleMember[]>([]);
  const [eventOccurrences, setEventOccurrences] = useState<EventOccurrence[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [currentIdentityId, setCurrentIdentityId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(IDENTITY_KEY);
    if (saved) setCurrentIdentityId(saved);

    if (people.length === 0) {
      // 1. People
      const initPeople = [
        { id: 'p-admin', fullName: 'Admin Anders', email: 'admin@kirken.no', roles: [Role.ADMIN], active: true, createdAt: Date.now() },
        { id: 'p-pastor', fullName: 'Pastor Pål', email: 'pastor@kirken.no', roles: [Role.ADMIN], active: true, createdAt: Date.now() },
        { id: 'p-lovsang', fullName: 'Lovsangs Lise', email: 'lovsang@kirken.no', roles: [Role.TEAM_LEADER], active: true, createdAt: Date.now() },
        { id: 'p-frode', fullName: 'Frivillig Frode', email: 'frode@kirken.no', roles: [Role.TEAM_MEMBER], active: true, createdAt: Date.now() },
        { id: 'p-thomas', fullName: 'Teknikk Thomas', email: 'teknikk@kirken.no', roles: [Role.TEAM_LEADER], active: true, createdAt: Date.now() },
      ];
      setPeople(initPeople);

      // 2. Groups (Backfill service teams + others)
      const initGroups: Group[] = [
        { id: 'g-generelt', name: 'Generelt / Ledelse', category: 'service', description: 'Hovedroller i gudstjenesten', active: true },
        { id: 'g-lovsang', name: 'Lovsang-team', category: 'service', description: 'Musikere og sangere', active: true },
        { id: 'g-teknikk', name: 'Teknikk-team', category: 'service', description: 'Lyd, lys og bilde', active: true },
        { id: 'g-eldste', name: 'Eldsteråd', category: 'leadership', description: 'Menighetens eldste', active: true },
        { id: 'g-hus1', name: 'Husgruppe Nord', category: 'fellowship', description: 'Onsdagssamling', active: true },
      ];
      setGroups(initGroups);

      // 3. Memberships
      setGroupMembers([
        { id: 'gm1', groupId: 'g-eldste', personId: 'p-pastor', membershipRole: 'leader', active: true, joinedAt: Date.now() },
        { id: 'gm2', groupId: 'g-lovsang', personId: 'p-lovsang', membershipRole: 'leader', active: true, joinedAt: Date.now() },
        { id: 'gm3', groupId: 'g-lovsang', personId: 'p-frode', membershipRole: 'member', active: true, joinedAt: Date.now() },
        { id: 'gm4', groupId: 'g-teknikk', personId: 'p-thomas', membershipRole: 'leader', active: true, joinedAt: Date.now() },
      ]);

      // 4. Role Definitions with detailed tasks (Gudstjeneste)
      const rd_moteleder: RoleDefinition = {
        id: 'rd-moteleder', name: 'Møteleder', groupId: 'g-generelt', description: 'Leder gudstjenesten',
        tasks: [
          { id: 'ml1', title: 'Snakke med taler om tema' },
          { id: 'ml2', title: 'Sy sammen kjøreplan' },
          { id: 'ml3', title: 'Lede bønnemøte kl 10:00' },
          { id: 'ml4', title: 'Sette deg inn i info/kollekt' }
        ]
      };
      const rd_lovsang: RoleDefinition = {
        id: 'rd-lovsang', name: 'Lovsangsleder', groupId: 'g-lovsang', description: 'Leder sang og tilbedelse',
        tasks: [
          { id: 'll1', title: 'Lage setliste (1 uke før)' },
          { id: 'll2', title: 'Sende noter til teamet' },
          { id: 'll3', title: 'Sende setliste til bilde-tekniker' }
        ]
      };
      const rd_markedsforing: RoleDefinition = {
        id: 'rd-marketing', name: 'Markedsføring', groupId: 'g-generelt', description: 'Synlighet i sosiale medier',
        tasks: [
          { id: 'mf1', title: 'Lage Facebook-arrangement', deadline: 'Mandag etter gudstjeneste', channel: 'Facebook' },
          { id: 'mf2', title: 'Sende info til By og Bygd', deadline: 'Onsdag kl 12:00', channel: 'Presse' }
        ]
      };
      const rd_motevert: RoleDefinition = { id: 'rd-motevert', name: 'Møtevert', groupId: 'g-generelt', description: 'Velkomst og rigging' };
      const rd_taler: RoleDefinition = { id: 'rd-taler', name: 'Taler', groupId: 'g-generelt', description: 'Dagens tale' };

      setRoleDefinitions([rd_moteleder, rd_lovsang, rd_markedsforing, rd_motevert, rd_taler]);

      // 5. Events & Program
      setEvents([{
        id: 'e-standard', name: 'Gudstjeneste', description: 'Søndagsgudstjeneste', location: 'Storsalen',
        startTime: '2025-02-16T11:00:00Z', endTime: '2025-02-16T12:30:00Z', recurrence: RecurrenceType.WEEKLY, status: EventStatus.PLANNED, groupIds: ['g-generelt', 'g-lovsang', 'g-teknikk']
      }]);

      setProgramItems([
        { id: 'pi0', templateId: 'pi0', eventId: 'e-standard', title: 'Velkommen ved inngang', durationMinutes: 15, orderIndex: 0, responsibleType: 'role', responsibleId: 'rd-motevert', manualStartTime: '10:45' },
        { id: 'pi1', templateId: 'pi1', eventId: 'e-standard', title: 'Lovsang x2', durationMinutes: 7, orderIndex: 1, responsibleType: 'role', responsibleId: 'rd-lovsang' },
        { id: 'pi2', templateId: 'pi2', eventId: 'e-standard', title: 'Velkommen & Åpningsord', durationMinutes: 3, orderIndex: 2, responsibleType: 'role', responsibleId: 'rd-moteleder' },
        { id: 'pi3', templateId: 'pi3', eventId: 'e-standard', title: 'Tale / undervisning', durationMinutes: 20, orderIndex: 9, responsibleType: 'role', responsibleId: 'rd-taler' },
        { id: 'pi4', templateId: 'pi4', eventId: 'e-standard', title: 'Kirkekaffe', durationMinutes: 30, orderIndex: 20, responsibleType: 'role', responsibleId: 'rd-motevert' },
      ]);
      
      setAssignments([
        { id: 'a1', templateId: 'a1', eventId: 'e-standard', groupId: 'g-generelt', roleId: 'rd-moteleder', personId: 'p-pastor' },
        { id: 'a2', templateId: 'a2', eventId: 'e-standard', groupId: 'g-lovsang', roleId: 'rd-lovsang', personId: 'p-lovsang' },
      ]);
    }
  }, []);

  const currentPerson = people.find(p => p.id === currentIdentityId) || null;
  const isAdmin = currentPerson ? ADMIN_EMAILS.includes(currentPerson.email.toLowerCase()) : false;
  const ledGroups = currentPerson ? groups.filter(g => groupMembers.some(gm => gm.groupId === g.id && gm.personId === currentPerson.id && gm.membershipRole === 'leader' && gm.active)) : [];

  const auth = {
    currentPerson,
    isAdmin,
    ledGroups,
    setIdentity: (id: string) => {
      setCurrentIdentityId(id);
      localStorage.setItem(IDENTITY_KEY, id);
    },
    logout: () => {
      setCurrentIdentityId(null);
      localStorage.removeItem(IDENTITY_KEY);
    },
    login: (email: string) => {
      const p = people.find(person => person.email.toLowerCase() === email.toLowerCase());
      if (p) {
        setCurrentIdentityId(p.id);
        localStorage.setItem(IDENTITY_KEY, p.id);
      }
    },
    authStatus: (currentPerson ? 'authenticated' : 'unauthenticated') as 'authenticated' | 'unauthenticated',
    sessionEmail: currentPerson?.email || '',
    isReadOnly: currentPerson ? (!isAdmin && ledGroups.length === 0) : true
  };

  const canEdit = (type: string, obj?: any) => {
    if (isAdmin) return true;
    if (!currentPerson) return false;
    const myLeaderGroupIds = groupMembers.filter(gm => gm.personId === currentPerson.id && gm.membershipRole === 'leader' && gm.active).map(gm => gm.groupId);
    
    if (type === 'group' && obj) return myLeaderGroupIds.includes(obj.id);
    if (type === 'assignment' && obj) return myLeaderGroupIds.includes(obj.groupId);
    if (type === 'program' || type === 'programItem') {
      if (!obj) return false;
      if (obj.responsibleType === 'group') return myLeaderGroupIds.includes(obj.responsibleId);
      if (obj.responsibleType === 'role') {
        const rd = roleDefinitions.find(r => r.id === obj.responsibleId);
        return rd && myLeaderGroupIds.includes(rd.groupId);
      }
    }
    if (type === 'task' && obj) {
       if (obj.assignedToId === currentPerson.id) return true;
       return myLeaderGroupIds.includes(obj.assignedToId);
    }
    return false;
  };

  const ensureOccurrenceForEdit = (eventId: string, date: string): string => {
    const existing = eventOccurrences.find(o => o.eventId === eventId && o.instanceDate === date);
    if (existing) return existing.id;
    const newId = crypto.randomUUID();
    setEventOccurrences(prev => [...prev, { id: newId, eventId, instanceDate: date, status: 'active' }]);
    const mP = programItems.filter(p => p.eventId === eventId && !p.occurrenceId);
    setProgramItems(prev => [...prev, ...mP.map(p => ({ ...p, id: crypto.randomUUID(), occurrenceId: newId }))]);
    const mA = assignments.filter(a => a.eventId === eventId && !a.occurrenceId);
    setAssignments(prev => [...prev, ...mA.map(a => ({ ...a, id: crypto.randomUUID(), occurrenceId: newId }))]);
    return newId;
  };

  const getEventDataForDate = (eventId: string, date?: string) => {
    const occ = date ? eventOccurrences.find(o => o.eventId === eventId && o.instanceDate === date) : null;
    const occId = occ?.id;
    
    const masterProgram = programItems.filter(p => p.eventId === eventId && !p.occurrenceId);
    const masterAssignments = assignments.filter(a => a.eventId === eventId && !a.occurrenceId);
    const masterTasks = tasks.filter(t => t.eventId === eventId && !t.occurrenceId);

    const program = occId ? programItems.filter(p => p.occurrenceId === occId) : masterProgram;
    const currentAssignments = occId ? assignments.filter(a => a.occurrenceId === occId) : masterAssignments;
    const tasks_ = occId ? tasks.filter(t => t.occurrenceId === occId) : masterTasks;
    
    return { occurrence: occ, program, assignments: currentAssignments, tasks: tasks_, masterProgram, masterAssignments, masterTasks };
  };

  return (
    <AppContext.Provider value={{
      people, groups, groupMembers, events, tasks, roleDefinitions, assignments, programItems, teamRoleMembers, eventOccurrences, activityLogs, auth,
      addEvent: (e) => setEvents(prev => [...prev, e]),
      updateEvent: (e) => setEvents(prev => prev.map(o => o.id === e.id ? e : o)),
      addGroup: (g) => setGroups(prev => [...prev, { ...g, id: crypto.randomUUID() }]),
      updateGroup: (g) => setGroups(prev => prev.map(o => o.id === g.id ? g : o)),
      deleteGroup: (id) => setGroups(prev => prev.filter(o => o.id !== id)),
      addGroupMember: (groupId, personId, role = 'member') => setGroupMembers(prev => [...prev, { id: crypto.randomUUID(), groupId, personId, membershipRole: role, active: true, joinedAt: Date.now() }]),
      removeGroupMember: (id) => setGroupMembers(prev => prev.filter(o => o.id !== id)),
      addRoleDefinition: (r) => setRoleDefinitions(prev => [...prev, r]),
      updateRoleDefinition: (r) => setRoleDefinitions(prev => prev.map(o => o.id === r.id ? r : o)),
      deleteRoleDefinition: (id) => setRoleDefinitions(prev => prev.filter(o => o.id !== id)),
      assignPersonToRole: (a, occId) => setAssignments(prev => [...prev, { ...a, id: crypto.randomUUID(), templateId: occId ? '' : 'temp', occurrenceId: occId }]),
      deleteAssignment: (id) => setAssignments(prev => prev.filter(a => a.id !== id)),
      addProgramItem: (item, occId) => {
        const id = crypto.randomUUID();
        const target = occId ? programItems.filter(p => p.occurrenceId === occId) : programItems.filter(p => p.eventId === item.eventId && !p.occurrenceId);
        setProgramItems(prev => [...prev, { ...item, id, templateId: occId ? '' : id, orderIndex: target.length, occurrenceId: occId }]);
      },
      updateProgramItem: (item) => setProgramItems(prev => prev.map(p => p.id === item.id ? item : p)),
      deleteProgramItem: (id) => setProgramItems(prev => prev.filter(p => p.id !== id)),
      reorderProgramItem: (eventId, oldIdx, newIdx, occId) => {
        const target = occId ? programItems.filter(p => p.occurrenceId === occId) : programItems.filter(p => p.eventId === eventId && !p.occurrenceId);
        const result = Array.from(target).sort((a,b) => a.orderIndex - b.orderIndex);
        const [removed] = result.splice(oldIdx, 1);
        result.splice(newIdx, 0, removed);
        const updated = result.map((item, index) => ({ ...item, orderIndex: index }));
        setProgramItems(prev => {
          const others = prev.filter(p => occId ? p.occurrenceId !== occId : (p.eventId !== eventId || !!p.occurrenceId));
          return [...others, ...updated];
        });
      },
      addTask: (t, occId) => {
        const id = crypto.randomUUID();
        setTasks(prev => [...prev, { ...t, id, templateId: occId ? '' : id, status: TaskStatus.TODO, history: [], occurrenceId: occId } as Task]);
      },
      updateTask: (t) => setTasks(prev => prev.map(o => o.id === t.id ? t : o)),
      deleteTask: (id) => setTasks(prev => prev.filter(o => o.id !== id)),
      updateTaskStatus: (id, s) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status: s } : t)),
      addPerson: (p) => setPeople(prev => [...prev, { ...p, id: crypto.randomUUID(), createdAt: Date.now() }]),
      updatePerson: (p) => setPeople(prev => prev.map(o => o.id === p.id ? p : o)),
      getMyTasks: (daysAhead) => {
        if (!currentPerson) return [];
        const limit = Date.now() + daysAhead * 24 * 60 * 60 * 1000;
        return tasks.filter(t => t.assignedToId === currentPerson.id && new Date(t.dueDate).getTime() <= limit);
      },
      applyTeamDefaultsToEvent: (eventId, groupId, config, occId) => {
        const roles = roleDefinitions.filter(rd => rd.groupId === groupId);
        roles.forEach(role => {
            const existing = assignments.find(a => a.eventId === eventId && a.roleId === role.id && (occId ? a.occurrenceId === occId : !a.occurrenceId));
            if (!existing || config.overwriteFilled) {
                const member = groupMembers.find(gm => gm.groupId === groupId && gm.membershipRole === 'member' && gm.active);
                if (member) {
                    assignPersonToRole({ eventId, groupId, roleId: role.id, personId: member.personId }, occId);
                }
            }
        });
      },
      resetToMaster: (eventId, date) => {
        const occ = eventOccurrences.find(o => o.eventId === eventId && o.instanceDate === date);
        if (occ) {
            setEventOccurrences(prev => prev.filter(o => o.id !== occ.id));
            setProgramItems(prev => prev.filter(p => p.occurrenceId !== occ.id));
            setAssignments(prev => prev.filter(a => a.occurrenceId !== occ.id));
            setTasks(prev => prev.filter(t => t.occurrenceId !== occ.id));
        }
      },
      ensureOccurrenceForEdit,
      getEventDataForDate,
      canEdit,
      canEditObject: canEdit
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};