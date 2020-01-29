import shaders from '../Shaders';
import Config from "../Config";

export default class BuildingMaterial {
	constructor(renderer) {
		this.material = renderer.createMaterial({
			name: 'buildingMaterial',
			vertexShader: shaders.building.vertex,
			fragmentShader: shaders.building.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrix: {type: 'Matrix4fv', value: null},
				normalMatrix: {type: 'Matrix3fv', value: null},
				'tDiffuse[0]': {type: 'texture', value: renderer.createTexture({url: './textures/window.png', anisotropy: Config.textureAnisotropy})},
				'tDiffuse[1]': {type: 'texture', value: renderer.createTexture({url: './textures/glass.png', anisotropy: Config.textureAnisotropy})},
				'time': {type: '1f', value: 0}
			}
		});

		this.depthMaterial = renderer.createMaterial({
			name: 'buildingMaterialDepth',
			vertexShader: shaders.buildingDepth.vertex,
			fragmentShader: shaders.buildingDepth.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrix: {type: 'Matrix4fv', value: null},
				'time': {type: '1f', value: 0}
			}
		});
	}
}
