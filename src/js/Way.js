import earcut from './earcut';
import OSMDescriptor from "./OSMDescriptor";

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
		this.instances = {
			trees: []
		};

		this.descriptor = new OSMDescriptor(this.tags);
		this.properties = this.descriptor.properties;
		//self.postMessage({code: 'info', info: this.descriptor.properties});

		this.closed = this.isClosed();

		this.fixDirection();

		if(this.closed && this.properties.type === 'building') {
			this.triangulate();
		}
	}

	triangulate() {
		let flattenVertices = this.flatten();
		let triangles = earcut(flattenVertices).reverse();
		let height = this.properties.height || 10;

		for(let i = 0; i < triangles.length; i++) {
			this.mesh.vertices.push(flattenVertices[triangles[i] * 2], height, flattenVertices[triangles[i] * 2 + 1]);
			this.mesh.normals.push(0, 1, 0);
		}

		for(let i = 0; i < this.vertices.length; i++) {
			let vertex = this.vertices[i];
			let nextVertex = this.vertices[i + 1] || this.vertices[0];

			this.mesh.vertices.push(nextVertex.x, 0, nextVertex.z);
			this.mesh.vertices.push(vertex.x, height, vertex.z);
			this.mesh.vertices.push(vertex.x, 0, vertex.z);

			this.mesh.vertices.push(nextVertex.x, 0, nextVertex.z);
			this.mesh.vertices.push(nextVertex.x, height, nextVertex.z);
			this.mesh.vertices.push(vertex.x, height, vertex.z);

			for(let j = 0; j < 6; j++) {
				this.mesh.normals.push(0, 1, 0);
			}
		}
	}

	flatten() {
		let result = [];

		for(let i = 0; i < this.vertices.length; i++) {
			result.push(this.vertices[i].x, this.vertices[i].z);
		}

		return result;
	}

	isClosed() {
		return this.nodes[0] === this.nodes[this.nodes.length - 1];
	}

	isClockwise() {
		let sum = 0;

		for(let i = 0; i < this.nodes.length; i++) {
			let point1 = this.vertices[i];
			let point2 = this.vertices[i+1] || this.vertices[0];
			sum += (point2.x - point1.x) * (point2.z + point1.z);
		}

		return sum > 0
	}

	fixDirection() {
		if(this.closed) {
			const clockwise = this.isClockwise();

			if(!clockwise) {
				this.nodes.reverse();
				this.vertices.reverse();
			}
		}
	}
}