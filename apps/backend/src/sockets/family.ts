import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../lib/jwt';

export function registerFamilySocket(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Client sends their JWT to join their family room
    socket.on('join:family', (token: string) => {
      try {
        const payload = verifyAccessToken(token);
        if (payload.familyId) {
          socket.join(`family:${payload.familyId}`);
          socket.data.userId = payload.userId;
          socket.data.familyId = payload.familyId;
          socket.emit('joined:family', { familyId: payload.familyId });
          console.log(`User ${payload.userId} joined family room: ${payload.familyId}`);
        }
      } catch {
        socket.emit('error', { message: 'Invalid token' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
