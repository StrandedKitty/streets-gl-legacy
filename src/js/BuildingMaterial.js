export default class BuildingMaterial {
	constructor() {
		let uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.basic.uniforms);
		uniforms.diffuse.value = new THREE.Color('#000000');
		uniforms.opacity.value = 0.5;

		this.material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			defines: {},
			vertexShader: require('../glsl/building.vert').default,
			fragmentShader: require('../glsl/building.frag').default,
			transparent: true
		});
	}
}