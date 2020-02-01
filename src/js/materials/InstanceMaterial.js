import shaders from '../Shaders';

export default class InstanceMaterial {
	constructor(renderer) {
		this.material = renderer.createMaterial({
			name: 'ground',
			vertexShader: shaders.instance.vertex,
			fragmentShader: shaders.instance.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrix: {type: 'Matrix4fv', value: null},
				normalMatrix: {type: 'Matrix3fv', value: null}
			}
		});
	}
}
