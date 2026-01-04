
import { ProgramItem } from '../types';

export interface TimelineItem extends ProgramItem {
  displayStartTime: string;
  displayEndTime: string;
}

const minutesToHHmm = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const HHmmToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const calculateTimeline = (eventStartTimeHHmm: string, items: ProgramItem[]): TimelineItem[] => {
  const sortedItems = [...items].sort((a, b) => a.orderIndex - b.orderIndex);
  
  let currentStartTimeMinutes = HHmmToMinutes(eventStartTimeHHmm);
  
  return sortedItems.map((item) => {
    // Anchor logic: If manual start time is set, jump to it
    if (item.manualStartTime) {
      currentStartTimeMinutes = HHmmToMinutes(item.manualStartTime);
    }
    
    const startTime = currentStartTimeMinutes;
    const endTime = currentStartTimeMinutes + item.durationMinutes;
    
    // Preparation for next item
    currentStartTimeMinutes = endTime;
    
    return {
      ...item,
      displayStartTime: minutesToHHmm(startTime),
      displayEndTime: minutesToHHmm(endTime),
    };
  });
};
