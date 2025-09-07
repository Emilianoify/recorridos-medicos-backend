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
import professionalRoutes from './routes/professional.routes';
import journeyRoutes from './routes/journey.routes';
import visitRoutes from './routes/visit.routes';
import frequencyRoutes from './routes/frequency.routes';
import holidayRoutes from './routes/holiday.routes';
import reportsRoutes from './routes/reports.routes';
import auditRoutes from './routes/audit.routes';
import zoneRoutes from './routes/zone.routes';
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
app.use('/professional', professionalRoutes);
app.use('/journey', journeyRoutes);
app.use('/visit', visitRoutes);
app.use('/frequency', frequencyRoutes);
app.use('/holiday', holidayRoutes);
app.use('/reports', reportsRoutes);
app.use('/audit', auditRoutes);
app.use('/zone', zoneRoutes);

app.use(handleJsonError);
app.use(handle404);
app.use(handleServerError);

export default app;
