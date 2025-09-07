import { IVisit } from '../interfaces/visit.interface';

export interface ICoordinate {
  lat: number;
  lng: number;
  address?: string;
}

export interface IRouteWaypoint {
  visitId: string;
  patientId: string;
  patientName: string;
  address: string;
  coordinates: ICoordinate;
  scheduledTime: Date;
  estimatedDuration: number; // minutos
  orderInRoute: number;
  isOptimized?: boolean;
}

export interface IRouteSegment {
  from: IRouteWaypoint;
  to: IRouteWaypoint;
  distance: number; // metros
  duration: number; // minutos
  travelMode: 'DRIVING' | 'WALKING' | 'TRANSIT';
  encodedPath?: string; // Para mostrar en mapas
  instructions?: string[];
}

export interface IOptimizedRoute {
  journeyId: string;
  waypoints: IRouteWaypoint[];
  segments: IRouteSegment[];
  totalDistance: number; // metros
  totalDuration: number; // minutos
  totalTravelTime: number; // minutos (sin contar visitas)
  estimatedStartTime: Date;
  estimatedEndTime: Date;
  optimizationScore: number; // 0-100
  optimizationMethod: 'BASIC' | 'TIME_WINDOWS' | 'GENETIC_ALGORITHM' | 'SIMULATED_ANNEALING';
  metadata?: any;
}

export interface IRouteOptimizationOptions {
  startLocation?: ICoordinate; // Ubicaci�n de inicio del profesional
  endLocation?: ICoordinate; // Ubicaci�n de fin (opcional)
  respectTimeWindows?: boolean; // Respetar horarios espec�ficos de visitas
  maxRouteDistance?: number; // Distancia m�xima en metros
  maxRouteDuration?: number; // Duraci�n m�xima en minutos
  preferredStartTime?: Date;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  travelMode?: 'DRIVING' | 'WALKING' | 'TRANSIT';
  optimizationLevel?: 'FAST' | 'BALANCED' | 'OPTIMAL';
}

export interface IDistanceMatrix {
  origins: ICoordinate[];
  destinations: ICoordinate[];
  distances: number[][]; // matriz de distancias en metros
  durations: number[][]; // matriz de duraciones en minutos
  status: 'OK' | 'ERROR';
  error?: string;
}

export interface IRouteValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export class RoutingService {
  // Configuraciones por defecto
  private static readonly DEFAULT_VISIT_DURATION = 30; // minutos
  private static readonly MAX_WAYPOINTS = 25; // L�mite de Google Maps
  private static readonly SPEED_KMH = 40; // Velocidad promedio en zona urbana

  /**
   * Optimizar ruta para un conjunto de visitas
   */
  static async optimizeRoute(
    visits: IVisit[],
    options: IRouteOptimizationOptions = {}
  ): Promise<IOptimizedRoute> {
    if (visits.length === 0) {
      throw new Error('No se proporcionaron visitas para optimizar');
    }

    if (visits.length > this.MAX_WAYPOINTS) {
      throw new Error(`Demasiadas visitas (${visits.length}). M�ximo: ${this.MAX_WAYPOINTS}`);
    }

    // Configurar opciones por defecto
    const defaultOptions: IRouteOptimizationOptions = {
      respectTimeWindows: true,
      travelMode: 'DRIVING',
      optimizationLevel: 'BALANCED',
      avoidTolls: false,
      avoidHighways: false,
      ...options,
    };

    // Convertir visitas a waypoints
    const waypoints = await this.convertVisitsToWaypoints(visits);

    // Elegir m�todo de optimizaci�n seg�n el n�mero de visitas
    let optimizedWaypoints: IRouteWaypoint[];
    let optimizationMethod: IOptimizedRoute['optimizationMethod'];

    if (visits.length <= 5) {
      // Fuerza bruta para pocos puntos
      optimizedWaypoints = await this.optimizeByBruteForce(waypoints, defaultOptions);
      optimizationMethod = 'BASIC';
    } else if (visits.length <= 12) {
      // Ventanas de tiempo para casos medianos
      optimizedWaypoints = await this.optimizeByTimeWindows(waypoints, defaultOptions);
      optimizationMethod = 'TIME_WINDOWS';
    } else {
      // Algoritmo gen�tico para casos complejos
      optimizedWaypoints = await this.optimizeByGeneticAlgorithm(waypoints, defaultOptions);
      optimizationMethod = 'GENETIC_ALGORITHM';
    }

    // Calcular segmentos de la ruta
    const segments = await this.calculateRouteSegments(optimizedWaypoints, defaultOptions);

    // Calcular m�tricas totales
    const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
    const totalTravelTime = segments.reduce((sum, seg) => sum + seg.duration, 0);
    const totalVisitTime = optimizedWaypoints.reduce((sum, wp) => sum + wp.estimatedDuration, 0);
    const totalDuration = totalTravelTime + totalVisitTime;

    // Calcular horarios estimados
    const estimatedStartTime = defaultOptions.preferredStartTime || new Date();
    const estimatedEndTime = new Date(estimatedStartTime);
    estimatedEndTime.setMinutes(estimatedEndTime.getMinutes() + totalDuration);

    // Calcular score de optimizaci�n
    const optimizationScore = this.calculateOptimizationScore(
      visits.length,
      totalDistance,
      totalDuration,
      optimizationMethod
    );

    return {
      journeyId: visits[0]?.journeyId || '',
      waypoints: optimizedWaypoints,
      segments,
      totalDistance,
      totalDuration,
      totalTravelTime,
      estimatedStartTime,
      estimatedEndTime,
      optimizationScore,
      optimizationMethod,
      metadata: {
        originalOrder: visits.map(v => v.id),
        optimizedOrder: optimizedWaypoints.map(wp => wp.visitId),
        optionsUsed: defaultOptions,
        processedAt: new Date(),
      },
    };
  }

