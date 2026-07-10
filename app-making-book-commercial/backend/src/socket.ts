import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

/**
 * Single shared Socket.io instance for the whole backend.
 *
 * server.ts creates the instance once (via initSocket) when the HTTP
 * server boots. Route/controller files that need to emit events (like
 * logRoutes.ts) import getIO() instead of importing `server.ts`
 * directly — that was the previous circular-import bug
 * (logRoutes.ts -> server.ts -> logRoutes.ts).
 */
let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_ORIGIN ?? '*',
        },
    });

    io.on('connection', (socket) => {
        console.log(`[socket] client connected: ${socket.id}`);
        socket.emit('message', 'System Monitor Online');

        socket.on('disconnect', () => {
            console.log(`[socket] client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error('Socket.io was used before initSocket() was called. Check server.ts startup order.');
    }
    return io;
};
