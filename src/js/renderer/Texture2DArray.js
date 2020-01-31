export default class Texture2DArray {
	constructor(renderer, params) {
		this.gl = renderer.gl;
		this.ext = renderer.extensions;

		this.url = params.url;
		this.depth = params.depth;
		this.imageHeight = params.imageHeight;
		this.anisotropy = params.anisotropy || 1;
		this.minFilter = params.minFilter || 'LINEAR_MIPMAP_LINEAR';
		this.magFilter = params.magFilter || 'LINEAR';
		this.wrap = params.wrap || 'repeat';
		this.width = params.width || 1;
		this.height = params.height || 1;
		this.format = params.format || 'RGBA';
		this.internalFormat = params.internalFormat || 'RGBA';
		this.type = params.type || 'UNSIGNED_BYTE';
		this.data = params.data || null;

		this.WebGLTexture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, this.WebGLTexture);

		if(this.url) {
			this.gl.texImage3D(this.gl.TEXTURE_2D_ARRAY, 0, this.gl.RGBA, 1, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
			this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MIN_FILTER, this.gl[this.minFilter]);
			this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MAG_FILTER, this.gl[this.magFilter]);
			this.gl.generateMipmap(this.gl.TEXTURE_2D_ARRAY);

			if(this.anisotropy > 1) this.gl.texParameterf(this.gl.TEXTURE_2D_ARRAY, this.ext.texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropy);

			this.updateWrapping();
			this.load();
		}

		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
	}

	load() {
		const image = new Image();

		image.onload = function() {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			canvas.width = image.width;
			canvas.height = image.height;
			ctx.drawImage(image, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const pixels = new Uint8Array(imageData.data.buffer);

			this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, this.WebGLTexture);
			this.gl.texImage3D(this.gl.TEXTURE_2D_ARRAY, 0, this.gl.RGBA, image.width, image.height / this.depth, this.depth, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
			this.gl.generateMipmap(this.gl.TEXTURE_2D_ARRAY);
		}.bind(this);

		image.src = this.url;
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
			this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_WRAP_S, value);
			this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_WRAP_T, value);
		}
	}
}
