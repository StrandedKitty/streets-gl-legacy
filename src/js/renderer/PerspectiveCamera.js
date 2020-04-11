import Object3D from "../core/Object3D";
import mat4 from "../math/mat4";
import Frustum from "../core/Frustum";
import {toRad} from "../Utils";

export default class PerspectiveCamera extends Object3D {
	constructor(params) {
		super();

		this.fov = params.fov;
		this.near = params.near;
		this.far = params.far;
		this.aspect = params.aspect || 1;

		this.projectionMatrix = mat4.perspective(toRad(this.fov), this.aspect, this.near, this.far);
		this.matrixWorldInverse = mat4.identity();
		this.matrixOverwrite = false;
		this.frustumPlanes = null;
	}

	updateMatrixWorldInverse() {
		this.matrixWorldInverse = mat4.inverse(this.matrixWorld);
	}

	updateProjectionMatrix() {
		this.projectionMatrix = mat4.perspective(toRad(this.fov), this.aspect, this.near, this.far);
	}

	updateFrustum() {
		this.frustumPlanes = Frustum.getPlanes(mat4.multiply(this.projectionMatrix, this.matrixWorldInverse));
	}
}
