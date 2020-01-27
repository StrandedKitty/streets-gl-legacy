import earcut from './earcut';
import OSMDescriptor from "./OSMDescriptor";
import {toRad, mercatorScaleFactor, toDeg} from "./Utils";
import vec3 from "./math/vec3";
import vec2 from "./math/vec2";

export default class Way {
	constructor(id, nodes, vertices, tags, pivot) {
		this.id = id;
		this.nodes = nodes;
		this.vertices = vertices;
		this.tags = tags || {};
		this.pivot = pivot;
		this.visible = true;
		this.mesh = {
			vertices: [],
			normals: [],
			colors: [],
			uvs: [],
			textures: []
		};
		this.instances = {
			trees: []
		};

		this.heightFactor = mercatorScaleFactor(toRad(this.pivot.lat));

		this.descriptor = new OSMDescriptor(this.tags);
		this.properties = this.descriptor.properties;

		this.closed = this.isClosed();
		if(this.closed) this.fixDirection();
	}

	render() {
		if(this.visible) {
			if(this.closed && this.properties.type === 'building') {
				this.triangulateFootprint(false);
				this.triangulateWalls();
			}

			if(this.properties.type === 'tree_row') {
				this.length = this.calculateLength();
				let points = this.distributeNodes(10);
				this.instances.trees.push(...points);
			}

			if(this.properties.type === 'farmland') {
				this.triangulateFootprint(true);
			}

			if(this.properties.type === 'road') {
				this.createPath();
			}
		}
	}

	triangulateFootprint(isFlat) {
		let flattenVertices = this.flatten();
		let triangles = earcut(flattenVertices).reverse();
		let height, color;

		if(isFlat) {
			height = 1;
			color = [63, 167, 37];
		} else {
			if(this.properties.height) {
				height = this.properties.height;
			} else if(this.properties.levels) {
				height = this.properties.levels * 3.5;
			} else {
				height = 10;
			}
			height *= this.heightFactor;
			color = this.properties.roofColor || [79, 89, 88];
		}

		for(let i = 0; i < triangles.length; i++) {
			this.mesh.vertices.push(flattenVertices[triangles[i] * 2], height, flattenVertices[triangles[i] * 2 + 1]);
			this.mesh.normals.push(0, 1, 0);
			this.mesh.colors.push(...color);
			this.mesh.uvs.push(0, 0);
			this.mesh.textures.push(0);
		}
	}

