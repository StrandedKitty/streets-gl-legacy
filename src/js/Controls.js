import {toRad, clamp, degrees2meters, lerp} from './Utils';

export default class Controls {
	constructor(camera) {
		this.camera = camera;

		this.keys = {
			movement: {
				up: false,
				down: false,
				left: false,
				right: false,
			},
			rotation: {
				up: false,
				down: false,
				left: false,
				right: false,
			},
			fastMovement: false
		};

		let position = degrees2meters(39.74822, -104.99633);

		this.target = new THREE.Vector3(position.x, 0, position.z);
		this.distance = 100;
		this.distanceTarget = this.distance;
		this.direction = new THREE.Vector3(-1, -1, -1);

		this.addEventListeners();
	}

	addEventListeners() {
		let self = this;

		document.addEventListener('keydown', function (event) {
			switch (event.code) {
				case 'KeyW':
					self.keys.movement.up = true;
					break;
				case 'KeyS':
					self.keys.movement.down = true;
					break;
				case 'KeyA':
					self.keys.movement.left = true;
					break;
				case 'KeyD':
					self.keys.movement.right = true;
					break;
				case 'KeyQ':
					self.keys.rotation.left = true;
					break;
				case 'KeyE':
					self.keys.rotation.right = true;
					break;
				case 'KeyR':
					self.keys.rotation.up = true;
					break;
				case 'KeyF':
					self.keys.rotation.down = true;
					break;
				case 'ShiftLeft':
					self.keys.fastMovement = true;
					break;
			}
		});

		document.addEventListener('keyup', function (event) {
			switch (event.code) {
				case 'KeyW':
					self.keys.movement.up = false;
					break;
				case 'KeyS':
					self.keys.movement.down = false;
					break;
				case 'KeyA':
					self.keys.movement.left = false;
					break;
				case 'KeyD':
					self.keys.movement.right = false;
					break;
				case 'KeyQ':
					self.keys.rotation.left = false;
					break;
				case 'KeyE':
					self.keys.rotation.right = false;
					break;
				case 'KeyR':
					self.keys.rotation.up = false;
					break;
				case 'KeyF':
					self.keys.rotation.down = false;
					break;
				case 'ShiftLeft':
					self.keys.fastMovement = false;
					break;
			}
		});

		window.addEventListener("wheel", function(e){
			self.distanceTarget += 0.2 * e.deltaY;
			self.distanceTarget = clamp(self.distanceTarget, 2, 1000);
		});
	}

	update(delta) {
		const speed = delta * (this.keys.fastMovement ? 1000 : 300);

		this.distance = lerp(this.distance, this.distanceTarget, 0.4);

		if(this.keys.movement.up) {
			let direction = new THREE.Vector2(this.direction.x, this.direction.z);
			direction.normalize();
			direction.multiplyScalar(speed);
			this.target.x += direction.x;
			this.target.z += direction.y;
		}

		if(this.keys.movement.down) {
			let direction = new THREE.Vector2(this.direction.x, this.direction.z);
			direction.normalize();
			direction.multiplyScalar(speed);
			this.target.x -= direction.x;
			this.target.z -= direction.y;
		}

		if(this.keys.movement.left) {
			let direction = new THREE.Vector2(this.direction.z, -this.direction.x);
			direction.normalize();
			direction.multiplyScalar(speed);
			this.target.x += direction.x;
			this.target.z += direction.y;
		}

		if(this.keys.movement.right) {
			let direction = new THREE.Vector2(this.direction.z, -this.direction.x);
			direction.normalize();
			direction.multiplyScalar(speed);
			this.target.x -= direction.x;
			this.target.z -= direction.y;
		}

		if(this.keys.rotation.left) {
			let axis = new THREE.Vector3(0, 1, 0);
			const angle = toRad(1.51);
			this.direction.applyAxisAngle(axis, angle);
		}

		if(this.keys.rotation.right) {
			let axis = new THREE.Vector3(0, 1, 0);
			const angle = toRad(-1.51);
			this.direction.applyAxisAngle(axis, angle);
		}

		if(this.keys.rotation.up) {
			let perp = new THREE.Vector2(this.direction.z, -this.direction.x);
			let axis = new THREE.Vector3(perp.x, 0, perp.y);
			const angle = toRad(1);
			this.direction.applyAxisAngle(axis, angle);
		}

		if(this.keys.rotation.down) {
			let perp = new THREE.Vector2(this.direction.z, -this.direction.x);
			let axis = new THREE.Vector3(perp.x, 0, perp.y);
			const angle = toRad(-1);
			this.direction.applyAxisAngle(axis, angle);
		}

		if(this.direction.y > 0) this.direction.y = 0;
		this.direction.normalize();

		let cameraPosition = new THREE.Vector3();
		let cameraOffset = this.direction.clone().multiplyScalar(-this.distance);
		cameraPosition.addVectors(this.target, cameraOffset);

		this.camera.position.copy(cameraPosition);
		this.camera.lookAt(this.target);
	}
}