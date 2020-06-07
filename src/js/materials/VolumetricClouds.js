import shaders from '../Shaders';
import {clamp} from "../Utils";
import FullScreenQuad from "../FullScreenQuad";
import Config from "../Config";

export default class VolumetricClouds {
	constructor(renderer, width, height) {
		this.width = width;
		this.height = height;
		this.resolutionFactor = 1;
		this.renderer = renderer;

		this.framebuffer = this.renderer.createFramebuffer({
			width: this.width * this.resolutionFactor,
			height: this.height * this.resolutionFactor,
			clearColor: [0, 0, 0, 1],
			textures: [this.renderer.createTexture({
				width: this.width * this.resolutionFactor,
				height: this.height * this.resolutionFactor,
				minFilter: 'LINEAR',
				magFilter: 'LINEAR',
				wrap: 'clamp',
				format: 'RGBA',
				internalFormat: 'RGBA16F',
				type: 'FLOAT'
			})]
		});

		this.framebufferComposed = this.renderer.createFramebuffer({
			width: this.width * this.resolutionFactor,
			height: this.height * this.resolutionFactor,
			clearColor: [0, 0, 0, 1],
			textures: [this.renderer.createTexture({
				width: this.width * this.resolutionFactor,
				height: this.height * this.resolutionFactor,
				minFilter: 'LINEAR',
				magFilter: 'LINEAR',
				wrap: 'clamp',
				format: 'RGBA',
				internalFormat: 'RGBA16F',
				type: 'FLOAT'
			})]
		});

		this.material = this.renderer.createMaterial({
			name: 'Volumetric clouds',
			vertexShader: shaders.volumetricClouds.vertex,
			fragmentShader: shaders.volumetricClouds.fragment,
			uniforms: {
				tPosition: {type: 'texture', value: null},
				positionMipLevel: {type: '1f', value: ~~Math.log2(Config.SSAA / this.resolutionFactor)},
				time: {type: '1f', value: 0},
				densityFactor2: {type: '1f', value: 0.35},
				densityFactor: {type: '1f', value: 0.005},
				powderFactor: {type: '1f', value: 0.2},
				needsFullUpdate: {type: '1i', value: 1},
				cameraPositionE5: {type: '3fv', value: new Float32Array([0, 0, 0])},
				lightDirection: {type: '3fv', value: new Float32Array([0, -1, 0])},
				normalMatrix: {type: 'Matrix3fv', value: null},
				mvMatrixPrev: {type: 'Matrix4fv', value: null},
				mvMatrixCurr: {type: 'Matrix4fv', value: null},
				projectionMatrix: {type: 'Matrix4fv', value: null},
				tNoise: {type: 'texture3D', value: this.buildNoiseTexture()},
				tBlueNoise: {type: 'texture', value: this.renderer.createTexture({url: '/textures/blue_noise_rgba.png', wrap: 'repeat'})},
				tWeather: {type: 'texture', value: this.renderer.createTexture({url: '/textures/weather.png', wrap: 'repeat'})},
				tAccum: {type: 'texture', value: this.framebufferComposed.textures[0]},
				tPrevFrameDepth: {type: 'texture', value: this.framebufferComposed.textures[1]}
			}
		});

		this.texture = this.framebufferComposed.textures[0];
	}

	setSize(width, height) {
		this.width = Math.floor(width * this.resolutionFactor);
		this.height = Math.floor(height * this.resolutionFactor);

		this.framebuffer.setSize(this.width, this.height);
		this.framebufferComposed.setSize(this.width, this.height);
	}

	copyResultToOutput() {
		this.renderer.blitFramebuffer({
			source: this.framebuffer,
			destination: this.framebufferComposed,
			destinationWidth: this.framebufferComposed.width,
			destinationHeight: this.framebufferComposed.height,
			filter: 'NEAREST',
			depth: false
		});
	}

	buildNoiseTexture() {
		const textureSize = 128;
		const texture3d = this.renderer.createTexture3D({
			width: textureSize,
			height: textureSize,
			depth: textureSize / 2,
			internalFormat: 'RG8',
			format: 'RG',
			minFilter: 'LINEAR',
			magFiler: 'LINEAR'
		});

		texture3d.write(new Uint8Array(textureSize * textureSize * textureSize * 2 / 2));

		const fb = this.renderer.createFramebuffer({
			width: textureSize,
			height: textureSize
		});

		const material = this.renderer.createMaterial({
			name: 'Noise for volumetric clouds',
			vertexShader: shaders.volumetricCloudsNoise.vertex,
			fragmentShader: shaders.volumetricCloudsNoise.fragment,
			uniforms: {
				layer: {type: '1i', value: 0},
				type: {type: '1i', value: 0}
			}
		});

		const quad = new FullScreenQuad({renderer: this.renderer}).mesh;

		material.use();

		for (let i = 0; i < textureSize / 2; i++) {
			fb.attachTexture3D(texture3d, i);

			this.renderer.bindFramebuffer(fb);

			material.uniforms.layer.value = i;
			material.updateUniform('layer');

			quad.draw();
		}

		return texture3d;
	}
}
