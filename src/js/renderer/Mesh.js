import Object3D from "./Object3D";

export default class Mesh extends Object3D {
	constructor(renderer, params) {
		super();

		this.renderer = renderer;
		this.gl = renderer.gl;

		this.attributes = {};
		this.vao = renderer.createVAO();
		this.vertices = params.vertices || new Float32Array(0);

		this.addAttribute({
			name: 'position'
		}).setData(this.vertices);
	}

	draw(material) {
		for (const [name, attribute] of Object.entries(this.attributes)) {
			attribute.locate(material.program);
		}

		this.vao.bind();
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
	}

	addAttribute(params) {
		params.vao = this.vao;
		this.attributes[params.name] = this.renderer.createAttribute(params);
		return this.attributes[params.name];
	}
}