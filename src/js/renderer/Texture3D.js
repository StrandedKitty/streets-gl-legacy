export default class Texture3D {
	constructor(renderer, params) {
		this.gl = renderer.gl;

		this.url = params.url;
		this.depth = params.depth;
		this.imageHeight = params.imageHeight;
		this.minFilter = params.minFilter || 'LINEAR_MIPMAP_LINEAR';
		this.magFilter = params.magFilter || 'LINEAR';
		this.wrap = params.wrap || 'repeat';
		this.width = params.width || 1;
		this.height = params.height || 1;
		this.depth = params.depth || 1;
		this.format = params.format || 'RED';
		this.internalFormat = params.internalFormat || 'R8';
		this.type = params.type || 'UNSIGNED_BYTE';
		this.data = params.data || null;

		this.WebGLTexture = this.gl.createTexture();
	}

	write(data) {
		this.data = data;

		this.gl.bindTexture(this.gl.TEXTURE_3D, this.WebGLTexture);

		this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_BASE_LEVEL, 0);
		this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MIN_FILTER, this.gl[this.minFilter]);
		this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MAG_FILTER, this.gl[this.magFilter]);

		this.gl.texImage3D(this.gl.TEXTURE_3D, 0, this.gl[this.internalFormat], this.width, this.height, this.depth, 0, this.gl[this.format], this.gl[this.type], this.data);

		this.gl.generateMipmap(this.gl.TEXTURE_3D);
		this.updateWrapping();
	}

	updateWrapping() {
		let value = null;

		switch(this.wrap) {
			case 'repeat':
				value = this.gl.REPEAT;
				break;
			case 'clamp':
				value = this.gl.CLAMP_TO_EDGE;
				break;
		}

		if(value) {
			this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_S, value);
			this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_T, value);
		}
	}
}
