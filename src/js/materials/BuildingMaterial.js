import shaders from '../Shaders';
import Config from "../Config";

export default class BuildingMaterial {
	constructor(renderer) {
		this.renderer = renderer;

		this.texturesNumber = 5;

		this.textureArrays = {
			color: null,
			metalness: null,
			roughness: null,
			specular: null
		};

		this.loadTextures();

		this.material = renderer.createMaterial({
			name: 'buildingMaterial',
			vertexShader: shaders.building.vertex,
			fragmentShader: shaders.building.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrix: {type: 'Matrix4fv', value: null},
				normalMatrix: {type: 'Matrix3fv', value: null},
				tColor: {type: 'texture2DArray', value: this.textureArrays.color},
				tMetalness: {type: 'texture2DArray', value: this.textureArrays.metalness},
				tRoughness: {type: 'texture2DArray', value: this.textureArrays.roughness},
				tSpecular: {type: 'texture2DArray', value: this.textureArrays.specular},
				time: {type: '1f', value: 0}
			}
		});

		this.depthMaterial = renderer.createMaterial({
			name: 'buildingMaterialDepth',
			vertexShader: shaders.buildingDepth.vertex,
			fragmentShader: shaders.buildingDepth.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrix: {type: 'Matrix4fv', value: null},
				time: {type: '1f', value: 0}
			}
		});
	}

	loadTextures() {
		this.textureArrays = {
			color: this.renderer.createTexture2DArray({
				url: '/textures/building/color.png',
				depth: this.texturesNumber,
				anisotropy: Config.textureAnisotropy
			}),
			metalness: this.renderer.createTexture2DArray({
				url: '/textures/building/metalness.png',
				depth: this.texturesNumber,
				anisotropy: Config.textureAnisotropy
			}),
			roughness: this.renderer.createTexture2DArray({
				url: '/textures/building/roughness.png',
				depth: this.texturesNumber,
				anisotropy: Config.textureAnisotropy
			}),
			specular: this.renderer.createTexture2DArray({
				url: '/textures/building/specular.png',
				depth: this.texturesNumber,
				anisotropy: Config.textureAnisotropy
			})
		};
	}
}
