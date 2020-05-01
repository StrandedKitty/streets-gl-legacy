import shaders from '../Shaders';
import SeededRandom from "../math/SeededRandom";
import vec3 from "../math/vec3";
import {clamp} from "../Utils";

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
				needsFullUpdate: {type: '1f', value: 0},
				cameraPositionE5: {type: '3fv', value: new Float32Array([0, 0, 0])},
				lightDirection: {type: '3fv', value: new Float32Array([0, -1, 0])},
				normalMatrix: {type: 'Matrix3fv', value: null},
				tNoise: {type: 'texture3D', value: this.buildWorley()},
				tBlueNoise: {type: 'texture', value: this.renderer.createTexture({url: '/textures/blue_noise_rgba.png', wrap: 'repeat'})},
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

	buildWorley() {
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

		const buffer = new Uint8Array(textureSize ** 3 * 4);

		const random = new SeededRandom(3217);
		let randomPoints = [];

		for(let i = 0; i < 8; i++) {
			randomPoints.push(new vec3(random.generate() * textureSize, random.generate() * textureSize, random.generate() * textureSize));
		}

		//randomPoints = [new vec3(0.5 * textureSize, 0.5 * textureSize, 0.5 * textureSize)];

		for(let dx = 0; dx < textureSize; dx++) {
			for(let dy = 0; dy < textureSize; dy++) {
				for(let dz = 0; dz < textureSize; dz++) {
					const texelPos = new vec3(dx,dy,dz);

					let distanceToNearest = 255;

					for(let i = 0; i < randomPoints.length; i++) {
						let point = randomPoints[i];
						distanceToNearest = Math.min(distanceToNearest, vec3.length(vec3.sub(texelPos, point)) * 5);
					}

					buffer[(dx + dy * textureSize + dz * textureSize * textureSize) * 4] = clamp(255 - Math.floor(distanceToNearest), 0, 255);
				}
			}
		}

		texture3d.write(buffer);

		return texture3d;
	}
}
