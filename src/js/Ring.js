import vec2 from "./math/vec2";
import vec3 from "./math/vec3";
import {toRad} from "./Utils";

export default class Ring {
	constructor(params) {
		this.type = params.type;

		if(this.type !== 'inner' && this.type !== 'outer') this.type = null;

		this.parent = params.parent;
		this.id = params.id;
		this.nodes = params.nodes;
		this.vertices = params.vertices;
		this.scaleFactor = params.scaleFactor;

		this.closed = this.isClosed();
		this.fixDirection();

		this.geometry = this.parent.geometry;
	}

	render() {
		if(this.parent.properties.type === 'building') {
			this.generateWallSegments(25, 4);
			this.triangulateWalls();
		}

		if(this.parent.properties.type === 'tree_row') {
			this.length = this.calculateLength();

			let points = this.distributeNodes({
				interval: 8,
				skipOutside: true,
				random: 1.5
			});

			this.parent.instances.trees.push(...points);
		}

		if(this.parent.properties.type === 'road') {
			this.createPath({
				width: this.parent.properties.roadWidth,
				height: 1,
				color: [50, 50, 50]
			});
		}
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

		return sum > 0;
	}

	fixDirection() {
		if((!this.isClockwise() && this.type === 'outer') || (this.isClockwise() && this.type === 'inner')) {
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

	triangulateWalls() {
		const height = this.geometry.height;
		const minHeight = this.geometry.minHeight;
		const levels = this.geometry.levels;
		const facadeColor = this.geometry.facadeColor;
		const material = this.geometry.material;

		for(let i = 0; i < this.vertices.length - 1; i++) {
			let vertex = this.vertices[i];
			let nextVertex = this.vertices[i + 1];

			this.parent.mesh.vertices.push(nextVertex.x, minHeight, nextVertex.z);
			this.parent.mesh.vertices.push(vertex.x, height, vertex.z);
			this.parent.mesh.vertices.push(vertex.x, minHeight, vertex.z);

			this.parent.mesh.vertices.push(nextVertex.x, minHeight, nextVertex.z);
			this.parent.mesh.vertices.push(nextVertex.x, height, nextVertex.z);
			this.parent.mesh.vertices.push(vertex.x, height, vertex.z);

			let segmentUvStart = this.wallSegmentUvs[i][0];
			let segmentUvEnd = this.wallSegmentUvs[i][1];

			this.parent.mesh.uvs.push(segmentUvEnd, levels);
			this.parent.mesh.uvs.push(segmentUvStart, 0);
			this.parent.mesh.uvs.push(segmentUvStart, levels);

			this.parent.mesh.uvs.push(segmentUvEnd, levels);
			this.parent.mesh.uvs.push(segmentUvEnd, 0);
			this.parent.mesh.uvs.push(segmentUvStart, 0);

			const normal = this.calculateNormal(
				new vec3(nextVertex.x, minHeight, nextVertex.z),
				new vec3(vertex.x, height, vertex.z),
				new vec3(vertex.x, minHeight, vertex.z)
			);

			for(let j = 0; j < 6; j++) {
				this.parent.mesh.normals.push(normal.x, normal.y, normal.z);
				this.parent.mesh.colors.push(...facadeColor);
				this.parent.mesh.textures.push(material.id);
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
				let transformedPoint = {
					x: point.x,
					z: point.z
				};

				if(params.random > 0) {
					transformedPoint.x += (Math.random() - 0.5) * params.random;
					transformedPoint.z += (Math.random() - 0.5) * params.random;
				}

				if(params.skipOutside) {
					if(point.x >= 0 && point.x < this.tileSize && point.z >= 0 && point.z < this.tileSize) {
						points.push(transformedPoint.x, transformedPoint.z);
					}
				} else {
					points.push(transformedPoint.x, transformedPoint.z);
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

			this.parent.mesh.vertices.push(
				vertices[0].x, height, vertices[0].y,
				vertices[2].x, height, vertices[2].y,
				vertices[1].x, height, vertices[1].y,

				vertices[1].x, height, vertices[1].y,
				vertices[2].x, height, vertices[2].y,
				vertices[3].x, height, vertices[3].y
			);

			this.parent.mesh.uvs.push(
				0, 0,
				0, 0,
				0, 0,

				0, 0,
				0, 0,
				0, 0
			);

			this.parent.mesh.normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
			this.parent.mesh.colors.push(...color, ...color, ...color, ...color, ...color, ...color);
			this.parent.mesh.textures.push(0, 0, 0, 0, 0, 0);
		}
	}

	calculateNormal(vA, vB, vC) {
		let cb = vec3.sub(vC, vB);
		let ab = vec3.sub(vA, vB);
		cb = vec3.cross(cb, ab);
		return vec3.normalize(cb);
	}
}