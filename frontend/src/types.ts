export const BOOKING_TYPES = ['training','match','casual'] as const ;
export type BookingType = typeof BOOKING_TYPES[number];

export const BOOKING_LABELS: Record<BookingType, string> = {
    training: 'Training',
    match: 'Match',
    casual: 'Casual',
};

export interface Slot {
    id: number;
    startTime: string; 
    endTime: string;
    durationMinutes: number;
    isBooked: boolean;
    teamName: string | null;
    bookingType: BookingType | null;
    playersCount: number | null;
    contactName: string | null;
    contactEmail: string | null;
    createdAt: string;
    confirmationMessage?: string;
}

export interface BookingInput {
    teamName: string;
    bookingType: BookingType;
    playersCount: number;
    contactName: string;
    contactEmail: string;
}
