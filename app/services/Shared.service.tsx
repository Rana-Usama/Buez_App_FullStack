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
