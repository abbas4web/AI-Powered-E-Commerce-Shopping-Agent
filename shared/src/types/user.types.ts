import { UserRole } from './auth.types';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  preferredBrands: string[];
  preferredCategories: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  useCases: string[];
  performancePreference: number | null;
  batteryPreference: number | null;
  cameraPreference: number | null;
  designPreference: number | null;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface UpdatePreferencesRequest {
  preferredBrands?: string[];
  preferredCategories?: string[];
  budgetMin?: number;
  budgetMax?: number;
  useCases?: string[];
  performancePreference?: number;
  batteryPreference?: number;
  cameraPreference?: number;
  designPreference?: number;
}
