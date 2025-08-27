import app from '@/app';
import sequelize, { dbConnection } from '@/config/db';
import '@/models/index';
import { ERROR_MESSAGES } from '@/constants/messages/error.messages';
import createDefaultRoles from '@/utils/seeders/createRole';

const PORT = process.env.PORT || 3000;

const initializeDatabase = async (): Promise<void> => {
  try {
    await dbConnection();

    await sequelize.sync({ alter: true });

    await createDefaultRoles();

    console.log(SUCCESS_MESSAGES.DB.DB_UP);
  } catch (error) {
    console.error(ERROR_MESSAGES.DB.DB_CONNECTION, error);
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
