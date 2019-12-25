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

		let position = degrees2meters(49.8969, 36.2894);
		//position = degrees2meters(0, 0);

		this.target = {x: position.x, y: 0, z: position.z};
		this.distance = 100;
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
			self.distanceTarget = clamp(self.distanceTarget, 2, 1000);
		});
	}

	update(delta) {
		const speed = delta * (this.keys.fastMovement ? 1000 : 300);

		this.distance = lerp(this.distance, this.distanceTarget, 0.4);

		if(this.keys.movement.up) {
			let direction = [this.direction.x, this.direction.z];
			direction = vec.normalize(direction);
			direction = vec.multiplyScalar(direction, speed);
			this.target.x += direction[0];
			this.target.z += direction[1];
		}

		if(this.keys.movement.down) {
			let direction = [this.direction.x, this.direction.z];
			direction = vec.normalize(direction);
			direction = vec.multiplyScalar(direction, speed);
			this.target.x -= direction[0];
			this.target.z -= direction[1];
		}

		if(this.keys.movement.left) {
			let direction = [this.direction.z, -this.direction.x];
			direction = vec.normalize(direction);
			direction = vec.multiplyScalar(direction, speed);
			this.target.x += direction[0];
			this.target.z += direction[1];
		}

		if(this.keys.movement.right) {
			let direction = [this.direction.z, -this.direction.x];
			direction = vec.normalize(direction);
			direction = vec.multiplyScalar(direction, speed);
			this.target.x -= direction[0];
			this.target.z -= direction[1];
		}

		if(this.keys.rotation.left) {
			const axis = [0, 1, 0];
			const angle = toRad(1.5);
			const rotationMatrix = m4.axisRotation(axis, angle);
			const vector = vec.applyMatrix([this.direction.x, this.direction.y, this.direction.z], rotationMatrix);
			this.direction = {x: vector[0], y: vector[1], z: vector[2]};
		}

		if(this.keys.rotation.right) {
			const axis = [0, 1, 0];
			const angle = toRad(-1.5);
			const rotationMatrix = m4.axisRotation(axis, angle);
			const vector = vec.applyMatrix([this.direction.x, this.direction.y, this.direction.z], rotationMatrix);
			this.direction = {x: vector[0], y: vector[1], z: vector[2]};
		}

		if(this.keys.rotation.up) {
			const perp = [this.direction.z, -this.direction.x];
			const axis = [perp[0], 0, perp[1]];
			const angle = toRad(1);
			const rotationMatrix = m4.axisRotation(axis, angle);
			const vector = vec.applyMatrix([this.direction.x, this.direction.y, this.direction.z], rotationMatrix);
			this.direction = {x: vector[0], y: vector[1], z: vector[2]};
		}

		if(this.keys.rotation.down) {
			const perp = [this.direction.z, -this.direction.x];
			const axis = [perp[0], 0, perp[1]];
			const angle = toRad(-1);
			const rotationMatrix = m4.axisRotation(axis, angle);
			const vector = vec.applyMatrix([this.direction.x, this.direction.y, this.direction.z], rotationMatrix);
			this.direction = {x: vector[0], y: vector[1], z: vector[2]};
		}

		if(this.direction.y > 0) this.direction.y = 0;

		const normalizedDirection = vec.normalize([this.direction.x, this.direction.y, this.direction.z]);
		this.direction.x = normalizedDirection[0];
		this.direction.y = normalizedDirection[1];
		this.direction.z = normalizedDirection[2];

		const cameraOffset = vec.multiplyScalar([this.direction.x, this.direction.y, this.direction.z], -this.distance);
		const cameraPosition = vec.add([this.target.x, this.target.y, this.target.z], cameraOffset);

		this.camera.setPosition(cameraPosition);
		this.camera.lookAt([this.target.x, this.target.y, this.target.z], true);
	}
}