"""
EcoSort AI - Benchmark & Live Accuracy Evaluation (External Webcam)
"""

import time
import requests
import cv2
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

DB_URL = "https://ecosort-ai-37af0-default-rtdb.firebaseio.com"

# ── 1. LOAD MODEL ─────────────────────────────────────────────
MODEL_NAME = "openai/clip-vit-base-patch32"
print("[AI] Loading CLIP model...")
device = "cuda" if torch.cuda.is_available() else "cpu"
model = CLIPModel.from_pretrained(MODEL_NAME).to(device)
processor = CLIPProcessor.from_pretrained(MODEL_NAME)
model.eval()

CANDIDATE_LABELS = [
    "a photo of wet organic biodegradable waste food scrap fruit peel vegetable damp organic residue",
    "a photo of dry recyclable inorganic item paper cardboard plastic metal electronics bottle cup clean dry waste"
]

# ── 2. INITIALIZE CAMERA (EXTERNAL WEBCAM DEFAULT) ────────────
def get_camera(target_idx=1):
    for idx in [target_idx, 0 if target_idx != 0 else 1]:
        print(f"[WEBCAM] Trying Camera {idx} {'(External USB Webcam)' if idx == 1 else '(Integrated Camera)'}...")
        cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                return cap, idx
            cap.release()

        cap = cv2.VideoCapture(idx)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                return cap, idx
            cap.release()
    return None, -1

cap, active_cam_idx = get_camera(1)
if cap is None:
    print("[ERROR] Could not open camera.")
    exit(1)

results = []

def test_and_sync(ground_truth):
    ret, frame = cap.read()
    if not ret or frame is None:
        print("[ERROR] Camera capture failed.")
        return

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb_frame)

    inputs = processor(text=CANDIDATE_LABELS, images=pil_img, return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)[0]

    wet_prob = probs[0].item() * 100
    dry_prob = probs[1].item() * 100

    predicted = "WET" if wet_prob > dry_prob else "DRY"
    confidence = wet_prob if predicted == "WET" else dry_prob
    is_correct = predicted == ground_truth

    results.append({
        "actual": ground_truth,
        "predicted": predicted,
        "correct": is_correct,
        "confidence": confidence
    })

    print(f"\n[SAMPLE #{len(results)}]")
    print(f"  Camera       : Index {active_cam_idx} {'(External)' if active_cam_idx == 1 else '(Integrated)'}")
    print(f"  Ground Truth : {ground_truth}")
    print(f"  Predicted    : {predicted} ({confidence:.1f}%)")
    print(f"  Status       : {'MATCH' if is_correct else 'MISS'}")

    total = len(results)
    correct_count = sum(1 for r in results if r["correct"])
    print(f"  Running Accuracy: {(correct_count / total) * 100:.1f}% ({correct_count}/{total} correct)")

    # Direct push to Firebase
    try:
        url = f"{DB_URL}/detections.json"
        event = {
            "category": f"{predicted.capitalize()} Waste",
            "stream": predicted.lower(),
            "bin": "Wet Bin" if predicted == "WET" else "Dry Bin",
            "confidence": round(confidence, 1),
            "timestamp": int(time.time() * 1000)
        }
        requests.post(url, json=event, timeout=3)
        print("  --> Dashboard updated via Firebase!")
    except Exception as err:
        print(f"  Firebase update failed: {err}")

print("\n=== BENCHMARK & DASHBOARD SYNC (EXTERNAL WEBCAM) ===")
print("• Hold an item under the camera.")
print("• Press 'w' if it is WET waste (food/fruit/scraps).")
print("• Press 'd' if it is DRY waste (bottle/paper/cardboard).")
print("• Press 'c' to switch camera.")
print("• Press 'q' to quit.\n")

while True:
    try:
        ret, frame = cap.read()
    except cv2.error:
        time.sleep(0.05)
        continue

    if not ret or frame is None:
        continue

    key = cv2.waitKey(1) & 0xFF
    if key == ord('w') or key == ord('W'):
        test_and_sync("WET")
    elif key == ord('d') or key == ord('D'):
        test_and_sync("DRY")
    elif key == ord('c') or key == ord('C'):
        next_idx = 0 if active_cam_idx == 1 else 1
        cap.release()
        new_cap, new_idx = get_camera(next_idx)
        if new_cap:
            cap = new_cap
            active_cam_idx = new_idx
    elif key == ord('q') or key == ord('Q'):
        break

    cam_text = f"Cam {active_cam_idx} ({'External' if active_cam_idx == 1 else 'Laptop'}) | Press W/D to Test"
    cv2.putText(frame, cam_text, (15, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 180), 2)
    cv2.imshow("EcoSort - Live Accuracy & Sync", frame)

cap.release()
cv2.destroyAllWindows()