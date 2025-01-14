import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import { FIREBASE_DB } from '../../firebaseConfig'; // Your Firestore instance

export const createNewChat = async (userId1, userId2) => {
  try {
    const chatQuery = query(
      collection(FIREBASE_DB, 'chats'),
      where('participants', 'array-contains', userId1)
    );

    const snapshot = await getDocs(chatQuery);
    const existingChat = snapshot.docs.find((doc) => {
      const data = doc.data();
      return data.participants.includes(userId2);
    });

    if (existingChat) {
      console.log('Chat already exists with ID:', existingChat.id);
      return existingChat.id;
    }

    // If no existing chat, create a new one
    const chatData = {
      participants: [userId1, userId2],
      lastMessage: '',
      lastMessageTimestamp: null,
      createdAt: Timestamp.now(),
    };

    const chatDoc = await addDoc(collection(FIREBASE_DB, 'chats'), chatData);

    console.log('New chat created with ID:', chatDoc.id);
    return chatDoc.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};