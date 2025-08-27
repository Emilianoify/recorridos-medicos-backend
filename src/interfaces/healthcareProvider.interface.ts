export interface IHealthcareProvider {
  id: string;
  name: string;
  code?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IHealthcareProviderData {
  name: string;
  code?: string;
  isActive?: boolean;
}
