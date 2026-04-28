import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { z } from "zod";

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

const BraiderSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  whatsapp: z.string().optional().default("").transform((v) => v ?? ""),
  city: z.string().min(1),
  styles: z.string().optional().default("").transform((v) => v ?? ""),
  price: z.string().optional().default("").transform((v) => v ?? ""),
  availability: z.string().optional().default("").transform((v) => v ?? ""),
  photoUrl: z.string().url().optional().default("").transform((v) => v ?? ""),
  videoUrl: z.string().url().optional().default("").transform((v) => v ?? ""),
});

type BraiderInput = z.infer<typeof BraiderSchema>;

export async function saveBraider(braider: Omit<Braider, "id" | "createdAt">): Promise<string> {
  // runtime-validate input with Zod
  const parsed = BraiderSchema.safeParse(braider as unknown);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    throw new Error(`Braider validation failed: ${errors}`);
  }

  const payload: BraiderInput & { createdAt: Timestamp } = {
    ...parsed.data,
    createdAt: Timestamp.now(),
  };

  try {
    const docRef = await addDoc(collection(db, "braiders"), payload);
    return docRef.id;
  } catch (err) {
    console.error("saveBraider error:", err);
    throw new Error("Failed to save braider");
  }
}

export async function getBraiders(): Promise<Braider[]> {
  try {
    const q = query(collection(db, "braiders"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    })) as Braider[];
  } catch (err) {
    console.error("getBraiders error:", err);
    throw new Error("Failed to load braiders");
  }
}
