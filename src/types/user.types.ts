// src/types/user.types.ts
export interface UserPreferences {
  language?: "ASL" | "BSL" | "ISL" | "LSF" | "GSL";
  avatarSpeed?: number;
  theme?: "light" | "dark";
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

export interface UpdatePreferencesRequest {
  preferences: UserPreferences;
}

