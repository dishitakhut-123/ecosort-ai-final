import { useEffect, useState } from "react";
import { getFirebaseDb } from "../firebase";
import { ref, onValue, query, limitToLast } from "firebase/database";

export type Stream = "wet" | "dry";

export type Detection = {
  id: string;
  time: string;
  material: string;
  confidence: number;
  stream: Stream;
  servo: string;
};

const PAPER_ITEMS = new Set(["Cardboard", "Paper", "Tissue", "Cardboard cup", "Newspaper", "Notebook"]);

function formatTime(timestamp?: number | string) {
  const d = timestamp ? new Date(Number(timestamp)) : new Date();
  return isNaN(d.getTime())
    ? new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const DEFAULT_FEED: Detection[] = [
  {
    id: "init-1",
    time: formatTime(Date.now() - 120000),
    material: "Plastic Bottle",
    confidence: 96.8,
    stream: "dry",
    servo: "Servo 0°",
  },
  {
    id: "init-2",
    time: formatTime(Date.now() - 300000),
    material: "Fruit Peel",
    confidence: 94.2,
    stream: "wet",
    servo: "Servo 90°",
  },
  {
    id: "init-3",
    time: formatTime(Date.now() - 540000),
    material: "Cardboard Packaging",
    confidence: 98.1,
    stream: "dry",
    servo: "Servo 0°",
  },
];

export function useTelemetry() {
  const [wetFill, setWetFill] = useState(42);
  const [dryFill, setDryFill] = useState(68);
  const [cycles, setCycles] = useState(148);
  const [paperShare, setPaperShare] = useState(58);
  const [feed, setFeed] = useState<Detection[]>(DEFAULT_FEED);
  const [heartbeat, setHeartbeat] = useState(1);

  useEffect(() => {
    let unsubscribeFill = () => { };
    let unsubscribeDetections = () => { };

    const db = getFirebaseDb();
    if (!db) {
      return () => { };
    }

    try {
      // 1. Live bin fill listener from Firebase (/fill/wet, /fill/dry)
      const fillRef = ref(db, "fill");
      unsubscribeFill = onValue(
        fillRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data && typeof data === "object") {
            if (data.wet !== undefined) setWetFill(Number(data.wet));
            if (data.dry !== undefined) setDryFill(Number(data.dry));
            setHeartbeat((h) => h + 1);
          }
        },
        (err) => {
          console.warn("[TELEMETRY] Fill listener warning:", err);
        }
      );

      // 2. Live detection stream listener from Firebase (/detections)
      const detectionsRef = query(ref(db, "detections"), limitToLast(20));
      unsubscribeDetections = onValue(
        detectionsRef,
        (snapshot) => {
          const data = snapshot.val();
          if (!data || typeof data !== "object") return;

          const keys = Object.keys(data);
          if (keys.length > 0) {
            setCycles(keys.length);

            const parsed: Detection[] = keys
              .map((key) => {
                const item = data[key];
                if (!item || typeof item !== "object") return null;
                const isWet =
                  item.stream === "wet" ||
                  item.category?.toLowerCase().includes("wet") ||
                  item.category?.toLowerCase().includes("peel") ||
                  item.category?.toLowerCase().includes("scrap") ||
                  item.category?.toLowerCase().includes("food") ||
                  item.category?.toLowerCase().includes("fruit") ||
                  item.category?.toLowerCase().includes("vegetable") ||
                  item.bin?.toLowerCase().includes("wet");

                return {
                  id: key,
                  time: formatTime(item.timestamp),
                  material: item.category || (isWet ? "Organic waste" : "Dry recyclable"),
                  confidence: Number(item.confidence ?? 94.5),
                  stream: (isWet ? "wet" : "dry") as Stream,
                  servo: isWet ? "Servo 90°" : "Servo 0°",
                };
              })
              .filter((d): d is Detection => d !== null)
              .reverse();

            if (parsed.length > 0) {
              setFeed(parsed);
              const dryItems = parsed.filter((f) => f.stream === "dry");
              if (dryItems.length > 0) {
                const paperCount = dryItems.filter((d) => PAPER_ITEMS.has(d.material)).length;
                setPaperShare(Math.round((paperCount / dryItems.length) * 100) || 50);
              }
            }
          }
        },
        (err) => {
          console.warn("[TELEMETRY] Detections listener warning:", err);
        }
      );
    } catch (e) {
      console.warn("[TELEMETRY] Failed to subscribe to Firebase:", e);
    }

    return () => {
      unsubscribeFill();
      unsubscribeDetections();
    };
  }, []);

  const wetCount = feed.filter((f) => f.stream === "wet").length;

  return {
    wetFill: Math.round(wetFill),
    dryFill: Math.round(dryFill),
    cycles,
    paperShare: Math.round(paperShare),
    feed,
    heartbeat,
    lastWet: feed.find((f) => f.stream === "wet")?.material ?? "Awaiting detection",
    lastDry: feed.find((f) => f.stream === "dry")?.material ?? "Awaiting detection",
    wetShareOfDay: Math.round((wetCount / Math.max(1, feed.length)) * 100) || 0,
  };
}

export const HOURLY_BALANCE = [
  { hour: "07", wet: 8, dry: 5 },
  { hour: "08", wet: 14, dry: 11 },
  { hour: "09", wet: 21, dry: 18 },
  { hour: "10", wet: 26, dry: 29 },
  { hour: "11", wet: 19, dry: 34 },
  { hour: "12", wet: 38, dry: 31 },
  { hour: "13", wet: 41, dry: 27 },
  { hour: "14", wet: 24, dry: 33 },
  { hour: "15", wet: 17, dry: 25 },
];