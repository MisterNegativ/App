import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';



const firebaseConfig = {
  apiKey: "AIzaSyD98rJDDXuAJvPiWIeepiSlhOcnETSGRhA",
  authDomain: "task-e4b57.firebaseapp.com",
  projectId: "task-e4b57",
  storageBucket: "task-e4b57.firebasestorage.app",
  messagingSenderId: "108160788449",
  appId: "1:108160788449:web:059ecfa9468595fc6ad4a0",
  measurementId: "G-BS78E8CBRN"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

