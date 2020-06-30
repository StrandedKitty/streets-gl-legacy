import shaders from "../Shaders";
import Config from "../Config";
import Pass from "../Pass";

export default class TAA extends Pass {
	constructor(renderer, width, height) {
		super(renderer, width, height);

		this.frameCount = 0;
		this.matrixWorldInversePrev = null;

		this.framebuffers.prev = this.renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [this.renderer.createTexture({
				width: this.width,
				height: this.height,
				minFilter: 'LINEAR',
				magFilter: 'LINEAR',
				wrap: 'clamp',
				format: 'RGBA',
				internalFormat: 'RGBA16F',
				type: 'HALF_FLOAT'
			})]
		});

		this.framebuffers.main = this.renderer.createFramebuffer({
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

		this.materials.main = this.renderer.createMaterial({
			name: 'TAA composer',
			vertexShader: shaders.TAA.vertex,
			fragmentShader: shaders.TAA.fragment,
			uniforms: {
				tAccum: {type: 'texture', value: this.framebuffers.prev.textures[0]},
				tNew: {type: 'texture', value: null},
				tMotion: {type: 'texture', value: null},
				tPosition: {type: 'texture', value: null},
				ignoreHistory: {type: '1i', value: 1},
			}
		});
	}

	jitter(projectionMatrix) {
		const offsets = [
			[-7 / 8, 1 / 8],
			[-5 / 8, -5 / 8],
			[-1 / 8, -3 / 8],
			[3 / 8, -7 / 8],
			[5 / 8, -1 / 8],
			[7 / 8, 7 / 8],
			[1 / 8, 3 / 8],
			[-3 / 8, 5 / 8]
		];
		projectionMatrix[8] = offsets[this.frameCount % offsets.length][0] / (window.innerWidth * Config.pixelRatio);
		projectionMatrix[9] = offsets[this.frameCount % offsets.length][1] / (window.innerHeight * Config.pixelRatio);

		this.frameCount++;
	}

	copyResultToOutput() {
		this.renderer.blitFramebuffer({
			source: this.framebuffers.main,
			destination: this.framebuffers.prev,
			destinationWidth: this.framebuffers.prev.width,
			destinationHeight: this.framebuffers.prev.height,
			filter: 'NEAREST',
			depth: false
		});
	}
}
