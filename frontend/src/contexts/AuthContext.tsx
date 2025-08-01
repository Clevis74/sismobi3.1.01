import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';

// Tipos de autenticação
interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

// Context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider Props
interface _AuthProviderProps {
  children: ReactNode;
}

// Hook para usar o contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider Component
export const AuthProvider: React.FC<_AuthContextProps> = ({ children }): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const isAuthenticated = !!user;

  // Função para limpar erro
  const clearError = () => setError(null);

  // Função de login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fazer login via API
      const response = await authService.login(email, password);
      
      if (response && response.access_token) {
        // Buscar dados do usuário
        const userData = await authService.getCurrentUser();
        setUser(userData);
        return true;
      }
      
      setError('Credenciais inválidas');
      return false;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro durante o login';
      setError(errorMessage);
      console.error('Login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Registrar usuário via API
      await authService.register({ name, email, password });
      
      // Após registro, fazer login automaticamente
      return await login(email, password);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro durante o registro';
      setError(errorMessage);
      console.error('Registration error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  // Verificar token ao inicializar
  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      try {
        setIsLoading(true);
        
        // Verificar se há token armazenado
        const isValid = await authService.verifyToken();
        
        if (isValid) {
          // Token válido, buscar dados do usuário
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } else {
          // Token inválido, limpar
          authService.logout();
          setUser(null);
        }
        
      } catch (err) {
        console.warn('Auth initialization failed:', err);
        authService.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    error,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};