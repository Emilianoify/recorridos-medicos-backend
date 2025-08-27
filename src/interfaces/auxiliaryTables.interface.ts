// ===== CONFIRMATION STATUS =====
export interface IConfirmationStatus {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IConfirmationStatusData {
  name: string;
  description?: string;
  isActive?: boolean;
}

// ===== NOT COMPLETED REASON =====
export interface INotCompletedReason {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  requiresReschedule: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface INotCompletedReasonData {
  name: string;
  description?: string;
  category?: string;
  requiresReschedule?: boolean;
  isActive?: boolean;
}

// ===== REJECTION REASON =====
export interface IRejectionReason {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  suggestedAction?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IRejectionReasonData {
  name: string;
  description?: string;
  category?: string;
  suggestedAction?: string;
  isActive?: boolean;
}
