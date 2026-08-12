import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBLestUIR1V7nWZcyLHBJfX5Qnppj-UWp8",
  authDomain: "devsaimonsantosofficial.firebaseapp.com",
  databaseURL: "https://devsaimonsantosofficial-default-rtdb.firebaseio.com",
  projectId: "devsaimonsantosofficial",
  storageBucket: "devsaimonsantosofficial.firebasestorage.app",
  messagingSenderId: "237740715018",
  appId: "1:237740715018:web:004d7360ceb13607e243f3"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export const ROOT = 'massasDaBel';
