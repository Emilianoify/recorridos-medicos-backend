import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.routes';
import roleRoutes from './routes/role.routes';
import specialtyRoutes from './routes/specialty.routes';
import healthcareProviderRoutes from './routes/healthcare.routes';
import userRoutes from './routes/user.routes';
import patientRoutes from './routes/patient.routes';
import {
  handleJsonError,
  handle404,
  handleServerError,
} from './middlewares/errorHandlers';

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
app.use(
  express.json({
    limit: '10mb',
  })
);
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/role', roleRoutes);
app.use('/specialty', specialtyRoutes);
app.use('/healthcare-provider', healthcareProviderRoutes);
app.use('/user', userRoutes);
app.use('/patient', patientRoutes);

app.use(handleJsonError);
app.use(handle404);
app.use(handleServerError);

export default app;
