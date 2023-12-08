import { initializeApp } from "firebase/app";

import { getDatabase, ref, set, get, child } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId: process.env.measurementId,
};

export const _ = initializeApp(firebaseConfig);
const db = getDatabase();
const dbRef = ref(db);

async function saveToken() {}
