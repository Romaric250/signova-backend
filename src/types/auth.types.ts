// src/types/auth.types.ts
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
}

