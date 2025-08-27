import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { ERROR_MESSAGES } from '@/constants/messages/error.messages';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true, // Ajustar en producción
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: ERROR_MESSAGES.ROUTING.NOT_FOUND });
});

export default app;
