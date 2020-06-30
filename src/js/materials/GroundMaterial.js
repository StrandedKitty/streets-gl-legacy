import shaders from '../Shaders';
import Config from "../Config";
import MaterialGroup from "../MaterialGroup";

export default class GroundMaterial extends MaterialGroup {
	constructor(renderer) {
		super(renderer);

		this.default = this.renderer.createMaterial({
			name: 'ground',
			vertexShader: shaders.ground.vertex,
			fragmentShader: shaders.ground.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrixPrev: {type: 'Matrix4fv', value: null},
				tDiffuse: {type: 'texture', value: this.renderer.createTexture({url: '/textures/grass.jpg', anisotropy: Config.textureAnisotropy})},
				tNormal: {type: 'texture', value: this.renderer.createTexture({url: '/textures/ground_normal.jpg', anisotropy: Config.textureAnisotropy})}
			}
		});

		this.depth = this.renderer.createMaterial({
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
