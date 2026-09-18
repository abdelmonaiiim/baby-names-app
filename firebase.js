import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCkcPrR91ekZbeTxbgxCROZ886EIc47nxo",
  authDomain: "baby-names-app-f8b2d.firebaseapp.com",
  projectId: "baby-names-app-f8b2d",
  storageBucket: "baby-names-app-f8b2d.firebasestorage.app",
  messagingSenderId: "273737711224",
  appId: "1:273737711224:web:e49173b8a296bd4ad1778d",
  measurementId: "G-1D8HFB5837"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore Database and export it
export const db = getFirestore(app);