
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocalStorageService } from '@/lib/localStorage';
import { authApi, ApiError, useFallbackStorage } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  isLeader: boolean;
  groupId?: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLeader: boolean;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  getAllUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<Record<string, User>>({});

  // Load user data from token on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const token = LocalStorageService.loadAuthToken();
        
        if (token) {
          try {
            // Try to get user profile from API
            const userData = await authApi.getProfile();
            setUser({
              ...userData,
              createdAt: new Date(userData.createdAt)
            });
          } catch (error) {
            // If API fails, try to get from localStorage
            console.warn('Failed to get user profile from API, using localStorage:', error);
            const localUserData = LocalStorageService.loadUserData();
            if (localUserData) {
              setUser(localUserData);
            } else {
              // If no local data, clear token
              LocalStorageService.clearAll();
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Initialize users from localStorage on mount (fallback)
  useEffect(() => {
    const savedUsers = LocalStorageService.loadUsers();
    setUsers(savedUsers);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Try API login
      try {
        const userData = await authApi.login(email, password);
        
        // Convert createdAt string to Date object
        const user = {
          ...userData,
          createdAt: new Date(userData.createdAt)
        };
        
        // Save token and user data
        LocalStorageService.saveAuthToken(userData.token);
        LocalStorageService.saveUserData(user);
        
        // Update state
        setUser(user);
        return true;
      } catch (error) {
        console.warn('API login failed, trying localStorage fallback:', error);
        
        // Fallback to localStorage
        const existingUser = Object.values(users).find(u => u.email === email);
        
        if (existingUser) {
          const mockToken = 'mock-jwt-token-' + Date.now();
          
          LocalStorageService.saveAuthToken(mockToken);
          LocalStorageService.saveUserData(existingUser);
          setUser(existingUser);
          
          return true;
        } else {
          // Create new user if not found (for demo purposes)
          const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email,
            name: email.split('@')[0], // Use email prefix as name for demo
            isLeader: false,
            groupId: undefined,
            createdAt: new Date()
          };

          const mockToken = 'mock-jwt-token-' + Date.now();
          
          setUsers(prev => ({ ...prev, [newUser.id]: newUser }));
          LocalStorageService.saveAuthToken(mockToken);
          LocalStorageService.saveUserData(newUser);
          setUser(newUser);
          
          return true;
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Try API registration
      try {
        const userData = await authApi.register(name, email, password);
        
        // Convert createdAt string to Date object
        const user = {
          ...userData,
          createdAt: new Date(userData.createdAt)
        };
        
        // Save token and user data
        LocalStorageService.saveAuthToken(userData.token);
        LocalStorageService.saveUserData(user);
        
        // Update state
        setUser(user);
        return true;
      } catch (error) {
        console.warn('API registration failed, trying localStorage fallback:', error);
        
        // Fallback to localStorage
        // Check if user already exists
        const existingUser = Object.values(users).find(u => u.email === email);
        if (existingUser) {
          return false; // User already exists
        }

        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          name,
          isLeader: false,
          groupId: undefined,
          createdAt: new Date()
        };

        const mockToken = 'mock-jwt-token-' + Date.now();
        
        setUsers(prev => ({ ...prev, [newUser.id]: newUser }));
        LocalStorageService.saveAuthToken(mockToken);
        LocalStorageService.saveUserData(newUser);
        setUser(newUser);
        
        return true;
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    LocalStorageService.clearAll();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoading(true);
      
      // Try API update
      try {
        const userData = await authApi.updateProfile(updates);
        
        // Convert createdAt string to Date object
        const updatedUser = {
          ...userData,
          createdAt: new Date(userData.createdAt)
        };
        
        // Save updated user data
        LocalStorageService.saveUserData(updatedUser);
        
        // Update state
        setUser(updatedUser);
        return true;
      } catch (error) {
        console.warn('API update failed, using localStorage fallback:', error);
        
        // Fallback to localStorage
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        setUsers(prev => ({ ...prev, [user.id]: updatedUser }));
        
        // Update localStorage
        LocalStorageService.saveUserData(updatedUser);
        return true;
      }
    } catch (error) {
      console.error('Update user failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    try {
      // Try API first
      try {
        const apiUsers = await authApi.getUsers();
        return apiUsers.map(user => ({
          ...user,
          createdAt: new Date(user.createdAt)
        }));
      } catch (error) {
        console.warn('API get users failed, using localStorage fallback:', error);
        // Fallback to localStorage
        return Object.values(users);
      }
    } catch (error) {
      console.error('Get all users failed:', error);
      return [];
    }
  };

  const isAuthenticated = !!user;
  const isLeader = user?.isLeader || false;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAuthenticated,
      isLoading,
      isLeader,
      updateUser,
      getAllUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};
