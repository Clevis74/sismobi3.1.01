// SISMOBI API Service Layer
// Replaces localStorage operations with backend API calls

import { Property, Tenant, Transaction, Alert, Document, /* EnergyBill, WaterBill */ } from '../types';

// API Configuration
const API_BASE_URL = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API_PREFIX = import.meta.env.REACT_APP_API_PREFIX || '/api/v1';

// Auth token management
let authToken: string | null = localStorage.getItem('auth_token');

export const setAuthToken = (token: string | null): boolean => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

// Helper function to make authenticated API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle authentication errors
    if (response.status === 401) {
      setAuthToken(null);
      // Could redirect to login here if needed
      throw new Error('Authentication required');
    }

    return response;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Generic CRUD operations
class ApiService<T> {
  constructor(private endpoint: string) {}

  async getAll(): Promise<T[]> {
    const response = await apiRequest(`${this.endpoint}/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${this.endpoint}`);
    }
    const data = await response.json();
    return data.items || data;
  }

  async getById(id: string): Promise<T> {
    const response = await apiRequest(`${this.endpoint}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${this.endpoint}/${id}`);
    }
    return await response.json();
  }

  async create(item: Omit<T, 'id'>): Promise<T> {
    const response = await apiRequest(`${this.endpoint}/`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error(`Failed to create ${this.endpoint}`);
    }
    return await response.json();
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const response = await apiRequest(`${this.endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error(`Failed to update ${this.endpoint}/${id}`);
    }
    return await response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await apiRequest(`${this.endpoint}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete ${this.endpoint}/${id}`);
    }
  }
}

// Service instances for each data type
export const propertyService = new ApiService<Property>('/properties');
export const tenantService = new ApiService<Tenant>('/tenants');
export const transactionService = new ApiService<Transaction>('/transactions');
export const alertService = new ApiService<Alert>('/alerts');
export const documentService = new ApiService<Document>('/documents');

// Authentication service
export const authService = {
  async register(userData: { name: string; email: string; password: string }) {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error('Registration failed');
    }
    return await response.json();
  },

  async login(email: string, password: string) {
    // Backend expects form data for login
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    setAuthToken(data.access_token);
    return data;
  },

  async logout() {
    setAuthToken(null);
  },

  async getCurrentUser() {
    const response = await apiRequest('/auth/me');
    if (!response.ok) {
      throw new Error('Failed to fetch current user');
    }
    return await response.json();
  },

  async verifyToken() {
    try {
      const response = await apiRequest('/auth/verify');
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Dashboard service
export const dashboardService = {
  async getSummary() {
    const response = await apiRequest('/dashboard/summary');
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard summary');
    }
    return await response.json();
  }
};

// Health check
export const healthService = {
  async check() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
};

// Initialize auth token on module load
const storedToken = localStorage.getItem('auth_token');
if (storedToken) {
  setAuthToken(storedToken);
}