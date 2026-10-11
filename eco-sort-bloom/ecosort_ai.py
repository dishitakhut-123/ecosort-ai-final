"""
EcoSort AI - Real-time External Webcam Waste Classifier & Firebase Sync
Powered by OpenAI CLIP (Zero-Shot Computer Vision)
"""

import time
import threading
import requests
import cv2
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

# ── 1. CONFIGURATION ──────────────────────────────────────────
SERIAL_PORT = "COM3"          # Update to your ESP32 COM port when connected
BAUD_RATE = 9600
DEFAULT_CAM_INDEX = 1         # 1 = External USB Webcam (0 = Integrated Laptop Camera)
DB_URL = "https://ecosort-ai-37af0-default-rtdb.firebaseio.com"

# ── 2. WASTE TAXONOMY DEFINITION ─────────────────────────────
WASTE_CLASSES = [
    # WET / ORGANIC STREAM
    {
        "name": "Fruit Peel",
        "stream": "wet",
        "bin": "Wet Bin",
        "prompt": "fresh fruit peel, banana peel, orange peel, or apple core"
    },
    {
        "name": "Food Scraps",
        "stream": "wet",
        "bin": "Wet Bin",
        "prompt": "leftover cooked food, meal scraps, damp food residue, or cooked vegetables"
    },
    {
        "name": "Vegetable Waste",
        "stream": "wet",
        "bin": "Wet Bin",
        "prompt": "raw vegetable scraps, potato peels, carrot skins, onion peels, or salad leaves"
    },
    {
        "name": "Organic Plant Residue",
        "stream": "wet",
        "bin": "Wet Bin",
        "prompt": "used tea bags, coffee grounds, eggshells, garden leaves, or flower petals"
    },
    {
        "name": "Soiled Food Paper",
        "stream": "wet",
        "bin": "Wet Bin",
        "prompt": "greasy pizza box or soiled wet paper napkin with food stains"
    },

    # DRY / RECYCLABLE STREAM
    {
        "name": "Plastic Bottle",
        "stream": "dry",
        "bin": "Dry Bin",
        "prompt": "clear plastic water bottle, drink bottle, or plastic shampoo container"
    },
    {
        "name": "Cardboard",
        "stream": "dry",
        "bin": "Dry Bin",
        "prompt": "brown corrugated cardboard box, carton packaging, or cardboard piece"
    },
    {
        "name": "Paper",
        "stream": "dry",
        "bin": "Dry Bin",
        "prompt": "clean paper sheet, newspaper, printed document, magazine, or notebook paper"
    },
    {
        "name": "Metal Can",
        "stream": "dry",
        "bin": "Dry Bin",
        "prompt": "aluminum soda can, beverage tin, crushed beer can, or metal tin container"
    },
    {
        "name": "Plastic Wrapper",
        "stream": "dry",
        "bin": "Dry Bin",
        "prompt": "plastic chips packet, snack packaging, plastic polythene pouch, or plastic film"
    },
    {
        "name": "Glass Container",
        "stream": "dry",
        "bin": "Dry Bin",
        "prompt": "clear glass beverage bottle, glass jar, or glassware"
    },
    {
        "name": "Electronic Item",
        "stream": "dry",
        "bin": "Dry Bin",
        "prompt": "electronic gadget, cable, mouse, phone accessory, or battery"
    }
]

PROMPTS = [f"a photo of {item['prompt']}" for item in WASTE_CLASSES]

# ── 3. LOAD VISION MODEL ─────────────────────────────────────
print("\n" + "=" * 60)
print(" ECOSORT AI: Initializing Vision Pipeline...")
print("=" * 60)
MODEL_NAME = "openai/clip-vit-base-patch32"
device = "cuda" if torch.cuda.is_available() else "cpu"

print(f"[AI] Loading OpenAI CLIP ({MODEL_NAME}) on {device.upper()}...")
model = CLIPModel.from_pretrained(MODEL_NAME).to(device)
processor = CLIPProcessor.from_pretrained(MODEL_NAME)
model.eval()
print(f"[AI] Model ready with {len(WASTE_CLASSES)} categories.")

# ── 4. HARDWARE SERIAL (ESP32) ────────────────────────────────
ser = None
try:
    import serial
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    time.sleep(2)
    print(f"[SERIAL] Connected to ESP32 on {SERIAL_PORT}")
except Exception as e:
    print(f"[SERIAL] ESP32 not connected ({e}). Running in software/simulation mode.")

# ── 5. FIREBASE BACKEND SYNC ──────────────────────────────────
last_sync_status = "Ready"
last_detected_material = "None"
last_detected_stream = "None"
last_detected_conf = 0.0

