import Program from "./Program";
import Material from "./Material";
import Mesh from "./Mesh";
import WebGLCapabilities from "./WebGLCapabilities";
import VAO from "./VAO";
import Attribute from "./Attribute";

export default class Renderer {
	constructor(canvas) {
		this.canvas = canvas;

		this.gl = canvas.getContext("webgl2");
		if (!this.gl) {
			console.error("WebGL 2 not available");
		}

		this.capabilities = new WebGLCapabilities(this.gl);
	}

	createMaterial(params) {
		return new Material(this, params);
	}

	createMesh(params) {
		return new Mesh(this, params);
	}

	setSize(width, height) {
		this.canvas.width = width;
		this.canvas.height = height;
		this.gl.viewport(0, 0, width, height);
	}

	set culling(state) {
		if(state) this.gl.enable(this.gl.CULL_FACE);
		else this.gl.disable(this.gl.CULL_FACE);
	}
}

