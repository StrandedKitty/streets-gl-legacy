import Object3D from "./Object3D";
import Attribute from "./Attribute";
import VAO from "./VAO";
import AABB from "../AABB";
import vec3 from "../math/vec3";

export default class Mesh extends Object3D {
	constructor(renderer, params) {
		super();

		this.renderer = renderer;
		this.gl = renderer.gl;

		this.attributes = {};
		this.materials = {};
		this.vaos = {};
		this.vertices = params.vertices || new Float32Array(0);

		this.addAttribute({
			name: 'position'
		});
		this.setAttributeData('position', this.vertices);
	}

	draw(material) {
		let vao = this.vaos[material.name];

		if(!vao) {
			vao = new VAO(this.renderer);
			this.vaos[material.name] = vao;

			this.materials[material.name] = {
				attributes: {}
			};

			vao.bind();

			for (const [name, {params, buffer}] of Object.entries(this.attributes)) {
				let attribute = new Attribute(this.renderer, params);

				attribute.setData(buffer);
				attribute.locate(material.program);

				this.materials[material.name].attributes[name] = attribute;
			}
		} else {
			vao.bind();
		}

		this.gl.drawArrays(this.gl[material.drawMode], 0, this.vertices.length / 3);
	}

	addAttribute(params) {
		this.attributes[params.name] = {
			params: params,
			buffer: null
		};
	}

	setAttributeData(attributeName, data) {
		this.attributes[attributeName].buffer = data;
	}

	updateAttribute(attributeName) {
		for(let materialName in this.materials) {
			let attribute = this.materials[materialName].attributes[attributeName];
			this.vaos[materialName].bind();
			attribute.setData(this.attributes[attributeName].buffer);
		}
	}

	setBoundingBox(min, max) {
		this.bbox = new AABB(min, max);
	}

	inCameraFrustum(camera) {
		if(this.bbox) {
			const planes = camera.frustumPlanes;

			for(let i = 0; i < 6; ++i) {
				const plane = planes[i];

				let viewSpaceAABB = this.bbox.toSpace(this.matrixWorld);

				const point = new vec3(
					plane.x > 0 ? viewSpaceAABB.max.x : viewSpaceAABB.min.x,
					plane.y > 0 ? viewSpaceAABB.max.y : viewSpaceAABB.min.y,
					plane.z > 0 ? viewSpaceAABB.max.z : viewSpaceAABB.min.z
				);

				if(plane.distanceToPoint(point) < 0) {
					return false;
				}
			}

			return true;
		} else throw new Error('Mesh has no bbox');
	}

	delete() {
		this.parent.remove(this);

		for(let i = 0; i < this.vaos.length; i++) {
			this.vaos[i].delete();
			this.vaos[i] = null;
		}

		for(let materialName in this.materials) {
			for (const attributeName in this.attributes) {
				this.materials[materialName].attributes[attributeName].delete();
				this.materials[materialName].attributes[attributeName] = null;
			}
		}
	}
}
