// Authentication service
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      role: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export const authService = {
  // Store JWT token in localStorage
  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  },

  // Get JWT token from localStorage
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  // Store user data
  setUser(user: AuthUser) {
    localStorage.setItem('auth_user', JSON.stringify(user));
  },

  // Get user data
  getUser(): AuthUser | null {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Check user role
  hasRole(requiredRoles: string[]): boolean {
    const user = this.getUser();
    return user ? requiredRoles.includes(user.role) : false;
  },

  // Login with email and password
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data: LoginResponse = await response.json();

    // Store token and user
    if (data.success && data.data.token) {
      this.setToken(data.data.token);
      this.setUser(data.data.user);
    }

    return data;
  },

  // Logout
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  // Verify token with backend
  async verifyToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  },
};
