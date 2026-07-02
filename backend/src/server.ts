import express from 'express';
import { requestLogger } from './middleware/logger';
import userRoutes from './routes/userRoutes';

const app = express();
app.use(express.json());
app.use(requestLogger);

app.use('/api/users', userRoutes);

app.listen(3000, () => console.log('Backend active on port 3000'));
