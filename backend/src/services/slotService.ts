import {pool} from '../db.js';

export const BOOKING_TYPES = ['training','match','casual'] as const ;
export type BookingType = typeof BOOKING_TYPES[number];

interface Slot {
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
}

const COLUMNS = `
    id,
    start_time AS "startTime",
    end_time AS "endTime",
    duration_minutes AS "durationMinutes",
    is_booked AS "isBooked",
    team_name AS "teamName",
    booking_type AS "bookingType",
    players_count AS "playersCount",
    contact_name AS "contactName",
    contact_email AS "contactEmail",
    created_at AS "createdAt"
`;

export const SlotService = {
    async getAllSlots(onlyAvailable: boolean, dateFrom?: string,dateTo?:string){
        let query = `SELECT ${COLUMNS} FROM slots WHERE 1=1`;
        const params: any[] = [];
        let paramIndex = 1;

        if(onlyAvailable){
            query += ` AND is_booked = false AND start_time > now()`;
        }

        if(dateFrom){
            query += ` AND start_time >= $${paramIndex}::timestamptz`;
            params.push(dateFrom);
            paramIndex++;
        }

        if (dateTo){
            query += ` AND start_time <= $${paramIndex}::timestamptz`;
            params.push(dateTo);
            paramIndex++;
        }

        query += ' ORDER BY start_time ASC';

        const {rows} = await pool.query<Slot>(query, params);
        return rows;
    },

    async createSlot(startTime: string, durationMinutes: number){
        const {rows} = await pool.query<Slot>(
            `INSERT INTO slots (start_time, duration_minutes, end_time)
            VALUES ($1::timestamptz, $2::int, $1::timestamptz + ($2::int * interval '1 minute'))
            RETURNING ${COLUMNS}`,
            [startTime, durationMinutes]
        );
        return rows[0];
    },

    async bookSlot( id:string,data: {
        teamName: string;
        bookingType: BookingType;
        playersCount: number;
        contactName: string;
        contactEmail: string;
    }) {
        const {rows} = await pool.query<Slot>(
            `UPDATE slots
            SET is_booked = true,
                team_name = $2,
                booking_type = $3,
                players_count = $4,
                contact_name = $5,
                contact_email = $6
            WHERE id = $1 AND is_booked = false AND start_time > now()
            RETURNING ${COLUMNS}`,
            [
            id,
            data.teamName.trim(),
            data.bookingType,
            data.playersCount,
            data.contactName.trim(),
            data.contactEmail.trim(),
            ]
        );
        return rows[0] || null;
    },

    async deleteSlot(id: string) {
        const {rows} = await pool.query(
            `DELETE FROM slots WHERE id = $1 AND is_booked = false RETURNING id`,
            [id]
        );
        return rows.length>0;
}       
};