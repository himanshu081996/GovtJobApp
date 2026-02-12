import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAK9m_Hc8soP1wLMqdoh8GVK4gbJw4Ziu8",
  authDomain: "govtjobs-3173b.firebaseapp.com",
  projectId: "govtjobs-3173b",
  storageBucket: "govtjobs-3173b.firebasestorage.app",
  messagingSenderId: "172168851770",
  appId: "1:172168851770:web:76b766372f608a3c4d6003",
  measurementId: "G-GZXWQ5DF18"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;