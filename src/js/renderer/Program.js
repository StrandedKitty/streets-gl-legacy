export default class Program {
	constructor(renderer, data) {
		this.gl = renderer.gl;
		this.source = {
			vertexShader: data.vertexShader,
			fragmentShader: data.fragmentShader
		};

		this.shaders = {
			vertex: this.createShader(this.gl.VERTEX_SHADER, this.source.vertexShader),
			fragment: this.createShader(this.gl.FRAGMENT_SHADER, this.source.fragmentShader)
		};

		const program = this.gl.createProgram();
		this.gl.attachShader(program, this.shaders.vertex);
		this.gl.attachShader(program, this.shaders.fragment);
		this.gl.linkProgram(program);

		let success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);

		if (!success) {
			console.error(this.gl.getProgramInfoLog(program));
		}

		this.WebGLProgram = program;
	}

	createShader(type, source) {
		let shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);

		let compilationStatus = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
		let compilationLog = this.gl.getShaderInfoLog(shader);

		if(!compilationStatus) {
			console.error((type === this.gl.VERTEX_SHADER ? 'Vertex' : 'Fragment') + ' shader compilation error\n\n' + compilationLog + '\n%c' + source, 'color: #111');
		}

		return shader;
	}
}