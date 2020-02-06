import earcut from './earcut';
import OSMDescriptor from "./OSMDescriptor";
import {toRad, mercatorScaleFactor, toDeg} from "./Utils";
import vec3 from "./math/vec3";
import vec2 from "./math/vec2";
import WayAABB from "./WayAABB";

export default class Way {
	constructor(id, nodes, vertices, tags, pivot) {
		this.id = id;
		this.nodes = nodes;
		this.vertices = vertices;
		this.tags = tags || {};
		this.pivot = pivot;
		this.visible = true;
		this.AABB = new WayAABB();
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

		this.scaleFactor = mercatorScaleFactor(toRad(this.pivot.lat));
		this.tileSize = 40075016.7 / (1 << 16);

		this.descriptor = new OSMDescriptor(this.tags);
		this.properties = this.descriptor.properties;

		this.closed = this.isClosed();
		if(this.closed) this.fixDirection();

		if(this.closed && this.properties.type === 'building') {
			this.generateAABB();
		}

		this.geometry = {
			height: null,
			minHeight: null,
			roofColor: null,
			facadeColor: null,
			levels: null,
			material: null
		};

		this.fillGeometry();
	}

	fillGeometry() {
		if(this.properties.height) {
			this.geometry.height = this.properties.height;
		} else if(this.properties.levels) {
			this.geometry.height = this.properties.levels * 3.5;
		} else {
			this.geometry.height = 4;
		}
		this.geometry.height *= this.scaleFactor;

		if(this.properties.minHeight) {
			this.geometry.minHeight = this.properties.minHeight;
		} else if(this.properties.minLevel) {
			this.geometry.minHeight = this.properties.minLevel * 3.5;
		} else {
			this.geometry.minHeight = 0;
		}
		this.geometry.minHeight *= this.scaleFactor;

		if(this.geometry.minHeight > this.geometry.height) this.geometry.minHeight = 0;

		this.geometry.roofColor = this.properties.roofColor || [79, 89, 88];

		this.geometry.material = this.getMaterialData(this.properties.facadeMaterial);
		this.geometry.facadeColor = this.geometry.material.colored ? (this.properties.facadeColor || [231, 216, 185]) : [255, 255, 255];

		this.geometry.levels = this.properties.levels || Math.floor((this.geometry.height - this.geometry.minHeight) / 3.5);
		if(this.properties.minLevel) this.geometry.levels -= this.properties.minLevel;
	}

	render() {
		if(this.visible) {
			if(this.closed && this.properties.type === 'building') {
				this.triangulateFootprint({
					color: this.geometry.roofColor,
					height: this.geometry.height
				});

				this.generateWallSegments(25, 4);
				this.triangulateWalls();
			}

			if(this.properties.type === 'tree_row') {
				this.length = this.calculateLength();

				let points = this.distributeNodes({
					interval: 8,
					skipOutside: true
				});

				this.instances.trees.push(...points);
			}

			if(this.properties.type === 'farmland') {
				this.triangulateFootprint({
					color: [63, 167, 37],
					height: 1
				});
			}

			if(this.properties.type === 'road') {
				this.createPath({
					width: this.properties.roadWidth,
					height: 1,
					color: [50, 50, 50]
				});
			}
		}
	}

	triangulateFootprint(params) {
		let flattenVertices = this.flatten();
		let triangles = earcut(flattenVertices).reverse();

		for(let i = 0; i < triangles.length; i++) {
			this.mesh.vertices.push(flattenVertices[triangles[i] * 2], params.height, flattenVertices[triangles[i] * 2 + 1]);
			this.mesh.normals.push(0, 1, 0);
			this.mesh.colors.push(...params.color);
			this.mesh.uvs.push(0, 0);
			this.mesh.textures.push(0);
		}
	}

