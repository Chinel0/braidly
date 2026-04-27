import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

export interface Braider {
  id?: string;
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  styles: string;
  price: string;
  availability: string;
  photoUrl: string;
  videoUrl: string;
  createdAt?: Timestamp;
}

export async function saveBraider(braider: Omit<Braider, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "braiders"), {
    ...braider,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getBraiders(): Promise<Braider[]> {
  const q = query(collection(db, "braiders"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Braider[];
}
