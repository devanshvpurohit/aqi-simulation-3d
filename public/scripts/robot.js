import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Robot {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.mesh = null;
        this.light = null;
        this.sensorPointLight = null;
        this.headlights = [];
        this.taillights = [];
        this.dustParticles = [];

        // Physics
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.speed = 0;
        this.maxSpeed = 1.5; // Slightly faster top speed
        this.turnSpeed = 0.06; // Faster turning
        this.friction = 0.85; // Less slippery, stops faster
        this.accelerationRate = 0.15; // 3x faster acceleration (snappier)

        this.keys = { w: false, a: false, s: false, d: false };

        this.init();
    }

    init() {
        this.createRobot();
        this.setupInputs();
    }

    createTexture(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        if (type === 'metal') {
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(0, 0, 512, 512);
            for (let i = 0; i < 50000; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#333' : '#1a1a1a';
                ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
            }
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 4;
            ctx.strokeRect(20, 20, 472, 472);
            ctx.beginPath();
            ctx.moveTo(256, 20); ctx.lineTo(256, 492);
            ctx.moveTo(20, 256); ctx.lineTo(492, 256);
            ctx.stroke();
            ctx.fillStyle = '#555';
            [30, 256, 482].forEach(x => {
                [30, 256, 482].forEach(y => {
                    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
                });
            });
        } else if (type === 'caution') {
            ctx.fillStyle = '#eab308';
            ctx.fillRect(0, 0, 512, 512);
            ctx.fillStyle = '#111';
            for (let i = -500; i < 1000; i += 100) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i + 50, 0);
                ctx.lineTo(i - 150 + 512, 512);
                ctx.lineTo(i - 200 + 512, 512);
                ctx.fill();
            }
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            for (let i = 0; i < 10000; i++) {
                ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
            }
        }
        return new THREE.CanvasTexture(canvas);
    }

    createRobot() {
        this.mesh = new THREE.Group();

        const metalTex = this.createTexture('metal');
        const cautionTex = this.createTexture('caution');

        // Chassis Group
        const chassisGroup = new THREE.Group();

        // Main Body
        const bodyGeo = new THREE.BoxGeometry(3.5, 1.2, 5.5);
        const bodyMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.7, metalness: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        chassisGroup.add(body);

        // Cabin
        const cabinGeo = new THREE.BoxGeometry(2.5, 0.8, 3);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.8 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.6, -0.5);
        chassisGroup.add(cabin);

        // Bumpers
        const bumperGeo = new THREE.BoxGeometry(3.6, 0.4, 0.5);
        const bumperMat = new THREE.MeshStandardMaterial({ map: cautionTex });
        const frontBumper = new THREE.Mesh(bumperGeo, bumperMat);
        frontBumper.position.set(0, 0.4, 2.8);
        chassisGroup.add(frontBumper);
        const rearBumper = new THREE.Mesh(bumperGeo, bumperMat);
        rearBumper.position.set(0, 0.4, -2.8);
        chassisGroup.add(rearBumper);

        this.mesh.add(chassisGroup);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(1.2, 1.2, 1, 32);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, bumpScale: 0.2 });
        const positions = [
            { x: 2.1, z: 1.8 }, { x: -2.1, z: 1.8 },
            { x: 2.1, z: -1.8 }, { x: -2.1, z: -1.8 }
        ];

        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos.x, 0, pos.z);
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.1, 16), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1 }));
            hub.rotation.z = Math.PI / 2;
            hub.position.set(pos.x, 0, pos.z);
            this.mesh.add(wheel);
            this.mesh.add(hub);
        });

        // Mast & Light
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.5, 16), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 }));
        mast.position.set(0, 2.4, -1.5);
        this.mesh.add(mast);

        const lightGeo = new THREE.SphereGeometry(0.4, 32, 32);
        const lightMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 2, transparent: true, opacity: 0.9 });
        this.light = new THREE.Mesh(lightGeo, lightMat);
        this.light.position.set(0, 3.2, -1.5);
        this.mesh.add(this.light);

        this.sensorPointLight = new THREE.PointLight(0x00ff00, 1, 10);
        this.sensorPointLight.position.set(0, 3.2, -1.5);
        this.mesh.add(this.sensorPointLight);

        // Headlights
        [-1, 1].forEach(x => {
            const hl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 5 }));
            hl.position.set(x, 0.6, 2.76);
            this.mesh.add(hl);
            const spot = new THREE.SpotLight(0xffffff, 2, 40, 0.6, 0.5, 1);
            spot.position.set(x, 0.6, 2.8);
            spot.target.position.set(x, 0, 15);
            this.mesh.add(spot);
            this.mesh.add(spot.target);
            this.headlights.push(spot);
        });

        // Taillights
        [-1, 1].forEach(x => {
            const tl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 3 }));
            tl.position.set(x, 0.6, -2.76);
            this.mesh.add(tl);
            this.taillights.push(tl);
        });

        this.scene.add(this.mesh);
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => this.onKey(e, true), false);
        window.addEventListener('keyup', (e) => this.onKey(e, false), false);
    }

    onKey(event, isDown) {
        switch (event.key.toLowerCase()) {
            case 'w': case 'arrowup': this.keys.w = isDown; break;
            case 'a': case 'arrowleft': this.keys.a = isDown; break;
            case 's': case 'arrowdown': this.keys.s = isDown; break;
            case 'd': case 'arrowright': this.keys.d = isDown; break;
        }
    }

    update(time, aqi) {
        if (!this.mesh) return;

        // 1. Calculate Acceleration based on Input
        // Snappier acceleration curve
        if (this.keys.w) {
            this.speed = THREE.MathUtils.lerp(this.speed, this.maxSpeed, this.accelerationRate);
        } else if (this.keys.s) {
            this.speed = THREE.MathUtils.lerp(this.speed, -this.maxSpeed / 2, this.accelerationRate);
        } else {
            // Stop much faster when keys released
            this.speed = THREE.MathUtils.lerp(this.speed, 0, this.accelerationRate * 2);
        }

        // 2. Rotation (only when moving or just starting to move)
        if (Math.abs(this.speed) > 0.01) {
            if (this.keys.a) this.mesh.rotation.y += this.turnSpeed * (this.speed > 0 ? 1 : -1);
            if (this.keys.d) this.mesh.rotation.y -= this.turnSpeed * (this.speed > 0 ? 1 : -1);
        }

        // 3. Apply Velocity
        this.velocity.x = Math.sin(this.mesh.rotation.y) * this.speed;
        this.velocity.z = Math.cos(this.mesh.rotation.y) * this.speed;
        this.mesh.position.add(this.velocity);

        // 4. Camera Follow (Tighter Lerp + Shake)
        // We use a separate vector for the "ideal" smooth position to avoid fighting with the shake
        if (!this.smoothCameraPos) {
            this.smoothCameraPos = this.camera.position.clone();
        }

        const relativeCameraOffset = new THREE.Vector3(0, 12, -25); // Behind and up
        const targetPos = relativeCameraOffset.applyMatrix4(this.mesh.matrixWorld);

        // Tighter follow (0.05 -> 0.15) to reduce perceived lag
        this.smoothCameraPos.lerp(targetPos, 0.15);

        // Calculate Shake based on AQI
        let shake = 0;
        if (aqi > 200) shake = 0.05;
        if (aqi > 300) shake = 0.1;

        // Apply to actual camera
        this.camera.position.copy(this.smoothCameraPos);

        if (shake > 0) {
            this.camera.position.x += (Math.random() - 0.5) * shake;
            this.camera.position.y += (Math.random() - 0.5) * shake;
            this.camera.position.z += (Math.random() - 0.5) * shake;
        }

        this.camera.lookAt(this.mesh.position);

        // 5. Dust Particles
        if (Math.abs(this.speed) > 0.1) this.createDust();
        this.updateDust();

        // 6. Lights & AQI Reaction
        this.updateLights(aqi, time);
    }

    createDust() {
        [-1.5, 1.5].forEach(x => {
            const dustGeo = new THREE.PlaneGeometry(0.5, 0.5);
            const dustMat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
            const dust = new THREE.Mesh(dustGeo, dustMat);
            const offset = new THREE.Vector3(x, 0.2, -2.5).applyMatrix4(this.mesh.matrixWorld);
            dust.position.copy(offset);
            dust.rotation.copy(this.camera.rotation);
            this.scene.add(dust);
            this.dustParticles.push({ mesh: dust, life: 1.0 });
        });
    }

    updateDust() {
        for (let i = this.dustParticles.length - 1; i >= 0; i--) {
            const p = this.dustParticles[i];
            p.life -= 0.02;
            p.mesh.position.y += 0.02;
            p.mesh.scale.multiplyScalar(1.05);
            p.mesh.material.opacity = p.life * 0.4;
            p.mesh.rotation.copy(this.camera.rotation);
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.dustParticles.splice(i, 1);
            }
        }
    }

    updateLights(aqi, time) {
        let colorHex = 0x00ff00;
        if (aqi > 50) colorHex = 0xfacc15;
        if (aqi > 100) colorHex = 0xf97316;
        if (aqi > 200) colorHex = 0xa855f7;
        if (aqi > 300) colorHex = 0xef4444;

        if (this.light) {
            this.light.material.color.setHex(colorHex);
            this.light.material.emissive.setHex(colorHex);
            if (this.sensorPointLight) this.sensorPointLight.color.setHex(colorHex);

            if (aqi > 200) {
                const intensity = 2 + Math.sin(time * 10) * 1;
                this.light.material.emissiveIntensity = intensity;
                if (this.sensorPointLight) this.sensorPointLight.intensity = intensity;
            } else {
                this.light.material.emissiveIntensity = 2;
                if (this.sensorPointLight) this.sensorPointLight.intensity = 1;
            }
        }
    }
}
