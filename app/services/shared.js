// eslint-disable-next-line import/no-unresolved
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import uuid from 'react-native-uuid';
import { formatDistanceToNow, format } from 'date-fns';

const storage = getStorage();

export const getRelativePostTime = (createdAt) => {
  const postDate = new Date(createdAt.seconds * 1000);

  const now = new Date();
  const differenceInDays = (now - postDate) / (1000 * 60 * 60 * 24);

  if (differenceInDays > 30) {
    return format(postDate, 'MMM d, yyyy');
  }

  return formatDistanceToNow(postDate, { addSuffix: true });
};

export const processHashtags = (hashtagsInput) => {
  let hashtagsArray = hashtagsInput
    .replace(/\s+/g, '')
    .split('#')
    .filter(Boolean);

  return hashtagsArray;
};

export const uploadImage = async (imageUri) => {
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