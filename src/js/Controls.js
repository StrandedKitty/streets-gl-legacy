import {clamp, degrees2meters, lerp, meters2degress, normalizeAngle, sphericalToCartesian, toDeg, toRad} from './Utils';
import mat4 from "./math/mat4";
import vec3 from "./math/vec3";
import vec2 from "./math/vec2";
import URLData from "./URLData";

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

		this.pitch = toRad(45);
		this.yaw = toRad(0);

		const hash = URLData.getHash();

		if(hash.data) {
			const position = degrees2meters(hash.data[0], hash.data[1]);
			this.target.x = position.x;
			this.target.z = position.z;

			this.yaw = hash.data[2];
			this.pitch = hash.data[3];
			this.distance = hash.data[4];
			this.distanceTarget = hash.data[4];
		}

		this.tick = 0;

		this.addEventListeners();
	}

	latLon() {
		return meters2degress(this.target.x, this.target.z);
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
			const angle = toRad(1.5);
			this.yaw += angle;
		}

		if(this.keys.rotation.right) {
			const angle = toRad(-1.5);
			this.yaw += angle;
		}

		if(this.keys.rotation.up) {
			const angle = toRad(1);
			this.pitch += angle;
		}

		if(this.keys.rotation.down) {
			const angle = toRad(-1);
			this.pitch += angle;
		}

		this.pitch = clamp(this.pitch, toRad(0.1), toRad(89.9));
		this.yaw = normalizeAngle(this.yaw);

		const direction = sphericalToCartesian(this.yaw, -this.pitch);
		this.direction = vec3.multiplyScalar(direction, -1);

		this.direction = vec3.normalize(this.direction);

		const cameraOffset = vec3.multiplyScalar(this.direction, -this.distance);
		const cameraPosition = vec3.add(this.target, cameraOffset);

		this.camera.setPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z);
		this.camera.lookAt(this.target, false);

		const hash = URLData.getHash();

		if(hash.changedByUser && hash.data) {
			const position = degrees2meters(hash.data[0], hash.data[1]);
			this.target.x = position.x;
			this.target.z = position.z;

			this.yaw = hash.data[2];
			this.pitch = hash.data[3];
			this.distance = hash.data[4];
			this.distanceTarget = hash.data[4];
		}

		if(this.tick % 20 === 0) {
			const latLon = meters2degress(this.target.x, this.target.z);

			URLData.setHash([
				latLon.lat.toFixed(7),
				latLon.lon.toFixed(7),
				toDeg(this.yaw).toFixed(2),
				toDeg(this.pitch).toFixed(2),
				this.distance.toFixed(2)
			]);
		}

		this.tick++;
	}
}
