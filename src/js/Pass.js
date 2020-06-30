export default class Pass {
	constructor(renderer, width, height) {
		this.renderer = renderer;
		this.height = height;
		this.width = width;

		this.materials = {};
		this.framebuffers = {};
	}

	get framebuffer() {
		return this.framebuffers.main;
	}

	get material() {
		return this.materials.main;
	}

	setSize(width, height) {
		this.height = height;
		this.width = width;

		for(const material of Object.values(this.materials)) {
			if(material.uniforms.resolution)
				material.uniforms.resolution.value = [width, height];
		}

		for(const fb of Object.values(this.framebuffers)) {
			fb.setSize(width, height);
		}
	}
}
