import mat4 from "../math/mat4";
import vec3 from "../math/vec3";

export default class Object3D {
	constructor(params) {
		this.children = [];
		this.parent = null;
		this.data = {};
		this.matrix = mat4.identity();
		this.matrixWorld = mat4.identity();
		this.id = ~~(Math.random() * 1e9);
		this.matrixOverwrite = true;
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
		//this.updateMatrixWorld();
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

	updateMatrixWorldRecursively() {
		if(this.parent) {
			this.matrixWorld = mat4.multiply(this.parent.matrixWorld, this.matrix);
		} else {
			this.matrixWorld = mat4.copy(this.matrix);
		}

		for(let i = 0; i < this.children.length; ++i) {
			this.children[i].updateMatrixWorldRecursively();
		}
	}

	updateMatrixRecursively() {
		if(this.matrixOverwrite) this.updateMatrix();

		for(let i = 0; i < this.children.length; ++i) {
			this.children[i].updateMatrixRecursively();
		}
	}

	add(object) {
		this.children.push(object);
		object.parent = this;
		object.updateMatrixWorld();
	}

	remove(object) {
		for(let i = 0; i < this.children.length; i++) {
			if(this.children[i].id === object.id)  {
				this.children.splice(i, 1);
				break;
			}
		}
	}

	lookAt(target, isWorldPosition) {
		const targetPosition = isWorldPosition ? vec3.applyMatrix(target, this.updateMatrixWorld()) : target;
		this.matrix = mat4.lookAt(this.position, targetPosition, {x: 0, y: 1, z: 0});
	}

	setPosition(x, y, z) {
		this.position.x = x;
		this.position.y = y;
		this.position.z = z;
	}
}