import vec3 from "../math/vec3";

export default class Plane {
	constructor(x, y, z, w) {
		this.x = x || 0;
		this.y = y || 1;
		this.z = z || 0;
		this.w = w || 0;
	}

	normalize() {
		const length = Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
		this.x /= length;
		this.y /= length;
		this.z /= length;
		this.w /= length;

		return this;
	}

	distanceToPoint(point) {
		const normal = new vec3(this.x, this.y, this.z);
		return vec3.dot(normal, point) + this.w;
	}
}
