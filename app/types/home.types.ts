// In src/types/home.types.ts
export interface Task {
  id: string;
  description: string;
  taskType: string;
  customTaskTitle?: string;
  compensationType: "Monitarely" | "Other";
  monitarily?: string;
  otherCompensation?: string;
  currencyInfo?: {
    code: string;
    symbol: string;
    locale?: string;
  };
  imageUrls: string[];
  address?: {
    name?: string;
    latitude: number;
    longitude: number;
    countryCode?: string;
  };
  user: {
    userId: string;
    userName: string;
    profileImage?: string;
  };
  createdAt: any;

  // Bulk request properties
  numberOfWorkers?: number;
  appliedWorkers?: Array<{
    userId: string;
    userName: string;
    profileImage?: string;
    email?: string;
    phone?: string;
    token?: string;
    appliedAt: string;
    status: "pending" | "confirmed" | "rejected";
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

  // **New fields for selected sub-tasks and duration**
  selectedSubTasks?: Array<{
    id: string;
    name: string;
    isCustom: boolean;
  }>;
  durationLabel?: string;
  estimatedDuration?: string;
  slotsAvailable?: number;
  status?: string;
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface TopRatedUser {
  userId: string;
  name: string;
  profileImage?: string;
  category: "Top Rated" | "Rising Talent" | "Beginner";
  rating?: number;
  completedTasks?: number;
  successRate?: number;
}

export interface FilterOption {
  label: string;
  value: string;
  icon: string;
  iconType:
    | "ionicons"
    | "material"
    | "material-community"
    | "fontawesome5"
    | "fontawesome6";
}

export interface LocationData {
  name2?: string;
  latitude2?: number;
  longitude2?: number;
}
