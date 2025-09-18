import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";
import app from "./firebaseApp";

const db = getFirestore(app);

export interface TestAttempt {
  testId: string;
  userId: string;
  respuestas: Record<string, string>;
  correctas: number;
  incorrectas: number;
  total: number;
  tiempo: number;
  fecha: Date;
  fallos: Array<string|number>;
}

export async function saveTestAttempt(attempt: TestAttempt) {
  const attemptsRef = collection(db, "test_attempts");
  const docRef = await addDoc(attemptsRef, {
    ...attempt,
    fecha: Timestamp.fromDate(attempt.fecha),
    fallos: attempt.fallos
  });
  return docRef.id;
}
