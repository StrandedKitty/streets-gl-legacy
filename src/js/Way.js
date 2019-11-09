import earcut from './earcut'

export default class Way {
	constructor(id, nodes, vertices, tags) {
		this.id = id;
		this.nodes = nodes;
		this.vertices = vertices;
		this.tags = tags || {};
		this.mesh = {
			vertices: [],
			normals: []
		};

		this.triangulate();
	}

	triangulate() {
		let flattenVertices = this.flatten();
		let triangles = earcut(flattenVertices);

		for(let i = 0; i < triangles.length; i++) {
			this.mesh.vertices.push(flattenVertices[triangles[i] * 2], flattenVertices[triangles[i] * 2 + 1]);
			this.mesh.normals.push(0, 1, 0);
		}
	}

	flatten() {
		let result = [];

		for(let i = 0; i < this.vertices.length; i++) {
			result.push(this.vertices[i].x, this.vertices[i].z);
		}

		return result;
	}
}