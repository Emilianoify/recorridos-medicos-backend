export interface IZone {
  id: string;
  name: string;
  description?: string | null;
  polygonCoordinates?: IPolygonCoordinate | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IPolygonCoordinate {
  lat: number;
  lng: number;
}

export interface IZonePolygon {
  coordinates: IPolygonCoordinate[];
  center?: IPolygonCoordinate;
}
