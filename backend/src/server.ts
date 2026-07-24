import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
const httpServer = createServer(app);
const io = new Server(httpServer);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('message', 'System Monitor Online');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', backend: 'app-making-book-backend' });
});

app.post('/logs', async (req, res) => {
  try {
    const { message, userId } = req.body;

    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({ data: { id: userId, name: `user-${userId}` } });
    }

    const log = await prisma.log.create({
      data: { message, userId },
    });

    res.json({ id: log.id, message: log.message, userId: log.userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create log' });
  }
});

httpServer.listen(3000, () => console.log('Backend & Sockets active on 3000'));
