import shaders from '../Shaders';
import vec3 from "../math/vec3";
import {lerp} from "../Utils";

export default class SSAO {
	constructor(renderer, width, height) {
		this.width = width;
		this.height = height;

		this.framebuffer = renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [renderer.createTexture({
				width: this.width,
				height: this.height,
				internalFormat: 'RGBA',
				format: 'RGBA',
				minFilter: 'LINEAR',
				magFilter: 'LINEAR',
				wrap: 'clamp'
			})]
		});

		this.material = renderer.createMaterial({
			name: 'SAO',
			vertexShader: shaders.sao.vertex,
			fragmentShader: shaders.sao.fragment,
			uniforms: {
				//cameraNear: {type: '1f', value: 1},
				//cameraFar: {type: '1f', value: 10000},
				resolution: {type: '2fv', value: [window.innerWidth, window.innerHeight]},
				tPosition: {type: 'texture', value: null},
				tNormal: {type: 'texture', value: null},
				//tDepth: {type: 'texture', value: null},
				cameraProjectionMatrix: {type: 'Matrix4fv', value: null},
				tNoise: {type: 'texture', value: renderer.createTexture({
					width: 4,
					height: 4,
					minFilter: 'NEAREST',
					magFilter: 'NEAREST',
					data: this.getRandomRotations(4)
				})},
				samples: {type: '3fv', value: this.getRandomSamples(64)}
			}
		});
	}

	getRandomRotations(size) {
		let pixels = [];

		for(let i = 0; i < size ** 2; i++) {
			pixels.push(
				Math.floor(Math.random() * 255),
				Math.floor(Math.random() * 255),
				0,
				255
			);
		}

		return new Uint8Array(pixels);
	}

	getRandomSamples(number) {
		let samples = [];

		for (let i = 0; i < number; ++i){
			let sample = new vec3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random());
			sample = vec3.normalize(sample);
			//sample = vec3.multiplyScalar(sample, Math.random());
			let scale = i / number;

			scale = lerp(0.1, 1, scale ** 2);
			sample = vec3.multiplyScalar(sample, scale);
			samples.push(sample.x, sample.y, sample.z);
		}

		return samples;
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;

		this.framebuffer.setSize(width, height);
		this.material.uniforms.resolution.value = [width, height];
	}
}