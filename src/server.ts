import app from './app';
import sequelize, { dbConnection } from './config/db';
import './models/index';
import { ERROR_MESSAGES } from './constants/messages/error.messages';

import createDefaultRoles from './utils/seeders/createRole';
import { SUCCESS_MESSAGES } from './constants/messages/success.messages';
import createDefaultSpecialties from './utils/seeders/createSpecialty';
import createDefaultHealthcareProviders from './utils/seeders/createHealthcareProvider';
import createDefaultFrequencies from './utils/seeders/createFrequency';
import createAllAuxiliaryTables from './utils/seeders/createAuxiliaryTables';
import createDefaultHolidays from './utils/seeders/createDefaultHolidays';
import createDefaultUsers from './utils/seeders/createUsers';
import createDefaultZones from './utils/seeders/createZones';
import createDefaultProfessionals from './utils/seeders/createProfessionals';
import createDefaultPatients from './utils/seeders/createPatients';

const PORT = process.env.PORT || 3000;

const initializeDatabase = async (): Promise<void> => {
  try {
    await dbConnection();

    await sequelize.sync({ alter: true });
    await createDefaultRoles();
    await createDefaultSpecialties();
    await createDefaultFrequencies();
    await createDefaultHealthcareProviders();
    await createAllAuxiliaryTables();
    await createDefaultHolidays();
    await createDefaultUsers();
    await createDefaultZones();
    await createDefaultProfessionals();
    await createDefaultPatients();
    console.log(SUCCESS_MESSAGES.DB.DB_UP);
  } catch (error) {
    console.error(ERROR_MESSAGES.DB.CONNECTION, error);
    throw error;
  }
};

const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`${SUCCESS_MESSAGES.SERVER.STARTUP} ${PORT}`);
    });
  } catch (error) {
    console.error(ERROR_MESSAGES.SERVER.STARTUP, error);
    process.exit(1);
  }
};

startServer();
