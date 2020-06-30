import shaders from '../Shaders';
import vec3 from "../math/vec3";
import {lerp} from "../Utils";
import SeededRandom from "../math/SeededRandom";
import Pass from "../Pass";

export default class SSAO extends Pass {
	constructor(renderer, width, height) {
		super(renderer, width, height);

		this.framebuffers.main = renderer.createFramebuffer({
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

		this.materials.main = renderer.createMaterial({
			name: 'SAO',
			vertexShader: shaders.sao.vertex,
			fragmentShader: shaders.sao.fragment,
			uniforms: {
				resolution: {type: '2fv', value: [this.width, this.height]},
				tPosition: {type: 'texture', value: null},
				tNormal: {type: 'texture', value: null},
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
		const random = new SeededRandom(3216);
		const samples = [];

		for (let i = 0; i < number; ++i) {
			let sample = new vec3(random.generate() * 2 - 1, random.generate() * 2 - 1, random.generate());
			sample = vec3.normalize(sample);
			//sample = vec3.multiplyScalar(sample, Math.random());
			let scale = i / number;

			scale = lerp(0.1, 1, scale ** 2);
			sample = vec3.multiplyScalar(sample, scale);
			samples.push(sample.x, sample.y, sample.z);
		}

		return samples;
	}
}
