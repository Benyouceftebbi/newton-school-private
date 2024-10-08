// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth,browserLocalPersistence } from "firebase/auth";
import {getFirestore} from 'firebase/firestore'
import { getStorage } from "firebase/storage";
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQBB1wwUky4g0QfhQQM1YfxnXv3PJcCiU",
  authDomain: "proud-academy-db.firebaseapp.com",
  projectId: "proud-academy-db",
  storageBucket: "proud-academy-db.appspot.com",
  messagingSenderId: "642911571175",
  appId: "1:642911571175:web:d43e6245e3ffdc6f7f6642",
  measurementId: "G-56TW2KTZ1W"
};




// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app,{ persistence: browserLocalPersistence});
const db = getFirestore(app)
const storage = getStorage(app);
const functions = getFunctions(app);
// connectFunctionsEmulator(functions, "127.0.0.1", 5001);
export {db , storage,functions}
export default app 
