import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBu9iKuv9xbDG8fv8PP8gNE1sM_-HEvP1w",
  authDomain: "dts-capstone.firebaseapp.com",
  databaseURL: "https://dts-capstone-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dts-capstone",
  storageBucket: "dts-capstone.firebasestorage.app",
  messagingSenderId: "122242359189",
  appId: "1:122242359189:web:8dfa94837349845d45a09c",
  measurementId: "G-GB1WMN4YY5"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);