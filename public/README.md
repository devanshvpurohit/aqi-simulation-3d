# PRAANBOT-Cam: Real-time AQI Simulation

A fully runnable JS-based real-time Air Quality Simulation interface featuring 3D visualization, BiLSTM AQI prediction, and dynamic physics.

## 🚀 Quick Start

1.  **Open `index.html`** in any modern web browser (Chrome/Edge/Firefox).
    *   *Note: For the best experience (and to avoid strict CORS policies on `file://` protocol), it is recommended to run a simple local server, but the app is designed to work standalone with fallbacks.*

2.  **Simulation Mode (Default)**:
    *   Generates synthetic AQI data (sine waves + noise).
    *   Visualizes particles changing color (Green -> Red) based on pollution levels.
    *   Runs AI inference to predict future trend.

3.  **Controls**:
    *   **LIVE**: Connects to WebSocket (default: `ws://localhost:8080`, configurable in code).
    *   **SIMULATION**: Synthetic data.
    *   **REPLAY**: Replays last session from IndexedDB.

## 🛠 Architecture

*   **Core**: Vanilla JS (ES6 Modules)
*   **3D Engine**: Three.js (WebGL2)
*   **AI Inference**: ONNX Runtime Web (BiLSTM Model)
*   **UI**: Tailwind CSS + Chart.js
*   **Data**: IndexedDB for local persistence

## 🧪 Testing

Open the Browser Console (`F12` -> `Console`) to view automated test results, which run 3 seconds after launch:
*   ✅ Inference Time < 200ms
*   ✅ FPS > 45
*   ✅ IndexedDB Persistence

## 📂 File Structure

*   `index.html`: Main entry point.
*   `styles.css`: Custom styling.
*   `scripts/`:
    *   `main.js`: App orchestration.
    *   `model.js`: ONNX / Heuristic AI model.
    *   `environment.js`: Three.js particle system.
    *   `dataEngine.js`: Data generation & replay.
    *   `ui.js`: Chart & DOM updates.

## ⚠️ Note on AI Model

The app attempts to load a BiLSTM ONNX model from HuggingFace. If this fails (due to network or CORS restrictions in standalone mode), it automatically switches to a **High-Fidelity Heuristic Simulation** to ensure the experience is not broken.
