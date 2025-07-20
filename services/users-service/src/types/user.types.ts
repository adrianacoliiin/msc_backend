export interface CreateUserRequest {
    name?:string;
    last_name?:string;
    email: string;
    password: string;
    role?: 'admin' | 'tech' | 'user';
  }
  
  export interface UpdateUserRequest {
    email?: string;
    role?: 'admin' | 'tech' | 'user';
    name?:string,
    last_name?:string;
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
    name?:string;
    last_name?:string;
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