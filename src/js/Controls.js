import {clamp, degrees2meters, lerp, toRad} from './Utils';
import mat4 from "./math/mat4";
import vec3 from "./math/vec3";
import vec2 from "./math/vec2";

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

		let position = degrees2meters(40.76038, -73.97885);

		this.target = {x: position.x, y: 0, z: position.z};
		this.distance = 1200;
		this.distanceTarget = this.distance;
		this.direction = {x: -1, y: -1, z: -1};

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
			self.distanceTarget = clamp(self.distanceTarget, 2, 2500);
		});
	}

	update(delta) {
		const speed = delta * (this.keys.fastMovement ? 1000 : 300);

		this.distance = lerp(this.distance, this.distanceTarget, 0.4);

		if(this.keys.movement.up) {
			let direction = {x: this.direction.x, y: this.direction.z};
			direction = vec2.normalize(direction);
			direction = vec2.multiplyScalar(direction, speed);
			this.target.x += direction.x;
			this.target.z += direction.y;
		}

		if(this.keys.movement.down) {
			let direction = {x: this.direction.x, y: this.direction.z};
			direction = vec2.normalize(direction);
			direction = vec2.multiplyScalar(direction, speed);
			this.target.x -= direction.x;
			this.target.z -= direction.y;
		}

		if(this.keys.movement.left) {
			let direction = {x: this.direction.z, y: -this.direction.x};
			direction = vec2.normalize(direction);
			direction = vec2.multiplyScalar(direction, speed);
			this.target.x += direction.x;
			this.target.z += direction.y;
		}

		if(this.keys.movement.right) {
			let direction = {x: this.direction.z, y: -this.direction.x};
			direction = vec2.normalize(direction);
			direction = vec2.multiplyScalar(direction, speed);
			this.target.x -= direction.x;
			this.target.z -= direction.y;
		}

		if(this.keys.rotation.left) {
			const axis = {x: 0, y: 1, z: 0};
			const angle = toRad(1.5);
			const rotationMatrix = mat4.axisRotation(axis, angle);
			this.direction = vec3.applyMatrix(this.direction, rotationMatrix);
		}

		if(this.keys.rotation.right) {
			const axis = {x: 0, y: 1, z: 0};
			const angle = toRad(-1.5);
			const rotationMatrix = mat4.axisRotation(axis, angle);
			this.direction = vec3.applyMatrix(this.direction, rotationMatrix);
		}

		if(this.keys.rotation.up) {
			const axis = {x: this.direction.z, y: 0, z: -this.direction.x};
			const angle = toRad(1);
			const rotationMatrix = mat4.axisRotation(axis, angle);
			this.direction = vec3.applyMatrix(this.direction, rotationMatrix);
		}

		if(this.keys.rotation.down) {
			const axis = {x: this.direction.z, y: 0, z: -this.direction.x};
			const angle = toRad(-1);
			const rotationMatrix = mat4.axisRotation(axis, angle);
			this.direction = vec3.applyMatrix(this.direction, rotationMatrix);
		}

		if(this.direction.y > 0) this.direction.y = 0;

		this.direction = vec3.normalize(this.direction);

		const cameraOffset = vec3.multiplyScalar(this.direction, -this.distance);
		const cameraPosition = vec3.add(this.target, cameraOffset);

		this.camera.setPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z);
		this.camera.lookAt(this.target, false);
	}
}