	triangulateWalls() {
		const height = this.geometry.height;
		const minHeight = this.geometry.minHeight;
		const levels = this.geometry.levels;
		const facadeColor = this.geometry.facadeColor;
		const material = this.geometry.material;

		for(let i = 0; i < this.vertices.length - 1; i++) {
			let vertex = this.vertices[i];
			let nextVertex = this.vertices[i + 1];

			this.mesh.vertices.push(nextVertex.x, minHeight, nextVertex.z);
			this.mesh.vertices.push(vertex.x, height, vertex.z);
			this.mesh.vertices.push(vertex.x, minHeight, vertex.z);

			this.mesh.vertices.push(nextVertex.x, minHeight, nextVertex.z);
			this.mesh.vertices.push(nextVertex.x, height, nextVertex.z);
			this.mesh.vertices.push(vertex.x, height, vertex.z);

			let segmentUvStart = this.wallSegmentUvs[i][0];
			let segmentUvEnd = this.wallSegmentUvs[i][1];

			this.mesh.uvs.push(segmentUvEnd, levels);
			this.mesh.uvs.push(segmentUvStart, 0);
			this.mesh.uvs.push(segmentUvStart, levels);

			this.mesh.uvs.push(segmentUvEnd, levels);
			this.mesh.uvs.push(segmentUvEnd, 0);
			this.mesh.uvs.push(segmentUvStart, 0);

			const normal = this.calculateNormal(
				new vec3(nextVertex.x, minHeight, nextVertex.z),
				new vec3(vertex.x, height, vertex.z),
				new vec3(vertex.x, minHeight, vertex.z)
			);

			for(let j = 0; j < 6; j++) {
				this.mesh.normals.push(normal.x, normal.y, normal.z);
				this.mesh.colors.push(...facadeColor);
				this.mesh.textures.push(material.id);
			}
		}
	}

	generateWallSegments(angle, windowWidth) {
		angle = Math.cos(toRad(angle));
		let uvs = [];
		let segments = [];
		let segmentsLengths = [];
		let currentSegment = -1;

		for(let i = 0; i < this.vertices.length - 1; i++) {
			let vertex = new vec2(this.vertices[i].x, this.vertices[i].z);
			let nextVertex = new vec2(this.vertices[i + 1].x, this.vertices[i + 1].z);

			let segmentVector = vec2.sub(nextVertex, vertex);
			let length = Math.sqrt(segmentVector.x ** 2 + segmentVector.y ** 2);

			if(i > 0) {
				segmentVector = vec2.normalize(segmentVector);

				let prevVertex = new vec2(this.vertices[i - 1].x, this.vertices[i - 1].z);
				let prevSegmentVector = vec2.normalize(vec2.sub(vertex, prevVertex));

				let dot = vec2.dot(segmentVector, prevSegmentVector);

				if(dot > angle) {
					++segments[currentSegment][1];
				} else {
					segments.push([i, i + 1]);
					segmentsLengths.push(0);
					++currentSegment;
				}
			} else {
				segments.push([0, 1]);
				segmentsLengths.push(0);
				++currentSegment;
			}

			segmentsLengths[currentSegment] += length;
		}

		let segmentFactors = [];

		for(let i = 0; i < segmentsLengths.length; i++) {
			segmentFactors[i] = Math.floor(segmentsLengths[i] / windowWidth);
		}

		currentSegment = 0;
		let currentSegmentPosition = 0;

		for(let i = 0; i < this.vertices.length - 1; i++) {
			let vertex = new vec2(this.vertices[i].x, this.vertices[i].z);
			let nextVertex = new vec2(this.vertices[i + 1].x, this.vertices[i + 1].z);

			let segmentVector = vec2.sub(nextVertex, vertex);
			let length = Math.sqrt(segmentVector.x ** 2 + segmentVector.y ** 2);

			let uvPosition = currentSegmentPosition + length / segmentsLengths[currentSegment];
			let segmentFactor = segmentFactors[currentSegment];

			uvs.push([currentSegmentPosition * segmentFactor, uvPosition * segmentFactor]);

			currentSegmentPosition = uvPosition;

			if(segments[currentSegment][1] === i + 1) currentSegment++;
		}

		this.wallSegmentUvs = uvs;
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

	generateAABB() {
		for(let i = 0; i < this.vertices.length - 1; i++) {
			let vertex = this.vertices[i];

			this.AABB.includePoint({x: vertex.x, y: vertex.z});
		}
	}

	distributeNodes(params) {
		let number = Math.floor(this.length / params.interval);
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

				if(params.skipOutside) {
					if(point.x >= 0 && point.x < this.tileSize && point.z >= 0 && point.z < this.tileSize) {
						points.push(point.x, point.z);
					}
				} else {
					points.push(point.x, point.z);
				}
			}
		}

		return points;
	}

	createPath(params) {
		const width = params.width;
		const height = params.height;
		const color = params.color;

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

	getMaterialData(material) {
		switch (material) {
			default:
				return {id: 1, colored: true};
			case 'glass':
				return {id: 2, colored: true};
			case 'mirror':
				return {id: 3, colored: true};
			case 'brick':
				return {id: 4, colored: false};
			case 'wood':
				return {id: 5, colored: true};
		}
	}
}
