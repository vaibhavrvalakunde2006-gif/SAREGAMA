import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDIZsqmm6p1R1VZ6ehQqgizPjZ-QGBure8",
  authDomain: "saregama-2dfd9.firebaseapp.com",
  projectId: "saregama-2dfd9",
  storageBucket: "saregama-2dfd9.firebasestorage.app",
  messagingSenderId: "193996170018",
  appId: "1:193996170018:web:b9c5442c72e8a34a3dbb7b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const setupRecaptcha = (containerId) => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible'
    });
  }
};
