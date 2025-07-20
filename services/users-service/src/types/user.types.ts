export interface CreateUserRequest {
    email: string;
    password: string;
    role?: 'admin' | 'tech' | 'user';
  }
  
  export interface UpdateUserRequest {
    email?: string;
    role?: 'admin' | 'tech' | 'user';
  }
  
  export interface UpdateProfileRequest {
    email?: string;
  }
  
  export interface UpdateRoleRequest {
    role: 'admin' | 'tech' | 'user';
  }
  
  export interface UserResponse {
    id: string;
    email: string;
    role: string;
    status: 'pending' | 'active' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface AuthenticatedRequest extends Request {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }