let Shapes = {};

Shapes.plane = function(x, z) {
	const hx = x / 2;
	const hz = z / 2;
	this.vertices = new Float32Array([
		hx, 0, -hz,
		-hx, 0, -hz,
		hx, 0, hz,
		hx, 0, hz,
		-hx, 0, -hz,
		-hx, 0, hz
	]);
	this.uv = new Float32Array([
		1, 0,
		0, 0,
		1, 1,
		1, 1,
		0, 0,
		0, 1
	]);
};

Shapes.planeSubdivided = function(x, z, segmentsX, segmentsZ) {
	const hx = x / 2;
	const hz = z / 2;

	const vertices = [];
	const uv = [];

	const segment = {
		x: x / segmentsX,
		z: z / segmentsZ
	};

	for(let x = 0; x < segmentsX; x++) {
		for(let z = 0; z < segmentsX; z++) {
			vertices.push(
				segment.x * (1 + x) - hx, 0, segment.z * z - hz,
				segment.x * x - hx, 0, segment.z * z - hz,
				segment.x * (1 + x) - hx, 0, segment.z * (1 + z) - hz,
				segment.x * (1 + x) - hx, 0, segment.z * (1 + z) - hz,
				segment.x * x - hx, 0, segment.z * z - hz,
				segment.x * x - hx, 0, segment.z * (1 + z) - hz
			);

			uv.push(
				(x + 1) / segmentsX, z / segmentsX,
				x / segmentsX, z / segmentsX,
				(x + 1) / segmentsX, (z + 1) / segmentsX,
				(x + 1) / segmentsX, (z + 1) / segmentsX,
				x / segmentsX, z / segmentsX,
				x / segmentsX, (z + 1) / segmentsX
			);
		}
	}

	this.vertices = new Float32Array(vertices);
	this.uv = new Float32Array(uv);
};

export default Shapes;
