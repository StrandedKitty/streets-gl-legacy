import mat4 from "../math/mat4";
import vec3 from "../math/vec3";

export default class Object3D {
	constructor(params) {
		this.children = [];
		this.parent = null;
		this.matrix = mat4.identity();
		this.matrixWorld = mat4.identity();
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
		this.matrix = mat4.identity();
		this.matrix = mat4.translate(this.matrix, this.position.x, this.position.y, this.position.z);
		this.matrix = mat4.scale(this.matrix, this.scale.x, this.scale.y, this.scale.z);
		this.matrix = mat4.xRotate(this.matrix, this.rotation.x);
		this.matrix = mat4.yRotate(this.matrix, this.rotation.y);
		this.matrix = mat4.zRotate(this.matrix, this.rotation.z);
		this.updateMatrixWorld();
		return this.matrix;
	}

	updateMatrixWorld() {
		if(this.parent) {
			this.matrixWorld = mat4.multiply(this.parent.updateMatrixWorld(), this.matrix);
		} else {
			this.matrixWorld = mat4.copy(this.matrix);
		}

		return this.matrixWorld;
	}

	add(object) {
		this.children.push(object);
		object.parent = this;
		object.updateMatrixWorld();
	}

	lookAt(target, isWorldPosition) {
		const position = isWorldPosition ? vec3.applyMatrix(target, this.parent.updateMatrixWorld()) : target;
		this.matrix = mat4.lookAt(this.position, target, {x: 0, y: 1, z: 0});
	}

	setPosition(x, y, z) {
		this.position.x = x;
		this.position.y = y;
		this.position.z = z;
	}
}