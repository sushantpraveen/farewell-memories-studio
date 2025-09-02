import { LocalStorageService } from './localStorage';

// API base URL - change this to your backend server URL
const API_BASE_URL = 'http://localhost:4000/api'; // Updated to match new backend port

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Generic API request function
 */
async function apiRequest<T>(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  requiresAuth: boolean = true
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if required and available
  if (requiresAuth) {
    const token = LocalStorageService.loadAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include',
    mode: 'cors'
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    const responseData = await response.json();

    if (!response.ok) {
      throw new ApiError(
        responseData.message || 'Something went wrong',
        response.status,
        responseData
      );
    }

    return responseData as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      500
    );
  }
}

/**
 * Auth API functions
 */
export const authApi = {
  // Register a new user
  register: (name: string, email: string, password: string) => {
    return apiRequest<any>('/users/register', 'POST', { name, email, password }, false);
  },
  
  // Login user
  login: (email: string, password: string) => {
    return apiRequest<any>('/users/login', 'POST', { email, password }, false);
  },
  
  // Get user profile
  getProfile: () => {
    return apiRequest<any>('/users/profile', 'GET');
  },
  
  // Update user profile
  updateProfile: (userData: any) => {
    return apiRequest<any>('/users/profile', 'PUT', userData);
  },
  
  // Get all users (admin only)
  getUsers: () => {
    return apiRequest<any[]>('/users', 'GET');
  }
};

/**
 * Pagination parameters interface
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  yearOfPassing?: string;
}

/**
 * Pagination response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Group API functions
 */
export const groupApi = {
  // Create a new group
  createGroup: (groupData: any) => {
    return apiRequest<any>('/groups', 'POST', groupData);
  },
  
  // Get all groups with pagination (admin only)
  getGroups: (params: PaginationParams = {}) => {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.search) queryParams.append('search', params.search);
    if (params.yearOfPassing) queryParams.append('yearOfPassing', params.yearOfPassing);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/groups?${queryString}` : '/groups';
    
    return apiRequest<PaginatedResponse<any>>(endpoint, 'GET');
  },
  
  // Get group by ID
  getGroupById: (groupId: string) => {
    return apiRequest<any>(`/groups/${groupId}`, 'GET', undefined, false);
  },
  
  // Get group members with pagination
  getGroupMembers: (groupId: string, params: PaginationParams = {}) => {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/groups/${groupId}/members?${queryString}` : `/groups/${groupId}/members`;
    
    return apiRequest<PaginatedResponse<any>>(endpoint, 'GET');
  },
  
  // Join a group
  joinGroup: (groupId: string, memberData: any) => {
    return apiRequest<any>(`/groups/${groupId}/join`, 'POST', memberData, false);
  },
  
  // Update group template
  updateGroupTemplate: (groupId: string, templateData?: { gridTemplate?: string }) => {
    return apiRequest<any>(`/groups/${groupId}/template`, 'PUT', templateData);
  },
  
  // Update group
  updateGroup: (groupId: string, groupData: any) => {
    return apiRequest<any>(`/groups/${groupId}`, 'PUT', groupData);
  },
  
  // Delete group
  deleteGroup: (groupId: string) => {
    return apiRequest<any>(`/groups/${groupId}`, 'DELETE');
  }
};

/**
 * Fallback to localStorage if API is not available
 */
export const useFallbackStorage = async (apiCall: () => Promise<any>, fallbackFn: () => any) => {
  try {
    return await apiCall();
  } catch (error) {
    console.warn('API call failed, using localStorage fallback:', error);
    return fallbackFn();
  }
};
