import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { io } from '../server'; // Import the io instance

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
    const { message, userId } = req.body;
    const newLog = await prisma.log.create({
        data: { message, userId }
    });
    
    // Broadcast the new log to all connected clients
    io.emit('security_alert', newLog);
    
    res.json(newLog);
});

export default router;
