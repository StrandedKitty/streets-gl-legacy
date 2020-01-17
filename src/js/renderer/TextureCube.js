export default class TextureCube {
	constructor(renderer, params) {
		this.gl = renderer.gl;

		this.urls = params.urls;
		this.minFilter = params.minFilter || 'LINEAR';
		this.magFilter = params.magFilter || 'LINEAR';
		this.format = params.format || 'RGBA';
		this.internalFormat = params.internalFormat || 'RGBA';
		this.type = params.type || 'UNSIGNED_BYTE';
		this.loaded = false;
		this.loadedNumber = 0;

		this.WebGLTexture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.WebGLTexture);

		for (let i = 0; i < 6; i++) {
			this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
			this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl[this.minFilter]);
			this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl[this.magFilter]);
			this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
			this.load(i);
		}

		this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
	}

	load(i) {
		const image = new Image();

		image.onload = function() {
			this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.WebGLTexture);
			this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.gl.RGBA, image.width, image.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

			++this.loadedNumber;
			if(this.loadedNumber === 6) {
				//this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
				this.loaded = true;
			}
		}.bind(this);

		image.src = this.urls[i];
	}
}