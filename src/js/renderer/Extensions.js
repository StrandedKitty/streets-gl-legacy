export default class Extensions {
	constructor(gl) {
		this.gl = gl;

		this.texture_filter_anisotropic = gl.getExtension('EXT_texture_filter_anisotropic');
	}
}

