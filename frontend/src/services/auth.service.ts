import api from "@/lib/axios";

export interface RegisterRequest {
  name: string;
  email: string;
  password?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  storageLimit: number;
}

export const AuthService = {
  async register(data: RegisterRequest): Promise<UserResponse> {
    const response = await api.post<UserResponse>("/api/auth/register", data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/login", data);
    return response.data;
  },
};
export default AuthService;
