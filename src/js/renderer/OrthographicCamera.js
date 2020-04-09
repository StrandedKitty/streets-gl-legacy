import Object3D from "../core/Object3D";
import mat4 from "../math/mat4";
import Frustum from "../Frustum";

export default class OrthographicCamera extends Object3D {
	constructor(params) {
		super();

		this.left = params.left || -1;
		this.right = params.right || 1;
		this.bottom = params.bottom || -1;
		this.top = params.top || 1;
		this.near = params.near || 0.1;
		this.far = params.far || 1000;

		this.projectionMatrix = mat4.orthographic(this.left, this.right, this.bottom, this.top, this.near, this.far);
		this.matrixWorldInverse = mat4.identity();
		this.matrixOverwrite = false;
		this.frustumPlanes = null;
	}

	updateMatrixWorldInverse() {
		this.matrixWorldInverse = mat4.inverse(this.matrixWorld);
	}

	updateProjectionMatrix() {
		this.projectionMatrix = mat4.orthographic(this.left, this.right, this.bottom, this.top, this.near, this.far);
	}

	updateFrustum() {
		this.frustumPlanes = Frustum.getPlanes(mat4.multiply(this.projectionMatrix, this.matrixWorldInverse));
	}
}
