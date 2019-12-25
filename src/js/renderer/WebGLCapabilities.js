export default class WebGLCapabilities {
	constructor(gl) {
		this.gl = gl;
	}

	get maxAnisotropy() {
		const ext = this.gl.getExtension('EXT_texture_filter_anisotropic');
		return this.gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
	}
}

