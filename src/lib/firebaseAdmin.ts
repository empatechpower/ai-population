import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);

const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);