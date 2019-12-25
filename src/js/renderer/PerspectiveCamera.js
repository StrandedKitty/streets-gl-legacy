import Object3D from "./Object3D";

export default class PerspectiveCamera extends Object3D {
	constructor(params) {
		super();

		this.fov = params.fov;
		this.near = params.near;
		this.far = params.far;
		this.aspect = params.aspect || 1;

		this.projectionMatrix = m4.perspective(this.fov, this.aspect, this.near, this.far);
		this.matrixWorldInverse = m4.identity();
	}

	updateMatrixWorldInverse() {
		this.matrixWorldInverse = vec.inverse(this.matrixWorld);
	}

	updateProjectionMatrix() {
		this.projectionMatrix = m4.perspective(this.fov, this.aspect, this.near, this.far);
	}
}