import Config from './../Config'

export default class Texture {
	constructor(renderer, data) {
		this.gl = renderer.gl;
		this.ext = renderer.extensions;

		this.url = data.url;

		this.WebGLTexture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.WebGLTexture);
		//this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);

		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 2, 2, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([
			255, 0, 255, 255,
			0, 255, 0, 255,
			0, 0, 255, 255,
			255, 255, 255, 255
		]));

		this.gl.generateMipmap(this.gl.TEXTURE_2D);

		this.load();
	}

	load() {
		const image = new Image();

		image.onload = function() {
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.WebGLTexture);
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, image.width, image.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
			this.gl.texParameterf(this.gl.TEXTURE_2D, this.ext.texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, Config.textureAnisotropy);
			this.gl.generateMipmap(this.gl.TEXTURE_2D);
		}.bind(this);

		image.src = this.url;
	}
}