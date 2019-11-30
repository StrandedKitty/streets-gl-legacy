export default class InstanceMaterial {
	constructor() {
		let uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.basic.uniforms);
		uniforms.diffuse.value = new THREE.Color('#048135');

		this.material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			defines: {},
			vertexShader: require('../../glsl/instance.vert').default,
			fragmentShader: require('../../glsl/instance.frag').default
		});
	}
}