/**
 * 3D Environment for AQI Visualization
 * Uses Three.js to render particles and fog reacting to AQI levels.
 */

import { Robot } from './robot.js';

export class Environment {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.fog = null;
        this.robot = null;
        this.clock = new THREE.Clock();
        this.aqi = 50; // Initial AQI

        this.init();
        this.animate();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.fog = new THREE.FogExp2(0x000000, 0.002);
        this.scene.fog = this.fog;

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 50;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Particles
        this.createParticles();

        // Ground
        this.createGround();

        // Robot
        this.robot = new Robot(this.scene, this.camera);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);

        // Resize Handler
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const count = 5000;
        const positions = [];
        const colors = [];

        const color = new THREE.Color();

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            positions.push(x, y, z);

            color.setHSL(Math.random(), 1.0, 0.5);
            colors.push(color.r, color.g, color.b);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createGround() {
        const gridHelper = new THREE.GridHelper(200, 50, 0x444444, 0x222222);
        this.scene.add(gridHelper);
        const planeGeo = new THREE.PlaneGeometry(200, 200);
        const planeMat = new THREE.MeshBasicMaterial({ color: 0x000000, visible: false });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        this.scene.add(plane);
    }

    updateAQI(val) {
        this.aqi = val;
        this.updateVisuals();
    }

    updateVisuals() {
        let colorHex = 0x00ff00;
        let density = 0.002;
        let particleSize = 0.5;
        let shake = 0;

        if (this.aqi <= 50) { colorHex = 0x4ade80; density = 0.005; }
        else if (this.aqi <= 100) { colorHex = 0xfacc15; density = 0.01; }
        else if (this.aqi <= 200) { colorHex = 0xf97316; density = 0.02; particleSize = 0.8; }
        else if (this.aqi <= 300) { colorHex = 0xa855f7; density = 0.035; particleSize = 1.2; shake = 0.05; }
        else { colorHex = 0xef4444; density = 0.05; particleSize = 1.5; shake = 0.1; }

        const targetColor = new THREE.Color(colorHex);
        this.scene.fog.color.lerp(targetColor, 0.05);
        this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, density, 0.05);
        this.particles.material.size = THREE.MathUtils.lerp(this.particles.material.size, particleSize, 0.1);

        const colors = this.particles.geometry.attributes.color;
        for (let i = 0; i < colors.count; i++) {
            if (Math.random() > 0.9) colors.setXYZ(i, targetColor.r, targetColor.g, targetColor.b);
        }
        colors.needsUpdate = true;

        // Camera Shake - REMOVED to prevent jitter (handled in robot.js now)
        // if (shake > 0) {
        //     this.camera.position.x += (Math.random() - 0.5) * shake;
        //     this.camera.position.y += (Math.random() - 0.5) * shake;
        // }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = this.clock.getElapsedTime();

        // Rotate particles
        if (this.particles) {
            this.particles.rotation.y = time * 0.02;
        }

        // Update Robot
        if (this.robot) this.robot.update(time, this.aqi);

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
