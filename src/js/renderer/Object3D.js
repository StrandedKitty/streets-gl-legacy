export default class Object3D {
	constructor(params) {
		this.children = [];
		this.parent = null;
		this.matrix = m4.identity();
		this.matrixWorld = m4.identity();
		this.position = {
			x: 0,
			y: 0,
			z: 0
		};
		this.rotation = {
			x: 0,
			y: 0,
			z: 0
		};
		this.scale = {
			x: 1,
			y: 1,
			z: 1
		};
	}

	updateMatrix() {
		this.matrix = m4.identity();
		this.matrix = m4.translate(this.matrix, this.position.x, this.position.y, this.position.z);
		this.matrix = m4.scale(this.matrix, this.scale.x, this.scale.y, this.scale.z);
		this.matrix = m4.xRotate(this.matrix, this.rotation.x);
		this.matrix = m4.yRotate(this.matrix, this.rotation.y);
		this.matrix = m4.zRotate(this.matrix, this.rotation.z);
		this.updateMatrixWorld();
		return this.matrix;
	}

	updateMatrixWorld() {
		if(this.parent) {
			this.matrixWorld = m4.multiply(this.parent.updateMatrixWorld(), this.matrix);
		} else {
			this.matrixWorld = m4.copy(this.matrix);
		}

		return this.matrixWorld;
	}

	add(object) {
		this.children.push(object);
		object.parent = this;
		object.updateMatrixWorld();
	}

	lookAt(target, isWorldPosition) {
		const position = isWorldPosition ? vec.applyMatrix(target, this.parent.updateMatrixWorld()) : target;
		this.matrix = m4.lookAt(this.positionArray, target, [0, 1, 0]);
	}

	setPosition(pos) {
		this.position.x = pos[0];
		this.position.y = pos[1];
		this.position.z = pos[2];
	}

	get positionArray() {
		return [this.position.x, this.position.y, this.position.z];
	}
}