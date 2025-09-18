import { getFirestore, doc, getDoc, collection, getDocs, query, where, updateDoc } from "firebase/firestore";
import app from "./firebaseApp";

const db = getFirestore(app);

export interface Test {
  id: string;
  prefijo: string;
  num_preguntas: number;
  description?: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
}

export async function updateTestDescription(testId: string, description: string) {
  const testRef = doc(db, "tests", testId);
  await updateDoc(testRef, { description });
  return { success: true };
}

export async function fetchTest(testId: string) {
  const testRef = doc(db, "tests", testId);
  const snapshot = await getDoc(testRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function fetchPreguntas(testId: string) {
  const preguntasRef = collection(db, "tests", testId, "preguntas");
  const snapshot = await getDocs(preguntasRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function fetchTestList(): Promise<Test[]> {
  const testsRef = collection(db, "tests");
  // Removido el filtro fijo de prefijo para mostrar todos los tests
  const snapshot = await getDocs(testsRef);
  return snapshot.docs.map(doc => ({ 
    id: doc.id,
    ...doc.data()
  } as Test));
}