  /**
   * Convertir visitas a waypoints con geocodificaci�n
   */
  private static async convertVisitsToWaypoints(visits: IVisit[]): Promise<IRouteWaypoint[]> {
    const waypoints: IRouteWaypoint[] = [];

    for (let i = 0; i < visits.length; i++) {
      const visit = visits[i];
      const patient = visit.patient;

      if (!patient) {
        throw new Error(`Informaci�n de paciente faltante para visita ${visit.id}`);
      }

      // Geocodificar direcci�n
      const coordinates = await this.geocodeAddress(patient.address, patient.locality);

      waypoints.push({
        visitId: visit.id,
        patientId: patient.id,
        patientName: patient.fullName,
        address: `${patient.address}, ${patient.locality}`,
        coordinates,
        scheduledTime: visit.scheduledDateTime,
        estimatedDuration: this.DEFAULT_VISIT_DURATION,
        orderInRoute: i + 1,
        isOptimized: false,
      });
    }

    return waypoints;
  }

  /**
   * Geocodificar direcci�n (simulado - en producci�n usar API real)
   */
  private static async geocodeAddress(address: string, locality: string): Promise<ICoordinate> {
    // Simulaci�n de geocodificaci�n
    // En producci�n, integrar con Google Maps Geocoding API o similar
    
    console.log(`=�  Geocodificando: ${address}, ${locality}`);
    
    // Generar coordenadas simuladas dentro de Argentina
    const baseLatSeed = address.length + locality.length;
    const baseLngSeed = address.charCodeAt(0) + locality.charCodeAt(0);
    
    const lat = -34.6118 + (baseLatSeed % 100) / 1000; // Buenos Aires �rea
    const lng = -58.3960 + (baseLngSeed % 100) / 1000;

    return {
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      address: `${address}, ${locality}`,
    };

    // Implementaci�n real ser�a:
    // const response = await fetch(
    //   `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${this.GOOGLE_MAPS_API_KEY}`
    // );
    // const data = await response.json();
    // return data.results[0].geometry.location;
  }

  /**
   * Optimizaci�n por fuerza bruta (para pocos puntos)
   */
  private static async optimizeByBruteForce(
    waypoints: IRouteWaypoint[],
    // options parameter is not used in implementation
    _options: IRouteOptimizationOptions
  ): Promise<IRouteWaypoint[]> {
    if (waypoints.length <= 1) return waypoints;

    console.log(`= Optimizando por fuerza bruta: ${waypoints.length} puntos`);

    // Generar todas las permutaciones posibles
    const permutations = this.generatePermutations(waypoints);
    let bestRoute: IRouteWaypoint[] = waypoints;
    let bestDistance = Infinity;

    for (const perm of permutations) {
      const distance = await this.calculateTotalDistance(perm);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestRoute = perm;
      }
    }

