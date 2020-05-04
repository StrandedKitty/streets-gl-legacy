import shaders from '../Shaders';
import SeededRandom from "../math/SeededRandom";
import vec3 from "../math/vec3";
import {clamp} from "../Utils";
import FullScreenQuad from "../FullScreenQuad";

export default class VolumetricClouds {
	constructor(renderer, width, height) {
		this.width = width;
		this.height = height;
		this.renderer = renderer;

		this.framebuffer = this.renderer.createFramebuffer({
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
				type: 'FLOAT'
			})]
		});

		this.framebufferComposed = this.renderer.createFramebuffer({
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
				type: 'FLOAT'
			})]
		});

		this.material = this.renderer.createMaterial({
			name: 'Volumetric clouds',
			vertexShader: shaders.volumetricClouds.vertex,
			fragmentShader: shaders.volumetricClouds.fragment,
			uniforms: {
				tPosition: {type: 'texture', value: null},
				tDepth: {type: 'texture', value: null},
				time: {type: '1f', value: 0},
				densityFactor: {type: '1f', value: 0.005},
				powderFactor: {type: '1f', value: 0.2},
				needsFullUpdate: {type: '1f', value: 0},
				cameraPositionE5: {type: '3fv', value: new Float32Array([0, 0, 0])},
				lightDirection: {type: '3fv', value: new Float32Array([0, -1, 0])},
				normalMatrix: {type: 'Matrix3fv', value: null},
				tNoise: {type: 'texture3D', value: this.buildNoiseTexture()},
				tBlueNoise: {type: 'texture', value: this.renderer.createTexture({url: '/textures/blue_noise_rgba.png', wrap: 'repeat'})},
				tWeather: {type: 'texture', value: this.renderer.createTexture({url: '/textures/weather.png', wrap: 'repeat'})},
				tAccum: {type: 'texture', value: this.framebufferComposed.textures[0]}
			}
		});

		this.texture = this.framebufferComposed.textures[0];
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;

		this.framebuffer.setSize(this.width, this.height);
		this.framebufferComposed.setSize(this.width, this.height);
	}

	copyResultToOutput() {
		this.renderer.copyFramebufferToTexture(this.framebuffer, this.framebufferComposed.textures[0], 0);
	}

	buildNoiseTexture() {
		const textureSize = 128;
		const texture3d = this.renderer.createTexture3D({
			width: textureSize,
			height: textureSize,
			depth: textureSize,
			internalFormat: 'RGBA',
			format: 'RGBA',
			minFilter: 'LINEAR',
			magFiler: 'LINEAR'
		});

		texture3d.write(new Uint8Array(textureSize * textureSize * textureSize * 4));

		const fb = this.renderer.createFramebuffer({
			width: textureSize,
			height: textureSize
		});

		const material = this.renderer.createMaterial({
			name: 'Noise for volumetric clouds',
			vertexShader: shaders.volumetricCloudsNoise.vertex,
			fragmentShader: shaders.volumetricCloudsNoise.fragment,
			uniforms: {
				layer: {type: '1i', value: 0}
			}
		});

		const quad = new FullScreenQuad({renderer: this.renderer}).mesh;

		material.use();

		for(let i = 0; i < textureSize; i++) {
			fb.attachTexture3D(texture3d, i);

			this.renderer.bindFramebuffer(fb);

			material.uniforms.layer.value = i;
			material.updateUniform('layer');

			quad.draw();
		}

		return texture3d;
	}
}
