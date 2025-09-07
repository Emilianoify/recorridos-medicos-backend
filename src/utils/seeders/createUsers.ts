import { UserModel, RoleModel } from '../../models';
import bcrypt from 'bcrypt';
import { UserState } from '../../enums/UserState';
import { IRole } from '../../interfaces/role.interface';

const createDefaultUsers = async (): Promise<void> => {
  try {
    console.log('👤 Creando usuarios por defecto...');

    // Buscar roles existentes
    const adminRoleResult = await RoleModel.findOne({ 
      where: { name: 'Administrador' }
    });
    const adminRole = adminRoleResult?.toJSON() as IRole | null;
    
    const coordinatorRoleResult = await RoleModel.findOne({ 
      where: { name: 'Coordinador' }
    });
    const coordinatorRole = coordinatorRoleResult?.toJSON() as IRole | null;
    
    const operatorRoleResult = await RoleModel.findOne({ 
      where: { name: 'Operador' }
    });
    const operatorRole = operatorRoleResult?.toJSON() as IRole | null;

    if (!adminRole || !coordinatorRole || !operatorRole) {
      console.log('⚠️  Roles no encontrados. Ejecuta primero createRole');
      return;
    }

    const defaultUsers = [
      {
        firstName: 'Super',
        lastName: 'Administrador',
        username: 'admin',
        email: 'admin@recorridos.com',
        password: await bcrypt.hash('Admin123!', 10),
        roleId: adminRole!.id,
        state: UserState.ACTIVE,
        isActive: true,
      },
      {
        firstName: 'María',
        lastName: 'Coordinadora',
        username: 'mcoord',
        email: 'coordinador@recorridos.com',
        password: await bcrypt.hash('Coord123!', 10),
        roleId: coordinatorRole!.id,
        state: UserState.ACTIVE,
        isActive: true,
      },
      {
        firstName: 'Juan',
        lastName: 'Operador',
        username: 'joper',
        email: 'operador@recorridos.com',
        password: await bcrypt.hash('Oper123!', 10),
        roleId: operatorRole!.id,
        state: UserState.ACTIVE,
        isActive: true,
      },
      {
        firstName: 'Ana',
        lastName: 'Supervisora',
        username: 'asuper',
        email: 'supervisor@recorridos.com',
        password: await bcrypt.hash('Super123!', 10),
        roleId: coordinatorRole!.id,
        state: UserState.ACTIVE,
        isActive: true,
      },
    ];

    for (const userData of defaultUsers) {
      const existingUser = await UserModel.findOne({
        where: { username: userData.username },
      });

      if (!existingUser) {
        await UserModel.create(userData);
        console.log(`✅ Usuario "${userData.username}" creado correctamente`);
      } else {
        console.log(`ℹ️  Usuario "${userData.username}" ya existe, omitiendo...`);
      }
    }

    console.log('✅ Proceso de creación de usuarios completado');
  } catch (error) {
    console.error('❌ Error al crear usuarios por defecto:', error);
    throw error;
  }
};

export default createDefaultUsers;