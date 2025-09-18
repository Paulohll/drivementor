import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import app from "./firebaseApp";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { auth };
