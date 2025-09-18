import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebaseConfig";

// Inicializa la app de Firebase una sola vez
const app = initializeApp(firebaseConfig);
export default app;