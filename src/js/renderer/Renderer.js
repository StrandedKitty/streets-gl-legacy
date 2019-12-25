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

	createProgram(vs, fs) {
		return new Program(this, {
			vertexShader: vs,
			fragmentShader: fs
		});
	}

	createMesh(params) {
		return new Mesh(this, params);
	}

	createVAO(params) {
		return new VAO(this, params);
	}

	createAttribute(params) {
		return new Attribute(this, params);
	}

	setSize(width, height) {
		this.canvas.width = width;
		this.canvas.height = height;
		this.gl.viewport(0, 0, width, height);
	}
}

