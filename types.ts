
export enum Role {
  ADMIN = 'ADMIN',
  TEAM_LEADER = 'TEAM_LEADER',
  TEAM_MEMBER = 'TEAM_MEMBER',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum EventStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum RecurrenceType {
  NONE = 'NONE',
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  TRI_WEEKLY = 'TRI_WEEKLY',
  QUAD_WEEKLY = 'QUAD_WEEKLY',
  MONTHLY = 'MONTHLY',
}

export type GroupCategory = 'service' | 'fellowship' | 'leadership' | 'strategy';

export interface Person {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  roles: Role[];
  active: boolean;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  category: GroupCategory;
  description: string;
  active: boolean;
}

export interface GroupMember {
  id: string;
  groupId: string;
  personId: string;
  membershipRole: 'member' | 'leader';
  active: boolean;
  joinedAt: number;
}

export interface RoleTask {
  id: string;
  title: string;
  deadline?: string;
  channel?: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  groupId: string; // Endret fra teamId
  tasks?: RoleTask[];
}

export interface TeamRoleMember {
  id: string;
  groupId: string; // Endret fra teamId
  roleId: string;
  personId: string;
  active: boolean;
  createdAt: number;
}

export interface EventOccurrence {
  id: string;
  eventId: string;
  instanceDate: string; // YYYY-MM-DD
  title?: string;
  description?: string;
  status: 'active' | 'cancelled';
}

export interface Assignment {
  id: string;
  templateId: string;
  personId?: string;
  legacyPersonName?: string;
  roleId?: string; 
  eventId: string;
  groupId: string; // Endret fra teamId
  occurrenceId?: string; 
  deletedInMaster?: boolean;
}

export type ResponsibleType = 'person' | 'role' | 'group' | 'assignment' | 'none';

export interface ProgramItem {
  id: string;
  templateId: string;
  eventId: string;
  title: string;
  description?: string;
  actions?: string; 
  durationMinutes: number;
  orderIndex: number;
  manualStartTime?: string; // HH:mm
  responsibleType: ResponsibleType;
  responsibleId?: string;
  occurrenceId?: string;
  deletedInMaster?: boolean;
}

export interface Task {
  id: string;
  templateId: string;
  title: string;
  description: string;
  eventId: string;
  occurrenceDate?: string;
  assignedToId: string; // Can be personId or groupId
  dueDate: string;
  status: TaskStatus;
  history: {
    timestamp: number;
    userId: string;
    action: string;
  }[];
  occurrenceId?: string;
  deletedInMaster?: boolean;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  startTime: string; 
  endTime: string;   
  recurrence: RecurrenceType;
  status: EventStatus;
  groupIds: string[]; // Endret fra teamIds
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  personId: string;
  eventId: string;
  occurrenceId?: string;
  actionType: 'create' | 'edit' | 'delete';
  entityType: 'assignment' | 'programItem' | 'task' | 'event';
  entityId: string;
  description: string;
}
