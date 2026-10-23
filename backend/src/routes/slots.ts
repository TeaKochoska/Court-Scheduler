import { Router, Request, Response } from 'express';
import { SlotService, BOOKING_TYPES, BookingType } from '../services/slotService.js';

const router = Router();

const isValidId = (value:string) => /^\d+$/.test(value);
const isValidEmail=(value:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

//GET /
router.get('/', async (req:Request, res:Response) => {
    try{
        const onlyAvailable = req.query.onlyAvailable === 'true';
        const dateFrom = req.query.dateFrom as string | undefined;
        const dateTo = req.query.dateTo as string | undefined;

        const slots = await SlotService.getAllSlots(onlyAvailable, dateFrom, dateTo);
        res.json(slots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//POST /slots
router.post('/', async (req:Request, res:Response) => {
    const {startTime, durationMinutes} = req.body as  {
        startTime: string;
        durationMinutes: number;
    };

    if(!startTime || isNaN(Date.parse(startTime))){
        res.status(400).json({error: 'Valid startTime is required'});
        return;
    }

    if(new Date(startTime).getTime() <= Date.now()){
        res.status(400).json({error: 'startTime must be in the future'});
        return;
    }

    if(!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 480){
        res.status(400).json({error: 'durationMinutes must be an integer between 15 and 480'});
        return;
    }

    try{
        const newSlot = await SlotService.createSlot(startTime, durationMinutes);
        res.status(201).json(newSlot);
    }catch(err:any){
        if(err.code === '23P01'){
            res.status(409).json({error: 'Slot overlaps with an existing slot'});
            return;
        }
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

//POST /slots/:id/book
router.post('/:id/book',async (req:Request, res:Response) => {
    const id = String(req.params.id);

    if(!isValidId(id)){
        res.status(400).json({error: 'Invalid slot ID'});
        return;
    }

    const {teamName, bookingType, playersCount, contactName, contactEmail} = req.body

    if(!teamName?.trim()){
        res.status(400).json({error: 'Team or club name is required'});
        return;
    }

    if(!bookingType || !BOOKING_TYPES.includes(bookingType as BookingType)){
        res.status(400).json({error: 'bookingType must be training, match or casual'});
        return;
    }

    if(!Number.isInteger(playersCount) || playersCount < 1 || playersCount >60){
        res.status(400).json({error: 'players must be between 1 and 60'});
        return;
    }

    if(!contactName?.trim()){
        res.status(400).json({error: 'Contact name is required'});
        return;
    }

    if(!contactEmail || !isValidEmail(contactEmail.trim())){
        res.status(400).json({error: 'A valid contact email is required'});
        return;
    }

    try{
        const updatedSlot = await SlotService.bookSlot(id, {
            teamName,
            bookingType,
            playersCount,
            contactName,
            contactEmail
        });

        if(!updatedSlot){
            res.status(409).json({error: 'Slot not found or already booked'});
            return;
        }

        res.json(updatedSlot);
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

//PATCH /slots/:id/cancel
router.patch('/:id/cancel', async (req:Request, res:Response) => {
    const id = String(req.params.id);

    if(!isValidId(id)){
        res.status(400).json({error: 'Invalid slot ID'});
        return;
    }

    try{
        const slot = await SlotService.cancelBooking(id);
        if(!slot){
            res.status(404).json({error: 'Active booking not found or slot already started'});
            return;
        }
        res.json(slot);
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

//DELETE /slots/:id
router.delete('/:id', async (req:Request, res:Response) => {
    const id = String(req.params.id);

    if(!isValidId(id)){
        res.status(400).json({error: 'Invalid slot ID'});
        return;
    }

    try{
        const deleted=await SlotService.deleteSlot(id);
        if(!deleted){
            res.status(409).json({error: 'Slot not found or already booked'});
            return;
        }
        res.status(204).send();
    }catch(err){
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


export default router;