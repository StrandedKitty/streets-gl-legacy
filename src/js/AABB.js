import vec3 from "./math/vec3";

export default class AABB {
	constructor(min, max) {
		this.min = {x: min.x, y: min.y, z: min.z};
		this.max = {x: max.x, y: max.y, z: max.z};
	}

	toSpace(matrix) {
		const min = vec3.applyMatrix(this.min, matrix);
		const max = vec3.applyMatrix(this.max, matrix);

		return new AABB(min, max);
	}
}