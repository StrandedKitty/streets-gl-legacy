import Object3D from "./Object3D";
import mat4 from "../math/mat4";

export default class PerspectiveCamera extends Object3D {
	constructor(params) {
		super();

		this.fov = params.fov;
		this.near = params.near;
		this.far = params.far;
		this.aspect = params.aspect || 1;

		this.projectionMatrix = mat4.perspective(this.fov, this.aspect, this.near, this.far);
		this.matrixWorldInverse = mat4.identity();
	}

	updateMatrixWorldInverse() {
		this.matrixWorldInverse = mat4.inverse(this.matrixWorld);
	}

	updateProjectionMatrix() {
		this.projectionMatrix = mat4.perspective(this.fov, this.aspect, this.near, this.far);
	}
}