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
  scheduledDateTime?: string;

  /**
   * Owner id, stored at the top level of the taskRequests document alongside
   * the denormalised `user` snapshot. Already read at runtime (e.g. TaskCard
   * resolves the Founder Badge from it) — declared here so it type-checks.
   */
  userId?: string;

  /**
   * Legacy scheduling fields still written by older task documents and read
   * as a fallback when `scheduledDateTime` is absent.
   */
  selectedDate?: string;
  selectedTime?: string;

  isBulkRequest?: boolean;
}

export interface TopRatedUser {
  userId: string;
  name: string;
  profileImage?: string;
  category: "Top Rated" | "Rising Talent" | "Beginner";
  rating?: number;
  completedTasks?: number;
  successRate?: number;

  /**
   * Extra fields returned by fetchUsersWithTaskStats and consumed by the
   * Top Rated surfaces. Declared optional so existing call sites that build
   * a partial user still satisfy the type.
   */
  email?: string;
  isSubscribed?: boolean;
  isFounder?: boolean;
  founderNumber?: number | null;
  memberSince?: string;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null;
  activeCount?: number;
  completedCount?: number;
  reviews?: any[];
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
