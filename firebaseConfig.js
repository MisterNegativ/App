import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, serverTimestamp, arrayUnion } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyD98rJDDXuAJvPiWIeepiSlhOcnETSGRhA",
  authDomain: "task-e4b57.firebaseapp.com",
  projectId: "task-e4b57",
  storageBucket: "task-e4b57.appspot.com", // Исправлено (у вас было .firebasestorage.app)
  messagingSenderId: "108160788449",
  appId: "1:108160788449:web:059ecfa9468595fc6ad4a0",
  measurementId: "G-BS78E8CBRN"
};

// Инициализация приложения
const app = initializeApp(firebaseConfig);

// Инициализация Auth с AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Инициализация Firestore
const db = getFirestore(app);

// Экспорт нужных функций
export { 
  auth, 
  db,
  serverTimestamp, // Добавьте этот экспорт
  arrayUnion       // Добавьте этот экспорт
};