def push_to_firebase_async(category_name, stream_type, bin_name, confidence):
    global last_sync_status
    def _task():
        global last_sync_status
        url = f"{DB_URL}/detections.json"
        payload = {
            "category": category_name,
            "stream": stream_type,
            "bin": bin_name,
            "confidence": round(confidence, 1),
            "timestamp": int(time.time() * 1000)
        }
        try:
            resp = requests.post(url, json=payload, timeout=4)
            if resp.status_code == 200:
                last_sync_status = f"Synced: {category_name}"
                print(f"  --> [FIREBASE 200 OK] Pushed '{category_name}' [{stream_type.upper()}] ({confidence:.1f}%) to Cloud DB!")
            else:
                last_sync_status = f"HTTP {resp.status_code}"
                print(f"  --> [FIREBASE ERROR] HTTP {resp.status_code}: {resp.text}")
        except Exception as err:
            last_sync_status = "Offline"
            print(f"  --> [NETWORK ERROR] Failed to connect: {err}")

    t = threading.Thread(target=_task, daemon=True)
    t.start()

# ── 6. CLASSIFY FRAME ─────────────────────────────────────────
def classify_frame(frame):
    global last_detected_material, last_detected_stream, last_detected_conf

    # Convert BGR to RGB PIL image
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(rgb_frame)

    inputs = processor(text=PROMPTS, images=pil_image, return_tensors="pt", padding=True).to(device)

    with torch.no_grad():
        outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)[0]

    top_idx = torch.argmax(probs).item()
    best_match = WASTE_CLASSES[top_idx]
    confidence = probs[top_idx].item() * 100.0

    # Stream probabilities
    wet_prob = sum(probs[i].item() for i, c in enumerate(WASTE_CLASSES) if c["stream"] == "wet") * 100.0
    dry_prob = sum(probs[i].item() for i, c in enumerate(WASTE_CLASSES) if c["stream"] == "dry") * 100.0

    stream_type = best_match["stream"]
    category_name = best_match["name"]
    bin_name = best_match["bin"]

    last_detected_material = category_name
    last_detected_stream = stream_type
    last_detected_conf = confidence

    cmd = "W" if stream_type == "wet" else "D"
    print(f"\n[CLASSIFIED] Material: {category_name} | Bin: {bin_name} ({stream_type.upper()}) | Confidence: {confidence:.1f}% | Total Wet: {wet_prob:.1f}%, Total Dry: {dry_prob:.1f}%")

    # Dispatch to ESP32
    if ser:
        try:
            ser.write(cmd.encode())
        except Exception as e:
            print(f"[SERIAL ERROR] Failed to send command: {e}")

    # Dispatch to Firebase Realtime Database
    push_to_firebase_async(category_name, stream_type, bin_name, confidence)
    return best_match, confidence

def open_camera(target_index=1):
    # Try preferred target camera first (e.g. 1 for External Webcam)
    indices_to_try = [target_index, 0 if target_index != 0 else 1]
    
    for idx in indices_to_try:
        print(f"[WEBCAM] Attempting to open Camera {idx} {'(External USB Webcam)' if idx == 1 else '(Integrated Camera)'}...")
        cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
        if cap.isOpened():
            ret, test_frame = cap.read()
            if ret and test_frame is not None and test_frame.size > 0:
                print(f"[WEBCAM] Camera {idx} successfully opened! Resolution: {test_frame.shape[1]}x{test_frame.shape[0]}")
                return cap, idx
            cap.release()

        # Fallback to standard backend
        cap = cv2.VideoCapture(idx)
        if cap.isOpened():
            ret, test_frame = cap.read()
            if ret and test_frame is not None and test_frame.size > 0:
                print(f"[WEBCAM] Camera {idx} successfully opened via standard backend!")
                return cap, idx
            cap.release()

    return None, -1

