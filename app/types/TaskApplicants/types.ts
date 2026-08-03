export interface Worker {
  userId: string;
  userName: string;
  email?: string;
  profileImage?: string;
  token?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  /**
   * Written into the applicant snapshot when a helper applies (see
   * OfferDetail.handleApply) and copied onto `acceptedBy` on confirmation.
   */
  phone?: string;
  appliedAt?: string;
  status?: string;
  userRating?: number;
  completedTasks?: number;
}

export interface TaskData {
  id: string;
  taskType: string;
  customTaskTitle?: string;
  description?: string;
  numberOfWorkers: number;
  appliedWorkers: Worker[];
  confirmedWorkers: Worker[];
}

export interface TranslatedTaskData {
  taskType: string;
  customTaskTitle: string;
  description: string;
}

export interface ModalConfig {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  buttons: ModalButton[];
}

export interface ModalButton {
  text: string;
  style: "primary" | "cancel" | "destructive";
  onPress?: () => void;
}