
// Fixed: Using Group and GroupMember from types.ts
import { Role, Person, Group, Event, EventStatus, RecurrenceType, Task, TaskStatus, RoleDefinition, Assignment, GroupMember, ProgramItem, TeamRoleMember } from './types';

const now = Date.now();

export const people: Person[] = [
  { id: 'u1', fullName: 'Erik Johansen', email: 'erik@eventmaster.no', phone: '99887766', roles: [Role.ADMIN], active: true, createdAt: now },
  { id: 'u2', fullName: 'Sara Nilsen', email: 'sara@eventmaster.no', phone: '44556677', roles: [Role.TEAM_LEADER], active: true, createdAt: now },
  { id: 'u3', fullName: 'Morten Berg', email: 'morten@eventmaster.no', phone: '11223344', roles: [Role.TEAM_MEMBER], active: true, createdAt: now },
  { id: 'u4', fullName: 'Linda Vang', email: 'linda@eventmaster.no', phone: '55443322', roles: [Role.TEAM_MEMBER], active: true, createdAt: now },
  { id: 'u5', fullName: 'Olav Nordmann', email: 'olav@eventmaster.no', roles: [Role.TEAM_MEMBER], active: false, createdAt: now },
];

export const currentUser = people[0];

export const groupMembers: GroupMember[] = [
  { id: 'tm1', groupId: 't1', personId: 'u1', membershipRole: 'member', active: true, joinedAt: now },
  { id: 'tm2', groupId: 't1', personId: 'u2', membershipRole: 'leader', active: true, joinedAt: now },
  { id: 'tm3', groupId: 't1', personId: 'u3', membershipRole: 'member', active: true, joinedAt: now },
  { id: 'tm4', groupId: 't2', personId: 'u4', membershipRole: 'leader', active: true, joinedAt: now },
];

export const groups: Group[] = [
  { id: 't1', name: 'Logistikk-team', category: 'service', description: 'Ansvarlig for rigging og teknisk utstyr.', active: true },
  { id: 't2', name: 'Vertskap', category: 'service', description: 'Velkomst og servering.', active: true },
];

// Fixed: Using groupId instead of teamId
export const roleDefinitions: RoleDefinition[] = [
  { id: 'rd1', name: 'Lydtekniker', description: 'Ansvarlig for miksepult og PA-anlegg.', groupId: 't1' },
  { id: 'rd2', name: 'Rigger', description: 'Ansvarlig for opp- og nedrigging av scene.', groupId: 't1' },
  { id: 'rd3', name: 'Kjøkkensjef', description: 'Koordinerer matlaging og servering.', groupId: 't2' },
  { id: 'rd4', name: 'Velkomstvert', description: 'Tar imot gjester i døra.', groupId: 't2' },
];

export const teamRoleMembers: TeamRoleMember[] = [
  { id: 'trm1', groupId: 't1', roleId: 'rd1', personId: 'u3', active: true, createdAt: now },
];

// Added templateId to match ID for master records. Fixed: Using groupId instead of teamId
export const assignments: Assignment[] = [
  { id: 'a1', templateId: 'a1', personId: 'u3', roleId: 'rd1', eventId: 'e1', groupId: 't1' },
  { id: 'a2', templateId: 'a2', personId: 'u4', roleId: 'rd4', eventId: 'e1', groupId: 't2' },
  { id: 'a3', templateId: 'a3', legacyPersonName: 'Gammel Bruker', roleId: 'rd2', eventId: 'e1', groupId: 't1' },
];

// Added templateId to match ID for master records. Fixed: responsibleType 'group' instead of 'team'
export const programItems: ProgramItem[] = [
  {
    id: 'pi1',
    templateId: 'pi1',
    eventId: 'e1',
    title: 'Intro og Velkomst',
    description: 'En kort introduksjon til dagens program.',
    durationMinutes: 15,
    orderIndex: 0,
    responsibleType: 'person',
    responsibleId: 'u2'
  },
  {
    id: 'pi2',
    templateId: 'pi2',
    eventId: 'e1',
    title: 'Hovedøkt: Planlegging',
    description: 'Vi går gjennom helgens store festival.',
    durationMinutes: 60,
    orderIndex: 1,
    responsibleType: 'assignment',
    responsibleId: 'a1'
  },
  {
    id: 'pi3',
    templateId: 'pi3',
    eventId: 'e1',
    title: 'Pizza og Sosialt',
    durationMinutes: 30,
    orderIndex: 2,
    manualStartTime: '19:30',
    responsibleType: 'group',
    responsibleId: 't2'
  }
];

// Removed non-existent program property. Fixed: Using groupIds instead of teamIds
export const events: Event[] = [
  {
    id: 'e1',
    name: 'Tirsdagsmøte Frivillige',
    description: 'Ukentlig koordinering av frivillige innsatser.',
    location: 'Sentrum Kulturhus',
    startTime: '2024-06-11T18:00:00Z',
    endTime: '2024-06-11T20:00:00Z',
    recurrence: RecurrenceType.WEEKLY,
    status: EventStatus.PLANNED,
    groupIds: ['t1', 't2']
  },
  {
    id: 'e2',
    name: 'Sommerfestival 2024',
    description: 'Årets store begivenhet for hele byen.',
    location: 'Rådhusplassen',
    startTime: '2024-07-20T10:00:00Z',
    endTime: '2024-07-21T22:00:00Z',
    recurrence: RecurrenceType.NONE,
    status: EventStatus.PLANNED,
    groupIds: ['t1', 't2']
  },
];

// Added templateId to match ID for master records
export const tasks: Task[] = [
  {
    id: 'tk1',
    templateId: 'tk1',
    title: 'Hente nøkler',
    description: 'Nøkler må hentes hos vaktselskapet før kl 16:00',
    eventId: 'e1',
    assignedToId: 'u3',
    dueDate: '2024-06-11T16:00:00Z',
    status: TaskStatus.TODO,
    history: [{ timestamp: Date.now(), userId: 'u1', action: 'Created task' }]
  },
];