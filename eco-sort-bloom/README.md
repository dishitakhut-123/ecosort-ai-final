# EcoSort Dashboard

# Project Brief: EcoSort Web Application (Frontend)

Build a clean, responsive, and elegant frontend web application for "EcoSort" (an intelligent waste segregation and bin telemetry platform). 

### 1. Aesthetic & Design Philosophy (Strict Requirements)
- **Zero "AI/Futuristic" Clutter:** Absolutely no neon glows, cybernetic grids, holographic effects, floating 3D spheres, or typical dark-mode AI tropes. 
- **Mood & Tone:** Fresh, earthy, organic, and grounded. Think botanical paper, sunlit linen, damp terracotta, and clean botanical tones. It must feel like an artisanal Scandinavian ecology brand or an architectural portfolio.
- **Palette (Tailwind-friendly or CSS variables):**
  - Primary Background: Warm alabaster/linen (`#FBF9F5` or `#F7F5F0`)
  - Surface/Cards: Crisp chalk white (`#FFFFFF`) with subtle 1px border (`#EBE6DE`)
  - Accents/Freshness: Deep forest moss (`#2D4A3E`), dried sage (`#8A9A86`), and soft eucalyptus (`#E3ECE5`)
  - Earthy Markers: 
    - Wet Bin: Warm terracotta/clay (`#B36A5E` or muted clay `#965D48`)
    - Dry Bin: Deep slate ocean / muted indigo-linen (`#4A6B7C`)
    - Status/Alert: Soft persimmon/rust (`#D96B43`) for bin fill warnings
  - Typography: Editorial, clean, human. Display: Cormorant Garamond, Newsreader, or Outfit (for titles). UI/Body: Inter, Plus Jakarta Sans, or Geist (for crisp metrics and telemetry).

---

### 2. Architecture & Pages

#### Page 1: Editorial Landing & Sign In (`/login` or `/`)
- **Layout:** Split-screen or asymmetrical hero layout with soft photography/illustrations of organic texture, botanical greenery, or minimal sustainable design.
- **Hero Section:** 
  - Subtitle: "EcoSort Telemetry & Stewardship"
  - Headline: "Sorting complexity into circular balance."
  - Brief statement explaining the hardware-software symbiosis: camera classification, physical servo-driven routing, and real-time capacitance monitoring.
- **Feature Showcase Strip:** 3 subtle preview cards showing what the platform tracks:
  - *Zero-Touch Sorting* (Optical stream + IR trigger)
  - *Dual-Stream Routing* (Organic/Wet vs Dry/Recyclable)
  - *Dynamic Fill Telemetry* (Ultrasonic depth sensing)
- **Sign In Card:**
  - Minimalist floating card with soft drop-shadow (`shadow-sm`, blurred edges).
  - Inputs: Operator Email, Access Key / Password.
  - Buttons: A solid moss-green primary button labeled "Access Dashboard" and a link for "Request Facility Access."

---

#### Page 2: Operational Monitoring Hub (`/dashboard`)
*Protected route accessible upon login. Clean navbar at top with the EcoSort logo (custom SVG leaf/circle glyph), facility status pill ("Live • Stream Active"), and user profile avatar.*

- **Section A: Status Overview Strip (Top)**
  - Total Waste Cycles Today (Counter with subtle change percentage)
  - Average Routing Latency (< 1.8s)
  - System Uptime & Optical Feed Status (Connected / Ready)
  - Firebase Synchronization Heartbeat

- **Section B: Physical Bin Telemetry (The Core Visual)**
  - Two primary interactive cards representing the physical compartments:
    1. **Wet Waste Bin (Organic Stream)**
       - Color accent: Terracotta / Warm Clay.
       - Metric: Large typography showing current fill percentage (e.g., `42%`).
       - Visual Gauge: A smooth, organic vertical fluid meter or tactile bar indicator showing physical capacity (0–100%).
       - Status badge: "Optimal" (<80%) or "Requires Emptying" (≥80%).
       - Last deposited item preview (e.g., "Food scraps / Peels").
    2. **Dry Waste Bin (Inorganic / Recyclable Stream)**
       - Color accent: Muted Slate / Slate Teal.
       - Metric: Current fill percentage (e.g., `68%`).
       - Visual Gauge: Matching vertical liquid/fill level with smooth transition.
       - Sub-indicators: Proportion of Paper vs Plastics routed.
       - Status badge: "Collecting Normally".

- **Section C: Live Classification Feed & Activity Log**
  - Left Column (2/3 width): **Segregation Log (Real-Time Feed)**
    - A clean, scannable table/list showing recent items.
    - Columns: Timestamp, Detected Material, Confidence Score (e.g., `96.4%`), Destination Bin, and Action Taken (Servo 0° / 90°).
    - Status pills with soft earthy badges instead of harsh neon colors.
  - Right Column (1/3 width): **Daily Stream Balance**
    - An elegant donut or minimalist area chart comparing Wet vs. Dry volume over the course of the operating day.

---

### 3. Technical & Implementation Details
- **Framework:** React / Next.js (or plain HTML/Tailwind/JS). Use modern Lucide icons (organic, thin-stroke variants).
- **State/Mocking:** Include mock state for real-time WebSocket / Firebase polling to simulate live changes in bin percentages (`wetFill`, `dryFill`) and the addition of new detected items.
- **Micro-Interactions:** Subtle hover states, smooth CSS transitions (300ms ease-out) for progress bars, and zero jarring layout shifts.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b84e8ad7-543d-4b3d-b077-d93ee8b1bb73).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
