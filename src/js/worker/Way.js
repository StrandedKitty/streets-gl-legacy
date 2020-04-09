import earcut from '../earcut';
import OSMDescriptor from "../OSMDescriptor";
import {toRad, mercatorScaleFactor} from "../Utils";
import vec3 from "../math/vec3";
import WayAABB from "./WayAABB";
import Ring from "./Ring";
import PyramidalRoof from "../roofs/PyramidalRoof";
import DomeRoof from "../roofs/DomeRoof";

export default class Way {
	constructor(params) {
		this.id = params.id;
		this.tags = params.tags || {};
		this.pivot = params.pivot;

		this.AABB = new WayAABB();
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

		this.scaleFactor = mercatorScaleFactor(toRad(this.pivot.lat));
		this.tileSize = 40075016.7 / (1 << 16);

		this.tileAABB = new WayAABB();
		this.tileAABB.set(0, 0, this.tileSize, this.tileSize);

		const descriptor = new OSMDescriptor(this.tags);
		this.properties = descriptor.properties;

		this.rings = [];

		this.geometry = {
			height: null,
			minHeight: null,
			roofColor: null,
			facadeColor: null,
			levels: null,
			material: null
		};

		this.geometryType = null;

		this.fillGeometry();
	}

	addRing(params) {
		const ring = new Ring({
			type: params.type,
			id: params.id,
			nodes: params.nodes,
			vertices: params.vertices,
			tags: params.tags,
			scaleFactor: this.scaleFactor,
			parent: this
		});

		this.rings.push(ring);

		if(this.properties.type === 'building') this.expandAABB(ring);
	}

	generateGeoJson() {
		this.geoJson = {
			type: 'MultiPolygon',
			coordinates: []
		};

		const inners = [];

		for(let i = 0; i < this.rings.length; i++) {
			const ring = this.rings[i];

			if(ring.type === 'inner' && ring.closed) inners.push(ring);
		}

		for(let i = 0; i < this.rings.length; i++) {
			const ring = this.rings[i];

			if(ring.type === 'outer' && ring.closed) {
				const item = [ring.vertices];

				for(let j = 0; j < inners.length; j++) {
					item.push(inners[j].vertices);
				}

				this.geoJson.coordinates.push(item);
			}
		}
	}

	render() {
		if(this.properties.type === 'building') {
			this.geometryType = 'building';

			if(this.geometry.roofHeight === 0 || this.geometry.roofShape === 'flat') {
				this.triangulateFootprint({
					color: this.geometry.roofColor,
					height: this.geometry.height,
					normal: 1
				});
			}

			if(this.geometry.minHeight > 0) {
				this.triangulateFootprint({
					color: this.geometry.roofColor,
					height: this.geometry.minHeight,
					normal: -1
				});
			}

			this.generateRoof();
		}

		if(this.properties.type === 'road') {
			this.geometryType = 'road';
		}

		for(let i = 0; i < this.rings.length; i++) {
			this.rings[i].render();
		}
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

		if(this.properties.roofHeight && this.properties.roofShape) {
			this.geometry.roofHeight = this.properties.roofHeight;
			this.geometry.roofShape = this.properties.roofShape || 'flat';
		} else {
			this.geometry.roofHeight = 0;
			this.geometry.roofShape = 'flat';
		}
		this.geometry.roofHeight *= this.scaleFactor;

		this.geometry.height -= this.geometry.roofHeight;

		if(this.geometry.minHeight > this.geometry.height) this.geometry.minHeight = 0;

		this.geometry.roofColor = this.properties.roofColor || [79, 89, 88];

		this.geometry.material = this.getMaterialData(this.properties.facadeMaterial);
		this.geometry.facadeColor = this.geometry.material.colored ? (this.properties.facadeColor || [239, 232, 219]) : [255, 255, 255];

		this.geometry.levels = this.properties.levels || Math.floor((this.geometry.height - this.geometry.minHeight) / 3.5);
		if(this.properties.minLevel) this.geometry.levels -= this.properties.minLevel;

		if(this.properties.layer) this.geometry.layer = this.properties.layer;
		else this.geometry.layer = 0;
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

	triangulateFootprint(params) {
		for(let i = 0; i < this.rings.length; i++) {
			const ring = this.rings[i];

			if(ring.type === 'outer') {
				const {vertices, holes} = this.getFlattenVertices(ring);
				let triangles = earcut(vertices, holes);

				if(params.normal === 1) triangles = triangles.reverse();

				for(let i = 0; i < triangles.length; i++) {
					this.mesh.vertices.push(vertices[triangles[i] * 2], params.height, vertices[triangles[i] * 2 + 1]);

					if(params.normal === 1) this.mesh.normals.push(0, 1, 0);
					else this.mesh.normals.push(0, -1, 0);

					this.mesh.colors.push(...params.color);
					this.mesh.uvs.push(0, 0);
					this.mesh.textures.push(0);
				}
			}
		}
	}

	generateRoof(params) {
		const roofHeight = this.geometry.roofHeight;
		const roofShape = this.geometry.roofShape;
		const buildingHeight = this.geometry.height;
		let roof;

		switch(roofShape) {
			case 'pyramidal':
				roof = new PyramidalRoof({
					way: this,
					height: roofHeight,
					buildingHeight: buildingHeight,
					color: this.geometry.roofColor
				});
				break;
			case 'dome':
				roof = new DomeRoof({
					way: this,
					height: roofHeight,
					buildingHeight: buildingHeight,
					color: this.geometry.roofColor
				});
				break;
		}

		if(roof && roof.mesh.vertices.length > 0) {
			const vertices = roof.mesh.vertices.length;

			this.mesh.vertices = this.mesh.vertices.concat(roof.mesh.vertices);
			this.mesh.normals = this.mesh.normals.concat(roof.mesh.normals);
			this.mesh.colors = this.mesh.colors.concat(roof.mesh.colors);
			this.mesh.uvs = this.mesh.uvs.concat(new Array(vertices / 3 * 2).fill(0));
			this.mesh.textures = this.mesh.textures.concat(new Array(vertices / 3).fill(0));
		}
	}

	getFlattenVertices(outerRing) {
		let vertices = outerRing.vertices.flat();
		const holes = [];

		for(let i = 0; i < this.rings.length; i++) {
			const ring = this.rings[i];

			if(ring.type === 'inner') {
				holes.push(vertices.length / 2);

				vertices = vertices.concat(ring.vertices.flat());
			}
		}

		return {vertices, holes};
	}

	expandAABB(ring) {
		for(let i = 0; i < ring.vertices.length - 1; i++) {
			const vertex = ring.vertices[i];

			this.AABB.includePoint(vertex[0], vertex[1]);
		}
	}

	calculateNormal(vA, vB, vC) {
		let cb = vec3.sub(vC, vB);
		let ab = vec3.sub(vA, vB);
		cb = vec3.cross(cb, ab);
		return vec3.normalize(cb);
	}
}