    // Actualizar orden
    bestRoute.forEach((wp, index) => {
      wp.orderInRoute = index + 1;
      wp.isOptimized = true;
    });

    return bestRoute;
  }

  /**
   * Optimizaci�n por ventanas de tiempo
   */
  private static async optimizeByTimeWindows(
    waypoints: IRouteWaypoint[],
    options: IRouteOptimizationOptions
  ): Promise<IRouteWaypoint[]> {
    console.log(`� Optimizando por ventanas de tiempo: ${waypoints.length} puntos`);

    // Ordenar por tiempo programado si se respetan las ventanas
    if (options.respectTimeWindows) {
      waypoints.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
    }

    // Aplicar optimizaci�n local (intercambios de vecinos)
    let optimized = [...waypoints];
    let improved = true;
    let iterations = 0;
    const maxIterations = waypoints.length * 2;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (let i = 0; i < optimized.length - 1; i++) {
        for (let j = i + 1; j < optimized.length; j++) {
          // Crear nueva ruta intercambiando posiciones
          const newRoute = [...optimized];
          [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];

          // Verificar si mejora la distancia
          const currentDistance = await this.calculateTotalDistance(optimized);
          const newDistance = await this.calculateTotalDistance(newRoute);

          if (newDistance < currentDistance) {
            optimized = newRoute;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }

    // Actualizar orden
    optimized.forEach((wp, index) => {
      wp.orderInRoute = index + 1;
      wp.isOptimized = true;
    });

    return optimized;
  }

  /**
   * Optimizaci�n por algoritmo gen�tico
   */
  private static async optimizeByGeneticAlgorithm(
    waypoints: IRouteWaypoint[],
    // options parameter is not used in implementation
    _options: IRouteOptimizationOptions
  ): Promise<IRouteWaypoint[]> {
    console.log(`>� Optimizando por algoritmo gen�tico: ${waypoints.length} puntos`);

    const populationSize = Math.min(50, waypoints.length * 4);
    const generations = Math.min(100, waypoints.length * 2);
    const mutationRate = 0.1;

    // Generar poblaci�n inicial
    let population: IRouteWaypoint[][] = [];
    for (let i = 0; i < populationSize; i++) {
      population.push(this.shuffleArray([...waypoints]));
    }

    // Evolucionar
    for (let gen = 0; gen < generations; gen++) {
      // Evaluar fitness de cada individuo
      const fitness: number[] = [];
      for (const individual of population) {
        const distance = await this.calculateTotalDistance(individual);
        fitness.push(1 / (1 + distance)); // Fitness inverso a la distancia
      }

      // Seleccionar padres y crear nueva generaci�n
      const newPopulation: IRouteWaypoint[][] = [];
      
      for (let i = 0; i < populationSize; i++) {
        const parent1 = this.selectParent(population, fitness);
        const parent2 = this.selectParent(population, fitness);
        let child = this.crossover(parent1, parent2);
        
        if (Math.random() < mutationRate) {
          child = this.mutate(child);
        }
        
        newPopulation.push(child);
      }

      population = newPopulation;
    }

    // Seleccionar el mejor individuo
    let bestRoute = population[0];
    let bestDistance = await this.calculateTotalDistance(bestRoute);

    for (const individual of population) {
      const distance = await this.calculateTotalDistance(individual);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestRoute = individual;
      }
    }

    // Actualizar orden
    bestRoute.forEach((wp, index) => {
      wp.orderInRoute = index + 1;
      wp.isOptimized = true;
    });

    return bestRoute;
  }

  /**
   * Calcular segmentos de ruta entre waypoints
   */
  private static async calculateRouteSegments(
    waypoints: IRouteWaypoint[],
    options: IRouteOptimizationOptions
  ): Promise<IRouteSegment[]> {
    const segments: IRouteSegment[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];

      const distance = this.calculateDistance(from.coordinates, to.coordinates);
      const duration = this.estimateTravelTime(distance, options.travelMode);

      segments.push({
        from,
        to,
        distance: Math.round(distance),
        duration: Math.round(duration),
        travelMode: options.travelMode || 'DRIVING',
        instructions: [
          `Dirigirse desde ${from.address}`,
          `hacia ${to.address}`,
          `Distancia: ${(distance / 1000).toFixed(1)} km`,
          `Tiempo estimado: ${Math.round(duration)} minutos`,
        ],
      });
    }

    return segments;
  }

  /**
   * Calcular distancia total de una ruta
   */
  private static async calculateTotalDistance(waypoints: IRouteWaypoint[]): Promise<number> {
    if (waypoints.length <= 1) return 0;

    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const distance = this.calculateDistance(
        waypoints[i].coordinates,
        waypoints[i + 1].coordinates
      );
      totalDistance += distance;
    }

    return totalDistance;
  }

  /**
   * Calcular distancia entre dos coordenadas (f�rmula de Haversine)
   */
  private static calculateDistance(coord1: ICoordinate, coord2: ICoordinate): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) *
        Math.cos(this.toRadians(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Estimar tiempo de viaje basado en distancia
   */
  private static estimateTravelTime(
    distance: number,
    travelMode: string = 'DRIVING'
  ): number {
    let speedKmh = this.SPEED_KMH;

    switch (travelMode) {
      case 'WALKING':
        speedKmh = 5;
        break;
      case 'TRANSIT':
        speedKmh = 25;
        break;
      case 'DRIVING':
      default:
        speedKmh = this.SPEED_KMH;
        break;
    }

    const distanceKm = distance / 1000;
    const timeHours = distanceKm / speedKmh;
    return timeHours * 60; // Convertir a minutos
  }

  /**
   * Calcular score de optimizaci�n
   */
  private static calculateOptimizationScore(
    waypointCount: number,
    totalDistance: number,
    totalDuration: number,
    method: string
  ): number {
    // Score basado en eficiencia de la ruta
    let baseScore = 100;

    // Penalizar por distancia excesiva
    const avgDistancePerWaypoint = totalDistance / waypointCount;
    if (avgDistancePerWaypoint > 5000) {
      baseScore -= 20;
    } else if (avgDistancePerWaypoint > 3000) {
      baseScore -= 10;
    }

    // Penalizar por duraci�n excesiva
    const avgDurationPerWaypoint = totalDuration / waypointCount;
    if (avgDurationPerWaypoint > 60) {
      baseScore -= 15;
    } else if (avgDurationPerWaypoint > 45) {
      baseScore -= 8;
    }

    // Bonus por m�todo de optimizaci�n
    switch (method) {
      case 'GENETIC_ALGORITHM':
        baseScore += 10;
        break;
      case 'TIME_WINDOWS':
        baseScore += 5;
        break;
    }

    return Math.max(0, Math.min(100, baseScore));
  }

  /**
   * Validar ruta optimizada
   */
  static validateOptimizedRoute(route: IOptimizedRoute): IRouteValidation {
    const warnings: string[] = [];
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Verificar distancia total
    if (route.totalDistance > 200000) {
      // > 200km
      errors.push('La distancia total de la ruta es excesiva (>200km)');
    } else if (route.totalDistance > 100000) {
      // > 100km
      warnings.push('La distancia total de la ruta es elevada (>100km)');
    }

    // Verificar duraci�n total
    if (route.totalDuration > 600) {
      // > 10 horas
      errors.push('La duraci�n total del recorrido excede las 10 horas');
    } else if (route.totalDuration > 480) {
      // > 8 horas
      warnings.push('El recorrido podr�a ser muy largo (>8 horas)');
    }

    // Verificar distancias entre waypoints
    const longSegments = route.segments.filter(seg => seg.distance > 50000); // > 50km
    if (longSegments.length > 0) {
      warnings.push(
        `Hay ${longSegments.length} segmentos con distancias largas (>50km)`
      );
    }

    // Verificar score de optimizaci�n
    if (route.optimizationScore < 50) {
      warnings.push('El score de optimizaci�n es bajo, considerar re-optimizar');
    }

    // Sugerencias
    if (route.waypoints.length > 15) {
      suggestions.push('Considerar dividir el recorrido en m�ltiples jornadas');
    }

    if (route.totalTravelTime > route.totalDuration * 0.5) {
      suggestions.push('Tiempo de viaje muy alto, revisar agrupaci�n geogr�fica');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      suggestions,
    };
  }

  /**
   * Generar matriz de distancias para an�lisis
   */
  static async generateDistanceMatrix(
    coordinates: ICoordinate[]
  ): Promise<IDistanceMatrix> {
    const distances: number[][] = [];
    const durations: number[][] = [];

    for (let i = 0; i < coordinates.length; i++) {
      distances[i] = [];
      durations[i] = [];

      for (let j = 0; j < coordinates.length; j++) {
        if (i === j) {
          distances[i][j] = 0;
          durations[i][j] = 0;
        } else {
          const distance = this.calculateDistance(coordinates[i], coordinates[j]);
          const duration = this.estimateTravelTime(distance);
          
          distances[i][j] = Math.round(distance);
          durations[i][j] = Math.round(duration);
        }
      }
    }

    return {
      origins: coordinates,
      destinations: coordinates,
      distances,
      durations,
      status: 'OK',
    };
  }

  // ===== M�TODOS AUXILIARES =====

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private static generatePermutations<T>(arr: T[]): T[][] {
    if (arr.length <= 1) return [arr];
    if (arr.length > 8) {
      // Limitar permutaciones para evitar explosi�n combinatoria
      return [arr, this.shuffleArray(arr), this.shuffleArray(arr)];
    }

    const result: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      const perms = this.generatePermutations(rest);
      for (const perm of perms) {
        result.push([arr[i]].concat(perm));
      }
    }
    return result;
  }

  private static selectParent(
    population: IRouteWaypoint[][],
    fitness: number[]
  ): IRouteWaypoint[] {
    // Selecci�n por torneo
    const tournamentSize = 3;
    let best = 0;
    let bestFitness = fitness[0];

    for (let i = 1; i < tournamentSize && i < population.length; i++) {
      const candidate = Math.floor(Math.random() * population.length);
      if (fitness[candidate] > bestFitness) {
        best = candidate;
        bestFitness = fitness[candidate];
      }
    }

    return [...population[best]];
  }

  private static crossover(
    parent1: IRouteWaypoint[],
    parent2: IRouteWaypoint[]
  ): IRouteWaypoint[] {
    // Order Crossover (OX)
    const start = Math.floor(Math.random() * parent1.length);
    const end = Math.floor(Math.random() * (parent1.length - start)) + start;

    const child = new Array(parent1.length);
    const used = new Set();

    // Copiar segmento del parent1
    for (let i = start; i <= end; i++) {
      child[i] = { ...parent1[i] };
      used.add(parent1[i].visitId);
    }

    // Completar con elementos del parent2
    let childIndex = 0;
    for (let i = 0; i < parent2.length; i++) {
      if (!used.has(parent2[i].visitId)) {
        while (child[childIndex] !== undefined) {
          childIndex++;
        }
        child[childIndex] = { ...parent2[i] };
      }
    }

    return child;
  }

  private static mutate(individual: IRouteWaypoint[]): IRouteWaypoint[] {
    const mutated = [...individual];
    const i = Math.floor(Math.random() * mutated.length);
    const j = Math.floor(Math.random() * mutated.length);
    [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
    return mutated;
  }

  /**
   * Obtener estad�sticas de rutas
   */
  static getRouteStatistics(routes: IOptimizedRoute[]): {
    avgDistance: number;
    avgDuration: number;
    avgScore: number;
    totalRoutes: number;
    bestRoute?: IOptimizedRoute;
    worstRoute?: IOptimizedRoute;
  } {
    if (routes.length === 0) {
      return {
        avgDistance: 0,
        avgDuration: 0,
        avgScore: 0,
        totalRoutes: 0,
      };
    }

    const totalDistance = routes.reduce((sum, route) => sum + route.totalDistance, 0);
    const totalDuration = routes.reduce((sum, route) => sum + route.totalDuration, 0);
    const totalScore = routes.reduce((sum, route) => sum + route.optimizationScore, 0);

    let bestRoute = routes[0];
    let worstRoute = routes[0];

    routes.forEach(route => {
      if (route.optimizationScore > bestRoute.optimizationScore) {
        bestRoute = route;
      }
      if (route.optimizationScore < worstRoute.optimizationScore) {
        worstRoute = route;
      }
    });

    return {
      avgDistance: Math.round(totalDistance / routes.length),
      avgDuration: Math.round(totalDuration / routes.length),
      avgScore: Math.round(totalScore / routes.length),
      totalRoutes: routes.length,
      bestRoute,
      worstRoute,
    };
  }
}