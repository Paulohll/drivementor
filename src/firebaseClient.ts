import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import { firebaseConfig } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export async function fetchQuestions(testId: string) {
  const testRef = ref(db, `test/${testId}`);
  const snapshot = await get(testRef);
  if (!snapshot.exists()) return null;
  return snapshot.val();
}
