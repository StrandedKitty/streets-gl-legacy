import Material from "./Material";
import Mesh from "./Mesh";
import WebGLCapabilities from "./WebGLCapabilities";
import Texture from "./Texture";
import Extensions from "./Extensions";
import Framebuffer from "./Framebuffer";
import Renderbuffer from "./Renderbuffer";
import FramebufferMultisample from "./FramebufferMultisample";
import TextureCube from "./TextureCube";
import DirectionalLight from "./DirectionalLight";

export default class Renderer {
	constructor(canvas) {
		this.canvas = canvas;
		this.pixelRatio = 1;

		this.gl = canvas.getContext("webgl2", { antialias: false });
		if (!this.gl) {
			console.error("WebGL 2 not available");
		}

		this.capabilities = new WebGLCapabilities(this.gl);
		this.extensions = new Extensions(this.gl);

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);
		this.gl.clearDepth(1);
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

	createTextureCube(params) {
		return new TextureCube(this, params);
	}

	createFramebuffer(params) {
		return new Framebuffer(this, params);
	}

	createFramebufferMultisample(params) {
		return new FramebufferMultisample(this, params);
	}

	createRenderbuffer(params) {
		return new Renderbuffer(this, params);
	}

	createDirectionalLight(params) {
		return new DirectionalLight(this, params);
	}

	setSize(width, height) {
		this.canvas.width = width * this.pixelRatio;
		this.canvas.height = height * this.pixelRatio;
	}

	setPixelRatio(ratio) {
		this.pixelRatio = ratio;
	}

	bindFramebuffer(fb) {
		if(fb instanceof Framebuffer || fb instanceof FramebufferMultisample) {
			this.gl.viewport(0, 0, fb.width, fb.height);
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb.WebGLFramebuffer);
		} else {
			this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		}
	}

	blitFramebuffer(source, destination) {
		this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, source.WebGLFramebuffer);
		this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, destination.WebGLFramebuffer);

		this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0);
		this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
		this.gl.blitFramebuffer(0, 0, source.width, source.height, 0, 0, source.width, source.height, this.gl.COLOR_BUFFER_BIT, this.gl.NEAREST);

		this.gl.readBuffer(this.gl.COLOR_ATTACHMENT1);
		this.gl.drawBuffers([this.gl.NONE, this.gl.COLOR_ATTACHMENT1]);
		this.gl.blitFramebuffer(0, 0, source.width, source.height, 0, 0, source.width, source.height, this.gl.COLOR_BUFFER_BIT, this.gl.NEAREST);

		this.gl.blitFramebuffer(0, 0, source.width, source.height, 0, 0, source.width, source.height, this.gl.DEPTH_BUFFER_BIT, this.gl.NEAREST);
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

