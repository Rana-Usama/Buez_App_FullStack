// eslint-disable-next-line import/no-unresolved
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import uuid from "react-native-uuid";
import { formatDistanceToNow, format } from "date-fns";

const storage = getStorage();

interface Timestamp {
  seconds: number;
  nanoseconds?: number;
}

// Helper function to safely parse any date input
const safeParseDate = (dateInput: any): Date | null => {
  if (!dateInput) return null;
  
  try {
    // Handle Firestore timestamp object
    if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
      return new Date(dateInput.seconds * 1000 + (dateInput.nanoseconds || 0) / 1000000);
    }
    
    // Handle string date (ISO or other format)
    if (typeof dateInput === 'string') {
      const parsedDate = new Date(dateInput);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    // Handle Date object
    if (dateInput instanceof Date) {
      return dateInput;
    }
    
    // Try to parse as Date anyway
    const parsedDate = new Date(dateInput);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
    
    return null;
  } catch (error) {
    console.log("Error parsing date:", error, dateInput);
    return null;
  }
};

export const getRelativePostTime = (createdAt: Timestamp | string | Date): string => {
  const postDate = safeParseDate(createdAt);
  if (!postDate) return "Recently";
  
  const now = new Date();
  const diffInSeconds = (now.getTime() - postDate.getTime()) / 1000;
  const differenceInDays = diffInSeconds / (60 * 60 * 24);

  if (diffInSeconds < 10) {
    return "Just now";
  }

  if (differenceInDays > 30) {
    return format(postDate, "MMM d, yyyy");
  }
  return formatDistanceToNow(postDate, { addSuffix: true });
};

export const getFormatedDate = (date: Timestamp | string | Date | null | undefined): string => {
  const postDate = safeParseDate(date);
  if (!postDate) {
    return "";
  }
  try {
    return format(postDate, "MMM-d-yyyy");
  } catch (e) {
    console.log("Error formatting date:", e, date);
    return "";
  }
};

// NEW FUNCTION: Specifically for confirmed dates
export const getFormatedConfirmedDate = (date: Timestamp | string | Date | null | undefined): string => {
  const postDate = safeParseDate(date);
  if (!postDate) {
    return "";
  }
  try {
    // Format as "Dec 23, 2025" or similar
    return format(postDate, "MMM d, yyyy");
  } catch (e) {
    console.log("Error formatting confirmed date:", e, date);
    return "";
  }
};

export const getDateTime = (date: Timestamp | string | Date | null | undefined): string => {
  const postDate = safeParseDate(date);
  if (!postDate) {
    return "";
  }
  try {
    return format(postDate, "MMM-d-yyyy HH:mm aaa");
  } catch (e) {
    console.log("Error formatting date time:", e, date);
    return "";
  }
};

// NEW FUNCTION: Get relative time for confirmed date (e.g., "2 days ago")
export const getRelativeConfirmedTime = (date: Timestamp | string | Date | null | undefined): string => {
  const postDate = safeParseDate(date);
  if (!postDate) {
    return "";
  }
  try {
    const now = new Date();
    const diffInSeconds = (now.getTime() - postDate.getTime()) / 1000;
    
    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return format(postDate, "MMM d, yyyy");
    }
  } catch (e) {
    console.log("Error getting relative confirmed time:", e, date);
    return getFormatedConfirmedDate(date);
  }
};

export const processHashtags = (hashtagsInput: string): string[] => {
  const hashtagsArray = hashtagsInput.replace(/\s+/g, "").split("#").filter(Boolean);
  return hashtagsArray;
};

export const uploadImage = async (imageUri: string): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const mimeType = blob.type;
    const fileExtension = mimeType.split("/")[1];
    const uniqueFileName = `${uuid.v4()}.${fileExtension}`;

    const imageRef = ref(storage, `images/${uniqueFileName}`);
    console.log("imageRef............", imageRef);
    const upload = await uploadBytes(imageRef, blob);
    console.log("upload............", upload);
    const downloadURL = await getDownloadURL(imageRef);
    console.log("downloadURL............", downloadURL);
    return downloadURL;
  } catch (error) {
    console.log("Error uploading image: ", error);
    throw error;
  }
};

// utils/dateUtils.js
export function formatChatTimestamp(date: Timestamp | string | Date) {
  const postDate = safeParseDate(date);
  if (!postDate) return "";
  
  const now = new Date();
  const msgDate = postDate;
  const isToday = msgDate.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = msgDate.toDateString() === yesterday.toDateString();
  const timeStr = msgDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const daysAgo = Math.floor((now.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
  if (isToday) {
    return timeStr; // e.g., 09:21 PM
  } else if (isYesterday) {
    return "Yesterday";
  } else if (daysAgo < 7) {
    return msgDate.toLocaleDateString("en-US", { weekday: "long" }); // e.g., Monday
  } else {
    return msgDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }); // e.g., 30 Jun 2025
  }
}