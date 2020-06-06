import Material from "./Material";
import Mesh from "./Mesh";
import WebGLCapabilities from "./WebGLCapabilities";
import Texture from "./Texture";
import Extensions from "./Extensions";
import Framebuffer from "./Framebuffer";
import Renderbuffer from "./Renderbuffer";
import FramebufferMultisample from "./FramebufferMultisample";
import TextureCube from "./TextureCube";
import DirectionalLight from "../core/DirectionalLight";
import Texture2DArray from "./Texture2DArray";
import MeshInstanced from "./MeshInstanced";
import Texture3D from "./Texture3D";

export default class Renderer {
	constructor(canvas) {
		this.canvas = canvas;

		this.gl = canvas.getContext("webgl2", { antialias: false });
		if (!this.gl) {
			console.error('WebGL 2 is not available.');
			alert('WebGL 2 is not available.');
		}

		this.extensions = new Extensions(this.gl);
		this.capabilities = new WebGLCapabilities(this);

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);
		this.gl.clearDepth(1);

		this.material = null;
	}

	createMaterial(params) {
		return new Material(this, params);
	}

	createMesh(params) {
		return new Mesh(this, params);
	}

	createMeshInstanced(params) {
		return new MeshInstanced(this, params);
	}

	createTexture(params) {
		return new Texture(this, params);
	}

	createTexture2DArray(params) {
		return new Texture2DArray(this, params);
	}

	createTexture3D(params) {
		return new Texture3D(this, params);
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
		this.canvas.width = width;
		this.canvas.height = height;
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

	blitFramebuffer(params) {
		this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, params.source.WebGLFramebuffer);

		if(params.destination === null) this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, null);
		else this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, params.destination.WebGLFramebuffer);

		this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0 + (params.readAttachment || 0));
		if(params.destination !== null) this.gl.drawBuffers(this.buildAttachmentsArray(params.drawAttachment || 0));

		this.gl.blitFramebuffer(
			0, 0, params.source.width, params.source.height,
			0, 0, params.destinationWidth, params.destinationHeight,
			this.gl.COLOR_BUFFER_BIT, this.gl[params.filter]
		);

		if(params.depth) this.gl.blitFramebuffer(
			0, 0, params.source.width, params.source.height,
			0, 0, params.destinationWidth, params.destinationHeight,
			this.gl.DEPTH_BUFFER_BIT, this.gl.NEAREST
		);

		this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, null);
		this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, null);
	}

	buildAttachmentsArray(index) {
		const attachments = [];

		for(let i = 0; i <= index; i++) {
			if(i === index) attachments.push(this.gl.COLOR_ATTACHMENT0 + i);
			else attachments.push(this.gl.NONE);
		}

		return attachments;
	}

	copyFramebufferToTexture(fb, texture, mipLevel) {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb.WebGLFramebuffer);
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture.WebGLTexture);
		this.gl.copyTexImage2D(this.gl.TEXTURE_2D, mipLevel, this.gl[texture.internalFormat], 0, 0, texture.width, texture.height, 0);
	}

	clearColor(r, g, b, a) {
		this.gl.clearColor(r, g, b, a);
	}

	clearFramebuffer({clearColor, color = false, depth = false}) {
		this.clearColor(...clearColor);
		const colorBit = color ? this.gl.COLOR_BUFFER_BIT : 0;
		const depthBit = depth ? this.gl.DEPTH_BUFFER_BIT : 0;
		this.gl.clear(colorBit | depthBit);
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

	get rendererInfo() {
		const ext = this.extensions.debug_renderer_info;

		if(ext !== null) {
			return [this.gl.getParameter(ext.UNMASKED_VENDOR_WEBGL), this.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)];
		}

		return [null, null];
	}
}

