import shaders from '../Shaders';
import {clamp} from "../Utils";
import FullScreenQuad from "../FullScreenQuad";
import Pass from "../Pass";

export default class VolumetricClouds extends Pass {
	constructor(renderer, width, height) {
		super(renderer, width, height);

		this.resolutionFactor = 1;

		this.framebuffers.main = this.renderer.createFramebuffer({
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

		this.framebuffers.composed = this.renderer.createFramebuffer({
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

		this.materials.main = this.renderer.createMaterial({
			name: 'Volumetric clouds',
			vertexShader: shaders.volumetricClouds.vertex,
			fragmentShader: shaders.volumetricClouds.fragment,
			uniforms: {
				tPosition: {type: 'texture', value: null},
				positionMipLevel: {type: '1f', value: 0},
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
				tAccum: {type: 'texture', value: this.framebuffers.composed.textures[0]}
			}
		});

		this.texture = this.framebuffers.composed.textures[0];
	}

	setSize(width, height) {
		super.setSize(
			Math.floor(width * this.resolutionFactor),
			Math.floor(height * this.resolutionFactor)
		)
	}

	copyResultToOutput() {
		this.renderer.blitFramebuffer({
			source: this.framebuffers.main,
			destination: this.framebuffers.composed,
			destinationWidth: this.framebuffers.composed.width,
			destinationHeight: this.framebuffers.composed.height,
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
