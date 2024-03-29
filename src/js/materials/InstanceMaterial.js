import shaders from '../Shaders';
import Config from "../Config";
import MaterialGroup from "../MaterialGroup";

export default class InstanceMaterial extends MaterialGroup {
	constructor(renderer) {
		super(renderer);

		this.default = this.renderer.createMaterial({
			name: 'instance',
			vertexShader: shaders.instance.vertex,
			fragmentShader: shaders.instance.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelMatrix: {type: 'Matrix4fv', value: null},
				viewMatrix: {type: 'Matrix4fv', value: null},
				viewMatrixPrev: {type: 'Matrix4fv', value: null},
				normalMatrix: {type: 'Matrix3fv', value: null},
				tDiffuse: {type: 'texture', value: this.renderer.createTexture({url: '/textures/hydrant/diffuse.png', anisotropy: Config.textureAnisotropy})},
				tNormal: {type: 'texture', value: this.renderer.createTexture({url: '/textures/hydrant/normal.png', anisotropy: Config.textureAnisotropy})},
			}
		});

		this.depth = this.renderer.createMaterial({
			name: 'instanceDepth',
			vertexShader: shaders.instanceDepth.vertex,
			fragmentShader: shaders.instanceDepth.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelMatrix: {type: 'Matrix4fv', value: null},
				viewMatrix: {type: 'Matrix4fv', value: null},
				normalMatrix: {type: 'Matrix3fv', value: null}
			}
		});
	}
}
