import Object3D from "./Object3D";
import Attribute from "./Attribute";
import VAO from "./VAO";

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

		this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertices.length / 3);
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
			attribute.setData(attribute.data);
		}
	}
}