import Config from "../Config";

export default class BuildingMaterial {
	constructor() {
		let loader = new THREE.TextureLoader();
		let texture = loader.load('https://www.textures.com/system/gallery/photos/Nature/Grass/70925/Grass0203_1_download600.jpg');
		texture.anisotropy = Config.textureAnisotropy;
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

		let uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.basic.uniforms);
		uniforms.diffuse = {value: new THREE.Color('#000000')};
		uniforms.diffuseTexture = {value: texture};

		this.material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			defines: {},
			vertexShader: require('../../glsl/building.vert').default,
			fragmentShader: require('../../glsl/building.frag').default
		});
	}
}