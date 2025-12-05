/**
 * UI Manager
 * Handles Chart.js updates and DOM manipulation.
 */

export class UIManager {
    constructor() {
        this.chart = null;
        this.aqiValueEl = document.getElementById('aqi-value');
        this.aqiLabelEl = document.getElementById('aqi-label');
        this.warningBanner = document.getElementById('warning-banner');
        this.latencyEl = document.getElementById('latency-val');
        this.particleCountEl = document.getElementById('particle-count');
        this.modelStatusEl = document.getElementById('model-status');
        this.modelConfidenceEl = document.getElementById('model-confidence');

        this.initChart();
    }

    initChart() {
        const ctx = document.getElementById('aqiChart').getContext('2d');

        // Gradient for the line
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(74, 222, 128, 0.5)');
        gradient.addColorStop(1, 'rgba(74, 222, 128, 0.0)');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(30).fill(''), // Placeholder labels
                datasets: [
                    {
                        label: 'Historical AQI',
                        data: Array(30).fill(null),
                        borderColor: '#4ade80',
                        backgroundColor: gradient,
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0
                    },
                    {
                        label: 'Forecast',
                        data: Array(30).fill(null), // Will overlap and extend
                        borderColor: '#facc15',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: { display: false },
                    y: {
                        display: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#666', font: { size: 10 } },
                        suggestedMin: 0,
                        suggestedMax: 300
                    }
                }
            }
        });
    }

    updateChart(history, prediction) {
        // Keep last 30 points for history
        const displayHistory = history.slice(-30);

        // Update History Dataset
        // We need to pad the beginning if history is short
        const paddedHistory = Array(30 - displayHistory.length).fill(null).concat(displayHistory);
        this.chart.data.datasets[0].data = paddedHistory;

        // Update Forecast Dataset
        // Forecast starts at the last point of history
        const lastHistoryVal = displayHistory[displayHistory.length - 1];
        const forecastData = Array(30).fill(null);

        // Place forecast at the end
        // Actually, to make it look continuous, we put the last history point at index 29
        // and forecast at 30, 31... but chart.js fixed length.
        // Let's say the chart shows T-25 to T+5.

        // Simplified approach: Chart shows 35 points total. 30 history, 5 forecast.
        // Resize labels if needed
        if (this.chart.data.labels.length !== 35) {
            this.chart.data.labels = Array(35).fill('');
        }

        // History: 0-29
        const histData = Array(35).fill(null);
        for (let i = 0; i < displayHistory.length; i++) {
            histData[30 - displayHistory.length + i] = displayHistory[i];
        }
        this.chart.data.datasets[0].data = histData;

        // Forecast: 29-34 (29 overlaps with last history)
        const predData = Array(35).fill(null);
        if (prediction && prediction.length > 0) {
            predData[29] = lastHistoryVal;
            for (let i = 0; i < prediction.length; i++) {
                predData[30 + i] = prediction[i];
            }
        }
        this.chart.data.datasets[1].data = predData;

        this.chart.update();
    }

    updateDisplay(aqi, stats) {
        // Update AQI Value
        this.aqiValueEl.textContent = aqi;

        // Update Label & Color
        let label = "GOOD";
        let colorClass = "text-green-400";

        if (aqi > 50) { label = "MODERATE"; colorClass = "text-yellow-400"; }
        if (aqi > 100) { label = "POOR"; colorClass = "text-orange-400"; }
        if (aqi > 200) { label = "VERY POOR"; colorClass = "text-purple-400"; }
        if (aqi > 300) { label = "SEVERE"; colorClass = "text-red-600"; }

        this.aqiLabelEl.textContent = label;
        this.aqiLabelEl.className = `text-2xl font-bold mt-2 tracking-widest uppercase drop-shadow-lg ${colorClass}`;

        // Warning Banner
        if (aqi > 200) {
            this.warningBanner.classList.remove('hidden');
        } else {
            this.warningBanner.classList.add('hidden');
        }

        // Stats
        if (stats) {
            this.latencyEl.textContent = `${stats.latency.toFixed(1)} ms`;
            this.particleCountEl.textContent = stats.particles;
            this.modelStatusEl.textContent = stats.modelStatus;
            this.modelStatusEl.className = stats.modelStatus === 'Ready' ? 'text-green-400' : 'text-yellow-400';
            this.modelConfidenceEl.textContent = `${(stats.confidence * 100).toFixed(0)}%`;
        }
    }
}
