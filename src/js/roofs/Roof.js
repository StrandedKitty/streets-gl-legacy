import vec3 from "../math/vec3";

export default class Roof {
	constructor({way, height, buildingHeight, color}) {
		this.way = way;
		this.height = height;
		this.buildingHeight = buildingHeight;
		this.color = color;
		this.mesh = {
			vertices: [],
			normals: [],
			colors: []
		};
	}

	flatten() {
		this.mesh.vertices = this.mesh.vertices.flat();
		this.mesh.normals = this.mesh.normals.flat();
	}
}
