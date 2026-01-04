
import { Event, RecurrenceType } from '../types';

export const formatToISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseISODate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export interface CalendarInstance {
  eventId: string;
  instanceDate: string; // YYYY-MM-DD
  title: string;
  startTime: string;   // HH:mm
  teamIds: string[];
}

export const generateCalendarInstances = (
  events: Event[],
  startDate: Date,
  endDate: Date
): CalendarInstance[] => {
  const instances: CalendarInstance[] = [];
  const startLimit = startDate.getTime();
  const endLimit = endDate.getTime();

  events.forEach((event) => {
    const eventStartDate = new Date(event.startTime);
    const startTimeStr = eventStartDate.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });

    const createInstance = (d: Date) => {
      instances.push({
        eventId: event.id,
        instanceDate: formatToISODate(d),
        title: event.name,
        startTime: startTimeStr,
        teamIds: event.groupIds,
      });
    };

    if (event.recurrence === RecurrenceType.NONE) {
      if (eventStartDate >= startDate && eventStartDate <= endDate) {
        createInstance(eventStartDate);
      }
    } else if (
      event.recurrence === RecurrenceType.WEEKLY ||
      event.recurrence === RecurrenceType.BI_WEEKLY ||
      event.recurrence === RecurrenceType.TRI_WEEKLY ||
      event.recurrence === RecurrenceType.QUAD_WEEKLY
    ) {
      let intervalWeeks = 1;
      if (event.recurrence === RecurrenceType.BI_WEEKLY) intervalWeeks = 2;
      if (event.recurrence === RecurrenceType.TRI_WEEKLY) intervalWeeks = 3;
      if (event.recurrence === RecurrenceType.QUAD_WEEKLY) intervalWeeks = 4;

      let current = new Date(eventStartDate);
      while (current.getTime() <= endLimit) {
        if (current.getTime() >= startLimit) {
          createInstance(current);
        }
        current.setDate(current.getDate() + 7 * intervalWeeks);
      }
    } else if (event.recurrence === RecurrenceType.MONTHLY) {
      // Logic: First [Weekday] of the month
      const weekday = eventStartDate.getDay();
      let currentMonthDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      
      while (currentMonthDate.getTime() <= endLimit) {
        // Find the first occurrence of 'weekday' in the current month iteration
        for (let d = 1; d <= 7; d++) {
          const checkDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), d);
          if (checkDate.getDay() === weekday) {
            if (checkDate.getTime() >= startLimit && checkDate.getTime() <= endLimit && checkDate.getTime() >= eventStartDate.getTime()) {
              createInstance(checkDate);
            }
            break;
          }
        }
        currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
      }
    }
  });

  return instances.sort((a, b) => {
    if (a.instanceDate !== b.instanceDate) return a.instanceDate.localeCompare(b.instanceDate);
    return a.startTime.localeCompare(b.startTime);
  });
};

export const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
  return new Date(d.setDate(diff));
};

export const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000);
};