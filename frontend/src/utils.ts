import type { Slot } from './types';

export const dayKey = (iso: string) => {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

export const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });


export function groupByDay(slots: Slot[]): [string, Slot[]][] {
  const map = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = dayKey(slot.startTime);
    map.set(key, [...(map.get(key) ?? []), slot]);
  }
  return Array.from(map.entries());
}