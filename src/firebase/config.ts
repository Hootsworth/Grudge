// src/firebase/config.ts

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyDfQ0b_u83v-lJHLKblGbqKu2FHQStAlFM',
  authDomain: 'teapot-201d2.firebaseapp.com',
  projectId: 'teapot-201d2',
  storageBucket: 'teapot-201d2.firebasestorage.app',
  messagingSenderId: '253026251060',
  appId: '1:253026251060:web:a0c1e7afd7cd43ab7f7561',
  measurementId: 'G-Z5QL9E65DN',
};

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (appInstance) return appInstance;
  const existing = getApps();
  if (existing.length > 0) {
    appInstance = getApp();
  } else {
    appInstance = initializeApp(firebaseConfig);
  }
  return appInstance;
}

export function getDb(): Firestore {
  if (dbInstance) return dbInstance;
  const app = getFirebaseApp();
  dbInstance = getFirestore(app);
  return dbInstance;
}
