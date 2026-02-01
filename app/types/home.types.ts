// In src/types/home.types.ts
export interface Task {
  id: string;
  description: string;
  taskType: string;
  customTaskTitle?: string;
  compensationType: 'Monitarely' | 'Other';
  monitarily?: string;
  otherCompensation?: string;
  currencyInfo?: {
    code: string;
    symbol: string;
  };
  imageUrls: string[];
  address?: {
    name?: string; // Add this to access address.name
    latitude: number;
    longitude: number;
  };
  user: {
    userId: string;
    userName: string;
    profileImage?: string;
  };
  createdAt: any;
  
  // Add bulk request properties (make them optional)
  numberOfWorkers?: number;
  appliedWorkers?: Array<{
    userId: string;
    userName: string;
    profileImage?: string;
    email?: string;
    phone?: string;
    token?: string;
    appliedAt: string;
    status: 'pending' | 'confirmed' | 'rejected';
    userRating?: number;
    completedTasks?: number;
  }>;
  confirmedWorkers?: Array<{
    userId: string;
    userName: string;
    profileImage?: string;
    email?: string;
    phone?: string;
  }>;
}

export interface TopRatedUser {
  userId: string;
  name: string;
  profileImage?: string;
  category: 'Top Rated' | 'Rising Talent' | 'Beginner';
  rating?: number;
  completedTasks?: number;
  successRate?: number;
}

export interface FilterOption {
  label: string;
  value: string;
  icon: string;
  iconType: 'ionicons' | 'material' | 'material-community' | 'fontawesome5' | 'fontawesome6';
}

export interface LocationData {
  name2?: string;
  latitude2?: number;
  longitude2?: number;
}