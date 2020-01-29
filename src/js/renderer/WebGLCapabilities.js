export default class WebGLCapabilities {
	constructor(renderer) {
		this.gl = renderer.gl;
		this.renderer = renderer;
	}

	get maxAnisotropy() {
		const ext = this.renderer.extensions.texture_filter_anisotropic;

		if(ext !== null) {
			return this.gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
		} else {
			return 1;
		}
	}
}

