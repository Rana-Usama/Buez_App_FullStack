import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// eslint-disable-next-line import/no-unresolved, import/named
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBRAw10W0C5r94phUdU1I7Pj1tkufPBg3U",
  authDomain: "socially-1720865151833.firebaseapp.com",
  projectId: "socially-1720865151833",
  storageBucket: "socially-1720865151833.appspot.com",
  messagingSenderId: "291364316025",
  appId: "1:291364316025:web:7098c369e7d2a9bb4285a8",
  measurementId: "G-4VKB8JLENR"
};

// Initialize Firebase
export const FIREBASE_APP = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
