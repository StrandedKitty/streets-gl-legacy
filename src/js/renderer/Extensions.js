export default class Extensions {
	constructor(gl) {
		this.gl = gl;

		this.texture_filter_anisotropic = gl.getExtension('EXT_texture_filter_anisotropic');
		this.color_buffer_float = gl.getExtension('EXT_color_buffer_float');
		this.debug_renderer_info = gl.getExtension('WEBGL_debug_renderer_info');
		this.texture_float_linear = gl.getExtension('OES_texture_float_linear');

		if(this.color_buffer_float === null) {
			alert('Extension EXT_color_buffer_float is required but not available on this device.')
		}
	}
}

