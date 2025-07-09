// eslint-disable-next-line import/no-unresolved
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import uuid from 'react-native-uuid';
import { formatDistanceToNow, format } from 'date-fns';

const storage = getStorage();

interface Timestamp {
  seconds: number;
  // nanoseconds?: number;
}

export const getRelativePostTime = (createdAt: Timestamp): string => {
  const postDate = new Date(createdAt.seconds * 1000);
  const now = new Date();
  const diffInSeconds = (now.getTime() - postDate.getTime()) / 1000;
  const differenceInDays = diffInSeconds / (60 * 60 * 24);

  if (diffInSeconds < 10) {
    return "Just now";
  }

  if (differenceInDays > 30) {
    return format(postDate, 'MMM d, yyyy');
  }
  return formatDistanceToNow(postDate, { addSuffix: true });
};



export const getFormatedDate = (date: Timestamp | null | undefined): string => {
  if (!date) {
    return '';
  }
  console.log(date)
  const postDate = new Date(date.seconds * 1000);
  try {
    return format(postDate, 'MMM-d-yyyy');
  } catch (e) {
    console.log(e);
    return '';
  }
};

export const getDateTime = (date: Timestamp | null | undefined): string => {
  if (!date) {
    return '';
  }
  const postDate = new Date(date.seconds * 1000);
  try {
    return format(postDate, 'MMM-d-yyyy HH:mm aaa');
  } catch (e) {
    console.log(e);
    return '';
  }
};

export const processHashtags = (hashtagsInput: string): string[] => {
  const hashtagsArray = hashtagsInput
    .replace(/\s+/g, '')
    .split('#')
    .filter(Boolean);

  return hashtagsArray;
};

export const uploadImage = async (imageUri: string): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const mimeType = blob.type;
    const fileExtension = mimeType.split('/')[1];
    const uniqueFileName = `${uuid.v4()}.${fileExtension}`;

    const imageRef = ref(storage, `images/${uniqueFileName}`);
    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading image: ", error);
    throw error;
  }
};


// utils/dateUtils.js
export function formatChatTimestamp(date) {
  const now = new Date();
  const msgDate = new Date(date);
  const isToday = msgDate.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = msgDate.toDateString() === yesterday.toDateString();
  const timeStr = msgDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const daysAgo = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24));
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

