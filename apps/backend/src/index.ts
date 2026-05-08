import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRouter from './routes/auth';
import locationRouter from './routes/location';
import { registerFamilySocket } from './sockets/family';

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/location', locationRouter);

registerFamilySocket(io);

const PORT = process.env.PORT ?? 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
