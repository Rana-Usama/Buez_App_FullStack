export interface Worker {
  userId: string;
  userName: string;
  email?: string;
  profileImage?: string;
  token?: string;
  confirmedAt?: string;
  confirmedBy?: string;
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