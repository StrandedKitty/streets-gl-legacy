import Object3D from "./Object3D";
import OrthographicCamera from "./OrthographicCamera";

export default class Mesh extends Object3D {
	constructor(renderer, params) {
		super();

		this.renderer = renderer;

		this.color = params.color || [255, 255, 255];
		this.resolution = params.resolution || 1024;

		this.size = params.size;
		this.left = -this.size;
		this.right = this.size;
		this.bottom = -this.size;
		this.top = this.size;
		this.near = params.near || 0.1;
		this.far = params.far || 1000;

		this.camera = new OrthographicCamera({
			left: this.left,
			right: this.right,
			bottom: this.bottom,
			top: this.top,
			near: this.near,
			far: this.far
		});

		this.add(this.camera);

		this.framebuffer = renderer.createFramebuffer({
			width: this.resolution,
			height: this.resolution,
			textures: [renderer.createTexture({
				width: this.resolution,
				height: this.resolution,
				internalFormat: 'R32F',
				format: 'RED',
				type: 'FLOAT',
				minFilter: 'NEAREST',
				magFilter: 'NEAREST',
				wrap: 'clamp'
			})]
		});

		this.texture = this.framebuffer.textures[0];

		this.matrixOverwrite = false;
	}

	setSize(resolution) {
		this.resolution = resolution;

		this.framebuffer.setSize(resolution, resolution);
	}
}
