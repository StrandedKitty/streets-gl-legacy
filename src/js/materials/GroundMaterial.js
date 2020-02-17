import shaders from '../Shaders';
import Config from "../Config";

export default class BuildingMaterial {
	constructor(renderer) {
		this.material = renderer.createMaterial({
			name: 'ground',
			vertexShader: shaders.ground.vertex,
			fragmentShader: shaders.ground.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrix: {type: 'Matrix4fv', value: null},
				normalMatrix: {type: 'Matrix3fv', value: null},
				tDiffuse: {type: 'texture', value: renderer.createTexture({url: '/textures/grass.jpg', anisotropy: Config.textureAnisotropy})}
			}
		});

		this.depthMaterial = renderer.createMaterial({
			name: 'groundDepth',
			vertexShader: shaders.groundDepth.vertex,
			fragmentShader: shaders.groundDepth.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrix: {type: 'Matrix4fv', value: null}
			}
		});
	}
}
