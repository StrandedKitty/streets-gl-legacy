import shaders from '../Shaders';
import Config from "../Config";

export default class BuildingMaterial {
	constructor(renderer) {
		this.renderer = renderer;

		this.textureArraysFacade = {
			color: null,
			metalness: null,
			roughness: null,
			specular: null
		};

		this.textureArraysWindow = {
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
				tColor: {type: 'texture2DArray', value: this.textureArraysFacade.color},
				tMetalness: {type: 'texture2DArray', value: this.textureArraysFacade.metalness},
				tRoughness: {type: 'texture2DArray', value: this.textureArraysFacade.roughness},
				tSpecular: {type: 'texture2DArray', value: this.textureArraysFacade.specular},
				tWinColor: {type: 'texture2DArray', value: this.textureArraysWindow.color},
				tWinMetalness: {type: 'texture2DArray', value: this.textureArraysWindow.metalness},
				tWinRoughness: {type: 'texture2DArray', value: this.textureArraysWindow.roughness},
				tWinSpecular: {type: 'texture2DArray', value: this.textureArraysWindow.specular},
				tWinEmission: {type: 'texture2DArray', value: this.textureArraysWindow.emission},
				tNoise: {type: 'texture', value: this.renderer.createTexture({url: '/textures/noise.png', anisotropy: Config.textureAnisotropy})},
				time: {type: '1f', value: 0},
				uSunIntensity: {type: '1f', value: 1}
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
		this.textureArraysFacade = {
			color: this.renderer.createTexture2DArray({
				url: '/textures/building/facade_color.png',
				depth: 5,
				anisotropy: Config.textureAnisotropy
			}),
			metalness: this.renderer.createTexture2DArray({
				url: '/textures/building/facade_metalness.png',
				depth: 5,
				anisotropy: Config.textureAnisotropy
			}),
			roughness: this.renderer.createTexture2DArray({
				url: '/textures/building/facade_roughness.png',
				depth: 5,
				anisotropy: Config.textureAnisotropy
			}),
			specular: this.renderer.createTexture2DArray({
				url: '/textures/building/facade_specular.png',
				depth: 5,
				anisotropy: Config.textureAnisotropy
			})
		};

		this.textureArraysWindow = {
			color: this.renderer.createTexture2DArray({
				url: '/textures/building/window_color.png',
				depth: 5,
				anisotropy: Config.textureAnisotropy
			}),
			metalness: this.renderer.createTexture2DArray({
				url: '/textures/building/window_metalness.png',
				depth: 5,
				anisotropy: Config.textureAnisotropy
			}),
			roughness: this.renderer.createTexture2DArray({
				url: '/textures/building/window_roughness.png',
				depth: 5,
				anisotropy: Config.textureAnisotropy
			}),
			specular: this.renderer.createTexture2DArray({
				url: '/textures/building/window_specular.png',
				depth: 5,
				anisotropy: Config.textureAnisotropy
			}),
			emission: this.renderer.createTexture2DArray({
				url: '/textures/building/window_emission.png',
				depth: 5,
				anisotropy: Config.textureAnisotropy
			})
		};
	}
}
