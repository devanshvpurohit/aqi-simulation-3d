/**
 * Data Engine for AQI Simulation
 * Handles synthetic generation, WebSocket connection, and IndexedDB replay.
 */

export class DataEngine {
    constructor() {
        this.mode = 'simulation'; // 'live', 'simulation', 'replay'
        this.socket = null;
        this.db = null;
        this.dbName = 'AQI_DB';
        this.storeName = 'readings';
        this.replayData = [];
        this.replayIndex = 0;
        this.initDB();
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.errorCode);
                resolve(false);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: "timestamp" });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("IndexedDB initialized");
                resolve(true);
            };
        });
    }

    async saveReading(reading) {
        if (!this.db) return;
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        store.add(reading);
    }

    async loadReplayData() {
        if (!this.db) return;
        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                this.replayData = request.result;
                // Sort by timestamp just in case
                this.replayData.sort((a, b) => a.timestamp - b.timestamp);
                // Keep only last 1000 readings for replay to avoid memory issues
                if (this.replayData.length > 1000) {
                    this.replayData = this.replayData.slice(-1000);
                }
                this.replayIndex = 0;
                console.log(`Loaded ${this.replayData.length} readings for replay`);
                resolve(this.replayData);
            };
        });
    }

    setMode(mode) {
        this.mode = mode;
        if (mode === 'replay') {
            this.loadReplayData();
        }
    }

    connectWebSocket(url) {
        try {
            this.socket = new WebSocket(url);
            this.socket.onopen = () => console.log("WebSocket Connected");
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.latestLiveReading = this.normalizeData(data);
                } catch (e) {
                    console.error("WS Parse Error", e);
                }
            };
            this.socket.onerror = (e) => console.error("WS Error", e);
        } catch (e) {
            console.error("Invalid WS URL", e);
        }
    }

    normalizeData(raw) {
        // Ensure data matches standard format
        return {
            timestamp: raw.timestamp || Date.now(),
            mq135_ppm: raw.mq135_ppm || 0,
            normalized_aqi: raw.normalized_aqi || raw.aqi || 0
        };
    }

    generateSynthetic() {
        const now = Date.now();
        // Create a base sine wave for day/night cycle + noise + random spikes
        const timeScale = now / 10000;
        const base = Math.sin(timeScale) * 50 + 100; // Oscillate between 50 and 150
        const noise = (Math.random() - 0.5) * 20;

        // Occasional spikes
        let spike = 0;
        if (Math.random() > 0.95) spike = Math.random() * 100;
        if (Math.random() > 0.99) spike = Math.random() * 300; // Huge spike

        let aqi = Math.max(0, base + noise + spike);

        // Smooth transitions could be handled here, but raw data is fine for now

        return {
            timestamp: now,
            mq135_ppm: aqi * 1.5, // Rough correlation
            normalized_aqi: Math.round(aqi)
        };
    }

    async getPacket() {
        let packet;

        if (this.mode === 'live' && this.latestLiveReading) {
            packet = this.latestLiveReading;
        } else if (this.mode === 'replay') {
            if (this.replayData.length > 0) {
                packet = this.replayData[this.replayIndex];
                this.replayIndex = (this.replayIndex + 1) % this.replayData.length;
            } else {
                // Fallback if no replay data
                packet = this.generateSynthetic();
            }
        } else {
            // Default Simulation
            packet = this.generateSynthetic();
        }

        // Save to DB if not in replay mode
        if (this.mode !== 'replay') {
            this.saveReading(packet);
        }

        return packet;
    }
}
