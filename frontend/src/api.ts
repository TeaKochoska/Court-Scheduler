import type { Slot, BookingInput } from './types';

const API_URL= import .meta.env.VITE_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
    status : number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res =await fetch(`${API_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    if (!res.ok) {
        const body=await res.json().catch(() => ({}));
        throw new ApiError(body?.error ?? 'Something went wrong', res.status);
    }

    if(res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

export interface SlotFilters {
  onlyAvailable?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export const api = {
    getSlots: (filters: SlotFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.onlyAvailable) params.set('onlyAvailable', 'true');
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    const qs = params.toString();
    return request<Slot[]>(`/slots${qs ? `?${qs}` : ''}`);
  },

    createSlot: (startTime: string, durationMinutes: number) => 
        request<Slot>('/slots', {
            method: 'POST',
            body: JSON.stringify({ startTime, durationMinutes }),
        }),

    bookSlot: (id: number, data: BookingInput) =>
        request<Slot>(`/slots/${id}/book`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    deleteSlot: (id: number) =>
        request<void>(`/slots/${id}`, {
            method: 'DELETE',
        }),
};