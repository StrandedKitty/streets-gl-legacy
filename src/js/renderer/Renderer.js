import Material from "./Material";
import Mesh from "./Mesh";
import WebGLCapabilities from "./WebGLCapabilities";
import Texture from "./Texture";
import Extensions from "./Extensions";
import Framebuffer from "./Framebuffer";

export default class Renderer {
	constructor(canvas) {
		this.canvas = canvas;

		this.gl = canvas.getContext("webgl2");
		if (!this.gl) {
			console.error("WebGL 2 not available");
		}

		this.capabilities = new WebGLCapabilities(this.gl);
		this.extensions = new Extensions(this.gl);

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);
	}

	createMaterial(params) {
		return new Material(this, params);
	}

	createMesh(params) {
		return new Mesh(this, params);
	}

	createTexture(params) {
		return new Texture(this, params);
	}

	createFramebuffer(params) {
		return new Framebuffer(this, params);
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

	set depthTest(state) {
		if(state) this.gl.enable(this.gl.DEPTH_TEST);
		else this.gl.disable(this.gl.DEPTH_TEST);
	}

	set depthWrite(state) {
		this.gl.depthMask(state);
	}
}

