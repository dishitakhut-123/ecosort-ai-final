import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, query, limitToLast, type Database } from "firebase/database";

export const firebaseConfig = {
    apiKey: "AIzaSyDE9DsoApbM0STsffqzWs7YKQX5HrqeFWs",
    authDomain: "ecosort-ai-37af0.firebaseapp.com",
    databaseURL: "https://ecosort-ai-37af0-default-rtdb.firebaseio.com",
    projectId: "ecosort-ai-37af0",
    storageBucket: "ecosort-ai-37af0.firebasestorage.app",
    messagingSenderId: "131610769361",
    appId: "1:131610769361:web:36222dab6c0a316776d2f0"
};

export const RTDB_URL = "https://ecosort-ai-37af0-default-rtdb.firebaseio.com";

export function getFirebaseApp() {
    if (getApps().length > 0) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

export function getFirebaseDb(): Database | null {
    if (typeof window === "undefined") return null;
    try {
        const app = getFirebaseApp();
        return getDatabase(app, RTDB_URL);
    } catch (err) {
        console.warn("[FIREBASE] getFirebaseDb error:", err);
        return null;
    }
}

export const app = typeof window !== "undefined" ? getFirebaseApp() : null;
export const db = typeof window !== "undefined" ? getFirebaseDb() : null;

export interface FillLevels {
    wet: number;
    dry: number;
}

export interface DetectionItem {
    id: string;
    category: string;
    stream?: string;
    bin: string;
    confidence?: number;
    timestamp: number;
}

// Real-time listener for bin fill levels
export function subscribeToFillLevels(callback: (data: FillLevels) => void) {
    const db = getFirebaseDb();
    if (!db) return () => {};
    const fillRef = ref(db, "fill");
    return onValue(fillRef, (snapshot) => {
        const data = snapshot.val() || { wet: 0, dry: 0 };
        callback({
            wet: Number(data.wet ?? 0),
            dry: Number(data.dry ?? 0),
        });
    });
}

// Real-time listener for detection activity
export function subscribeToDetections(callback: (items: DetectionItem[]) => void, count = 10) {
    const db = getFirebaseDb();
    if (!db) return () => {};
    const detectionsRef = query(ref(db, "detections"), limitToLast(count));
    return onValue(detectionsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            callback([]);
            return;
        }
        const items: DetectionItem[] = Object.keys(data)
            .filter((key) => typeof data[key] === "object" && data[key] !== null)
            .map((key) => ({
                id: key,
                ...data[key],
            }))
            .reverse();
        callback(items);
    });
}