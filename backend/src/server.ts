import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.emit('message', 'System Monitor Online');
});

httpServer.listen(3000, () => console.log('Backend & Sockets active on 3000'));
