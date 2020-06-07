import shaders from "../Shaders";

export default class TAA {
	constructor(renderer, width, height) {
		this.renderer = renderer;
		this.width = width;
		this.height = height;

		this.framebufferPrev = this.renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [this.renderer.createTexture({
				width: this.width,
				height: this.height,
				minFilter: 'NEAREST',
				magFilter: 'NEAREST',
				wrap: 'clamp',
				format: 'RGBA',
				internalFormat: 'RGBA16F',
				type: 'FLOAT'
			})]
		});

		this.framebuffer = this.renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [this.renderer.createTexture({
				width: this.width,
				height: this.height,
				minFilter: 'NEAREST',
				magFilter: 'NEAREST',
				wrap: 'clamp',
				format: 'RGBA',
				internalFormat: 'RGBA16F',
				type: 'FLOAT'
			})]
		});

		this.material = this.renderer.createMaterial({
			name: 'TAA composer',
			vertexShader: shaders.TAA.vertex,
			fragmentShader: shaders.TAA.fragment,
			uniforms: {
				tAccum: {type: 'texture', value: this.framebufferPrev.textures[0]},
				tNew: {type: 'texture', value: null},
				ignoreHistory: {type: '1i', value: 0}
			}
		});
	}

	copyResultToOutput() {
		this.renderer.blitFramebuffer({
			source: this.framebuffer,
			destination: this.framebufferPrev,
			destinationWidth: this.framebufferPrev.width,
			destinationHeight: this.framebufferPrev.height,
			filter: 'NEAREST',
			depth: false
		});
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;

		this.framebuffer.setSize(width, height);
		this.framebufferPrev.setSize(width, height);
	}
}