# ── 7. MAIN WEBCAM LOOP ───────────────────────────────────────
def main():
    current_cam_index = DEFAULT_CAM_INDEX
    cap, active_cam_idx = open_camera(current_cam_index)

    if cap is None:
        print("[CRITICAL ERROR] No webcam accessible. Please make sure no other program (like Zoom, Teams, or Browser) is locking the webcam.")
        return

    auto_scan = False
    last_auto_time = 0
    auto_interval = 2.5  # seconds

    print("\n" + "=" * 60)
    print(" ECOSORT LIVE VISION CONTROLS")
    print("=" * 60)
    print(f" • Active Camera : Index {active_cam_idx} {'[External USB Webcam]' if active_cam_idx == 1 else '[Integrated Camera]'}")
    print(" • [SPACE]       : Scan item & Push directly to Firebase & Website")
    print(" • [A]           : Toggle Continuous Auto-Scan Mode")
    print(" • [C]           : Switch / Toggle Camera (External <-> Laptop)")
    print(" • [Q]           : Exit Application")
    print("=" * 60 + "\n")

    while True:
        try:
            ret, frame = cap.read()
        except cv2.error:
            time.sleep(0.05)
            continue

        if not ret or frame is None or frame.size == 0:
            time.sleep(0.05)
            continue

        current_time = time.time()
        h, w, _ = frame.shape

        # Auto-scan if enabled
        if auto_scan and (current_time - last_auto_time > auto_interval):
            last_auto_time = current_time
            print("[AUTO-SCAN TRIGGER]")
            classify_frame(frame)

        # Handle keyboard input
        key = cv2.waitKey(1) & 0xFF
        if key == ord(' '):
            print("[MANUAL TRIGGER]")
            classify_frame(frame)
        elif key == ord('a') or key == ord('A'):
            auto_scan = not auto_scan
            print(f"[MODE] Auto-Scan set to: {'ENABLED' if auto_scan else 'DISABLED'}")
        elif key == ord('c') or key == ord('C'):
            # Switch camera
            next_cam = 0 if active_cam_idx == 1 else 1
            print(f"\n[CAM SWITCH] Switching to Camera Index {next_cam}...")
            cap.release()
            new_cap, new_idx = open_camera(next_cam)
            if new_cap is not None:
                cap = new_cap
                active_cam_idx = new_idx
                print(f"[CAM SWITCH] Now active: Camera {active_cam_idx}")
            else:
                print(f"[CAM SWITCH FAILED] Reverting to Camera {active_cam_idx}...")
                cap, active_cam_idx = open_camera(active_cam_idx)
        elif key == ord('q') or key == ord('Q'):
            break

        # Check for serial IR trigger if connected
        if ser and ser.in_waiting > 0:
            try:
                incoming = ser.read().decode(errors="ignore")
                if "T" in incoming:
                    print("[HARDWARE IR TRIGGER]")
                    classify_frame(frame)
            except Exception:
                pass

        # ── RENDER ON-SCREEN HUD OVERLAY ───────────────────────
        # Header bar
        cv2.rectangle(frame, (0, 0), (w, 55), (25, 30, 25), -1)
        cam_label = "External Webcam" if active_cam_idx == 1 else "Laptop Cam"
        cv2.putText(frame, f"EcoSort AI | Camera: {cam_label} (Idx {active_cam_idx})", (15, 24),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (235, 245, 235), 2)

        mode_text = f"Mode: {'AUTO-SCAN (2.5s)' if auto_scan else 'MANUAL (SPACE)'} | [C] Switch Cam"
        mode_color = (0, 255, 180) if auto_scan else (200, 200, 200)
        cv2.putText(frame, mode_text, (15, 45),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, mode_color, 1)

        # Center target reticle
        cx, cy = w // 2, h // 2
        box_w = min(150, w // 3)
        box_h = min(150, h // 3)
        cv2.rectangle(frame, (cx - box_w, cy - box_h), (cx + box_w, cy + box_h), (0, 230, 140), 2)
        cv2.putText(frame, "Place Item Here", (cx - 60, cy - box_h - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 230, 140), 1)

        # Bottom result status bar
        cv2.rectangle(frame, (0, h - 55), (w, h), (20, 20, 20), -1)
        if last_detected_material != "None":
            stream_badge = "[WET ORGANIC]" if last_detected_stream == "wet" else "[DRY RECYCLABLE]"
            badge_color = (60, 140, 240) if last_detected_stream == "wet" else (220, 180, 70)
            res_str = f"Last: {last_detected_material} {stream_badge} ({last_detected_conf:.1f}%)"
            cv2.putText(frame, res_str, (15, h - 32),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.52, badge_color, 1)
        else:
            cv2.putText(frame, "Hold item & Press SPACE (or 'A' for Auto)", (15, h - 32),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.48, (180, 180, 180), 1)

        cv2.putText(frame, f"Firebase: {last_sync_status}", (15, h - 12),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (140, 200, 140), 1)

        cv2.imshow("EcoSort AI - Live Webcam Waste Detection", frame)

    cap.release()
    cv2.destroyAllWindows()
    if ser:
        ser.close()
    print("[AI] EcoSort Pipeline stopped cleanly.")

if __name__ == "__main__":
    main()