	triangulateWalls() {
		let facadeColor = this.properties.facadeColor || [231, 216, 185];
		let materialId = this.getMaterialId(this.properties.facadeMaterial);
		let height, minHeight, levels;

		if(this.properties.height) {
			height = this.properties.height;
		} else if(this.properties.levels) {
			height = this.properties.levels * 3.5;
		} else {
			height = 10;
		}

		if(this.properties.minHeight) {
			minHeight = this.properties.minHeight;
		} else if(this.properties.minLevel) {
			minHeight = this.properties.minLevel * 3.5;
		} else {
			minHeight = 0;
		}

		if(minHeight > height) minHeight = 0;

		levels = this.properties.levels || Math.floor((height - minHeight) / 3.5);
		if(this.properties.minLevel) levels -= this.properties.minLevel;

		height *= this.heightFactor;
		minHeight *= this.heightFactor;

		for(let i = 0; i < this.vertices.length; i++) {
			let vertex = this.vertices[i];
			let nextVertex = this.vertices[i + 1] || this.vertices[0];

			this.mesh.vertices.push(nextVertex.x, minHeight, nextVertex.z);
			this.mesh.vertices.push(vertex.x, height, vertex.z);
			this.mesh.vertices.push(vertex.x, minHeight, vertex.z);

			this.mesh.vertices.push(nextVertex.x, minHeight, nextVertex.z);
			this.mesh.vertices.push(nextVertex.x, height, nextVertex.z);
			this.mesh.vertices.push(vertex.x, height, vertex.z);

			const segmentWidth = Math.sqrt((nextVertex.x - vertex.x) ** 2 + (nextVertex.z - vertex.z) ** 2);
			const repeats = Math.floor(segmentWidth / 4);

			this.mesh.uvs.push(repeats, levels);
			this.mesh.uvs.push(0, 0);
			this.mesh.uvs.push(0, levels);

			this.mesh.uvs.push(repeats, levels);
			this.mesh.uvs.push(repeats, 0);
			this.mesh.uvs.push(0, 0);

			const normal = this.calculateNormal(
				new vec3(nextVertex.x, minHeight, nextVertex.z),
				new vec3(vertex.x, height, vertex.z),
				new vec3(vertex.x, minHeight, vertex.z)
			);

			for(let j = 0; j < 6; j++) {
				this.mesh.normals.push(normal.x, normal.y, normal.z);
				this.mesh.colors.push(...facadeColor);
				this.mesh.textures.push(materialId);
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
		const clockwise = this.isClockwise();

		if(!clockwise) {
			this.nodes.reverse();
			this.vertices.reverse();
		}
	}

	calculateLength() {
		let length = 0;

		for(let i = 0; i < this.vertices.length - 1; i++) {
			let point1 = this.vertices[i];
			let point2 = this.vertices[i + 1];
			length += Math.sqrt((point2.x - point1.x) ** 2 + (point2.z - point1.z) ** 2);
		}

		return length;
	}

	distributeNodes(interval) {
		let number = Math.floor(this.length / interval);
		let points = [];

		if(number > 1) {
			let distance = this.length / (number - 1);
			let targetNode = 0;
			let availableDistance = 0;
			let edge = [];
			let edgeLength = 0;
			let cProgress = 0;
			let nodeProgress = 0;

			points.push(this.vertices[0].x, this.vertices[0].z);

			for(let i = 0; i < number - 1; i++) {
				while(availableDistance < distance && targetNode < this.vertices.length - 1) {
					edge = [
						this.vertices[targetNode],
						this.vertices[targetNode + 1]
					];

					edgeLength = Math.sqrt((edge[1].x - edge[0].x) ** 2 + (edge[1].z - edge[0].z) ** 2);
					availableDistance += edgeLength;
					nodeProgress += edgeLength;

					targetNode++;
				}

				availableDistance -= distance;
				cProgress += distance;

				let vLength = (nodeProgress - cProgress) / edgeLength;

				let vector = {
					x: edge[1].x - edge[0].x,
					z: edge[1].z - edge[0].z
				};
				let point = {
					x: edge[1].x - vector.x * vLength,
					z: edge[1].z - vector.z * vLength
				};

				points.push(point.x, point.z);
			}
		}

		return points;
	}

	createPath() {
		const width = 6;
		const height = 1;
		const color = [50, 50, 50];

		const physicalVertices = this.closed ? this.vertices.length - 1 : this.vertices.length;

		const points = [];

		for(let i = 0; i < physicalVertices; i++) {
			let a, b, c;

			a = new vec2(this.vertices[i].x, this.vertices[i].z);

			if(this.vertices[i + 1]) b = new vec2(this.vertices[i + 1].x, this.vertices[i + 1].z);
			if(this.vertices[i - 1]) c = new vec2(this.vertices[i - 1].x, this.vertices[i - 1].z);

			if(c === undefined) {
				const dir = vec2.normalize(vec2.sub(b, a));

				let p = new vec2(dir.y, -dir.x);
				p = vec2.multiplyScalar(p, width / 2);

				points.push(
					vec2.sub(a, p),
					vec2.add(a, p)
				);

				continue;
			} else if(b === undefined) {
				const dir = vec2.normalize(vec2.sub(a, c));

				let p = new vec2(dir.y, -dir.x);
				p = vec2.multiplyScalar(p, width / 2);

				points.push(
					vec2.sub(a, p),
					vec2.add(a, p)
				);

				continue;
			}

			let dirB = vec2.normalize(vec2.sub(b, a));
			let dirC = vec2.normalize(vec2.sub(c, a));

			let pointB = vec2.add(a, dirB);
			let pointC = vec2.add(a, dirC);

			let dir = vec2.normalize(vec2.sub(pointB, pointC));
			let p = new vec2(dir.y, -dir.x);

			let angle = Math.acos(vec2.dot(dirB, dirC));
			let widthFactor = 1 / Math.sin(angle / 2);

			p = vec2.multiplyScalar(p, width / 2 * widthFactor);

			points.push(
				vec2.sub(a, p),
				vec2.add(a, p)
			);
		}

		const segments = this.closed ? physicalVertices : physicalVertices - 1;

		for(let i = 0; i < segments; i++) {
			const vertices = new Array(4);
			vertices[0] = points[i * 2];
			vertices[1] = points[i * 2 + 1];

			if(points[i * 2 + 2]) {
				vertices[2] = points[i * 2 + 2];
				vertices[3] = points[i * 2 + 3];
			} else {
				vertices[2] = points[0];
				vertices[3] = points[1];
			}

			// geometry

			this.mesh.vertices.push(
				vertices[0].x, height, vertices[0].y,
				vertices[2].x, height, vertices[2].y,
				vertices[1].x, height, vertices[1].y,

				vertices[1].x, height, vertices[1].y,
				vertices[2].x, height, vertices[2].y,
				vertices[3].x, height, vertices[3].y
			);

			this.mesh.uvs.push(
				0, 0,
				0, 0,
				0, 0,

				0, 0,
				0, 0,
				0, 0
			);

			this.mesh.normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
			this.mesh.colors.push(...color, ...color, ...color, ...color, ...color, ...color);
			this.mesh.textures.push(0, 0, 0, 0, 0, 0);
		}
	}

	calculateNormal(vA, vB, vC) {
		let cb = vec3.sub(vC, vB);
		let ab = vec3.sub(vA, vB);
		cb = vec3.cross(cb, ab);
		return vec3.normalize(cb);
	}

	getMaterialId(material) {
		switch (material) {
			default:
				return 1;
			case 'glass':
				return 2;
			case 'mirror':
				return 2;
		}
	}
}
