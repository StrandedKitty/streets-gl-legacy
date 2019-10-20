import {toRad} from './Utils';

export default class Frustum {
	constructor(fov, aspect, near, far) {
		this.fov = fov;
		this.aspect = aspect;
		this.near = near;
		this.far = far;

		this.vertices = {
			near: [],
			far: []
		};
	}

	getViewSpaceVertices() {
		this.nearPlaneY = this.near * Math.tan(toRad(this.fov / 2));
		this.nearPlaneX = this.aspect * this.nearPlaneY;

		this.farPlaneY = this.far * Math.tan(toRad(this.fov / 2));
		this.farPlaneX = this.aspect * this.farPlaneY;

		this.vertices.near.length = 0;
		this.vertices.far.length = 0;

		// 3 --- 0  vertices.near/far order
		// |     |
		// 2 --- 1

		this.vertices.near.push(
			new THREE.Vector3(this.nearPlaneX, this.nearPlaneY, -this.near),
			new THREE.Vector3(this.nearPlaneX, -this.nearPlaneY, -this.near),
			new THREE.Vector3(-this.nearPlaneX, -this.nearPlaneY, -this.near),
			new THREE.Vector3(-this.nearPlaneX, this.nearPlaneY, -this.near)
		);

		this.vertices.far.push(
			new THREE.Vector3(this.farPlaneX, this.farPlaneY, -this.far),
			new THREE.Vector3(this.farPlaneX, -this.farPlaneY, -this.far),
			new THREE.Vector3(-this.farPlaneX, -this.farPlaneY, -this.far),
			new THREE.Vector3(-this.farPlaneX, this.farPlaneY, -this.far)
		);

		return this.vertices;
	}

	toSpace(cameraMatrix) {
		let result = new Frustum(this.fov, this.aspect, this.near, this.far);
		let point = new THREE.Vector3();

		for(let i = 0; i < 4; i++) {
			point.set(this.vertices.near[i].x, this.vertices.near[i].y, this.vertices.near[i].z);
			point.applyMatrix4(cameraMatrix);
			result.vertices.near.push(new THREE.Vector3(point.x, point.y, point.z));

			point.set(this.vertices.far[i].x, this.vertices.far[i].y, this.vertices.far[i].z);
			point.applyMatrix4(cameraMatrix);
			result.vertices.far.push(new THREE.Vector3(point.x, point.y, point.z));
		}

		return result;
	}

	project() {
		let points = {
			near: [],
			far: []
		};

		let fv, ratio, intersection;

		if(this.vertices.far[1].y > 0 && this.vertices.far[2].y > 0) {
			return [];
		} else {
			fv = new THREE.Vector3();
			fv.subVectors(this.vertices.far[1], this.vertices.near[1]);
			ratio = this.vertices.near[1].y / fv.y;
			fv.multiplyScalar(ratio);
			intersection = new THREE.Vector3();
			intersection.subVectors(this.vertices.near[1], fv);
			points.near.push(intersection);

			fv = new THREE.Vector3();
			fv.subVectors(this.vertices.far[2], this.vertices.near[2]);
			ratio = this.vertices.near[2].y / fv.y;
			fv.multiplyScalar(ratio);
			intersection = new THREE.Vector3();
			intersection.subVectors(this.vertices.near[2], fv);
			points.near.push(intersection);

			if(this.vertices.far[3].y > 0 && this.vertices.far[0].y > 0) {
				fv = new THREE.Vector3();
				fv.subVectors(this.vertices.far[1], this.vertices.far[0]);
				ratio = this.vertices.far[0].y / fv.y;
				fv.multiplyScalar(ratio);
				intersection = new THREE.Vector3();
				intersection.subVectors(this.vertices.far[0], fv);
				points.far.push(intersection);

				fv = new THREE.Vector3();
				fv.subVectors(this.vertices.far[2], this.vertices.far[3]);
				ratio = this.vertices.far[3].y / fv.y;
				fv.multiplyScalar(ratio);
				intersection = new THREE.Vector3();
				intersection.subVectors(this.vertices.far[3], fv);
				points.far.push(intersection);
			} else {
				fv = new THREE.Vector3();
				fv.subVectors(this.vertices.far[0], this.vertices.near[0]);
				ratio = this.vertices.near[0].y / fv.y;
				fv.multiplyScalar(ratio);
				intersection = new THREE.Vector3();
				intersection.subVectors(this.vertices.near[0], fv);
				points.far.push(intersection);

				fv = new THREE.Vector3();
				fv.subVectors(this.vertices.far[3], this.vertices.near[3]);
				ratio = this.vertices.near[3].y / fv.y;
				fv.multiplyScalar(ratio);
				intersection = new THREE.Vector3();
				intersection.subVectors(this.vertices.near[3], fv);
				points.far.push(intersection);
			}
		}

		return points;
	}
}