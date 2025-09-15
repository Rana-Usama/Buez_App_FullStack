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
  apiKey : "AIzaSyBuJcmDlhha9BgIIAIJ2WDCP49CKcDpHDM" , 
  authDomain : "buez-b73cc.firebaseapp.com" , 
  projectId : "buez-b73cc" , 
  storageBucket : "buez-b73cc.firebasestorage.app" , 
  messagingSenderId : "211367941601" , 
  appId : "1:211367941601:web:7ef09c1a391837a251aea0" , 
  measurementId : "G-3PJ4K2JM50" 
};

// Initialize Firebase
export const FIREBASE_APP = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
