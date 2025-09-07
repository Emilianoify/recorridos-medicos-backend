import { ZoneModel } from '../../models';

const createDefaultZones = async (): Promise<void> => {
  try {
    console.log('🗺️  Creando zonas por defecto...');

    const defaultZones = [
      {
        name: 'Centro',
        description: 'Zona centro de la ciudad con alta densidad poblacional',
        coordinates: [
          [-34.6037, -58.3816], // Plaza de Mayo
          [-34.6020, -58.3700], // Puerto Madero
          [-34.5950, -58.3720], // Retiro
          [-34.5970, -58.3850], // Plaza San Martín
          [-34.6037, -58.3816], // Cerrar polígono
        ],
        isActive: true,
      },
      {
        name: 'Zona Norte',
        description: 'Barrios del norte: Palermo, Belgrano, Núñez',
        coordinates: [
          [-34.5800, -58.4200], // Palermo
          [-34.5600, -58.4000], // Belgrano
          [-34.5400, -58.4100], // Núñez
          [-34.5500, -58.4300], // Villa Urquiza
          [-34.5800, -58.4200], // Cerrar polígono
        ],
        isActive: true,
      },
      {
        name: 'Zona Oeste',
        description: 'Barrios del oeste: Caballito, Flores, Mataderos',
        coordinates: [
          [-34.6100, -58.4400], // Caballito
          [-34.6300, -58.4600], // Flores
          [-34.6500, -58.5000], // Mataderos
          [-34.6200, -58.5200], // Liniers
          [-34.6100, -58.4400], // Cerrar polígono
        ],
        isActive: true,
      },
      {
        name: 'Zona Sur',
        description: 'Barrios del sur: San Telmo, La Boca, Barracas',
        coordinates: [
          [-34.6200, -58.3700], // San Telmo
          [-34.6350, -58.3600], // La Boca
          [-34.6450, -58.3800], // Barracas
          [-34.6300, -58.3900], // Constitución
          [-34.6200, -58.3700], // Cerrar polígono
        ],
        isActive: true,
      },
      {
        name: 'Gran Buenos Aires Norte',
        description: 'Zona GBA Norte: Vicente López, San Isidro, Tigre',
        coordinates: [
          [-34.5200, -58.4800], // Vicente López
          [-34.4700, -58.5200], // San Isidro
          [-34.4200, -58.5800], // Tigre
          [-34.4500, -58.6200], // Escobar
          [-34.5200, -58.4800], // Cerrar polígono
        ],
        isActive: true,
      },
      {
        name: 'Gran Buenos Aires Sur',
        description: 'Zona GBA Sur: Avellaneda, Quilmes, Berazategui',
        coordinates: [
          [-34.6600, -58.3600], // Avellaneda
          [-34.7200, -58.2800], // Quilmes
          [-34.7600, -58.2200], // Berazategui
          [-34.7000, -58.3000], // Florencio Varela
          [-34.6600, -58.3600], // Cerrar polígono
        ],
        isActive: true,
      },
    ];

    for (const zoneData of defaultZones) {
      const existingZone = await ZoneModel.findOne({
        where: { name: zoneData.name },
      });

      if (!existingZone) {
        await ZoneModel.create(zoneData);
        console.log(`✅ Zona "${zoneData.name}" creada correctamente`);
      } else {
        console.log(`ℹ️  Zona "${zoneData.name}" ya existe, omitiendo...`);
      }
    }

    console.log('✅ Proceso de creación de zonas completado');
  } catch (error) {
    console.error('❌ Error al crear zonas por defecto:', error);
    throw error;
  }
};

export default createDefaultZones;