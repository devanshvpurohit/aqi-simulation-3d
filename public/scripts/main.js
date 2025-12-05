import { DataEngine } from './dataEngine.js';
import { AQIModel } from './model.js';
import { Environment } from './environment.js';
import { UIManager } from './ui.js';

class App {
    constructor() {
        this.dataEngine = new DataEngine();
        this.model = new AQIModel();
        this.environment = new Environment('canvas-container');
        this.ui = new UIManager();

        this.history = []; // Store recent AQI values
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;

        this.init();
    }

    async init() {
        // Initialize Model
        await this.model.init();

        // Setup Controls
        document.getElementById('btn-live').onclick = () => this.setMode('live');
        document.getElementById('btn-sim').onclick = () => this.setMode('simulation');
        document.getElementById('btn-replay').onclick = () => this.setMode('replay');

        // Start Loop
        this.loop();

        // Run Tests after 3 seconds
        setTimeout(() => this.runTests(), 3000);
    }

    setMode(mode) {
        console.log(`Switching to ${mode} mode`);
        this.dataEngine.setMode(mode);

        // Update UI buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active', 'border-green-500/30', 'bg-green-500/10', 'text-green-400');
            btn.classList.add('border-gray-700', 'bg-gray-900/50', 'text-gray-400');
        });

        const activeBtn = document.getElementById(`btn-${mode === 'simulation' ? 'sim' : mode}`);
        if (activeBtn) {
            activeBtn.classList.remove('border-gray-700', 'bg-gray-900/50', 'text-gray-400');
            activeBtn.classList.add('active', 'border-green-500/30', 'bg-green-500/10', 'text-green-400');
        }
    }

    async loop() {
        if (!this.isRunning) return;

        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.frameCount++;

        if (delta >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = now;
        }

        // 1. Get Data
        const packet = await this.dataEngine.getPacket();
        const aqi = packet.normalized_aqi;

        this.history.push(aqi);
        if (this.history.length > 50) this.history.shift();

        // 2. Run Inference (Async)
        const inferenceStart = performance.now();
        const prediction = await this.model.predict(this.history);
        const inferenceTime = performance.now() - inferenceStart;

        // 3. Update Environment
        this.environment.updateAQI(aqi);

        // 4. Update UI
        this.ui.updateDisplay(aqi, {
            latency: inferenceTime,
            particles: this.environment.particles ? this.environment.particles.geometry.attributes.position.count : 0,
            modelStatus: this.model.status === 'ready' ? 'Ready' : (this.model.status === 'fallback' ? 'Simulated' : 'Loading'),
            confidence: prediction.confidence
        });

        this.ui.updateChart(this.history, prediction.prediction_curve);

        requestAnimationFrame(() => this.loop());
    }

    async runTests() {
        console.group("🧪 Automated System Tests");

        // Test 1: Inference Time
        const start = performance.now();
        await this.model.predict([100, 102, 105, 108, 110]);
        const duration = performance.now() - start;
        console.log(`Test 1: Inference Time: ${duration.toFixed(2)}ms ${duration < 200 ? '✅ PASS' : '❌ FAIL'}`);

        // Test 2: FPS
        console.log(`Test 2: Simulation FPS: ${this.fps} ${this.fps > 45 ? '✅ PASS' : '⚠️ WARN'}`);

        // Test 3: IndexedDB
        if (this.dataEngine.db) {
            console.log(`Test 3: IndexedDB Connected ✅ PASS`);
        } else {
            console.log(`Test 3: IndexedDB Failed ❌ FAIL`);
        }

        console.groupEnd();
    }
}

// Start App
window.app = new App();
