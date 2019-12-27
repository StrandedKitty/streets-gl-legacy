export default class vec3 {
	constructor(...args) {
		let x = 0;
		let y = 0;
		let z = 0;

		if(args.length === 3) {
			x = args[0];
			y = args[1];
			z = args[2];
		} else if(args.length === 1) {
			if(args[0].x !== undefined && args[0].y !== undefined && args[0].z !== undefined) {
				x = args[0].x;
				y = args[1].y;
				z = args[2].z;
			} else if(args[0].length === 3) {
				x = args[0][0];
				y = args[0][1];
				z = args[0][2];
			}
		}

		return {x, y, z};
	}

	static add(a, b) {
		return new this(a.x + b.x, a.y + b.y, a.z + b.z);
	}

	static sub(a, b) {
		return new this(a.x - b.x, a.y - b.y, a.z - b.z);
	}

	static addScalar(v, s) {
		return new this(v.x + s, v.y + s, v.z + s);
	}

	static multiplyScalar(v, s) {
		return new this(v.x * s, v.y * s, v.z * s);
	}

	static applyMatrix(v, m) {
		let dst = new this;
		const w = 1 / (m[3] * v.x + m[7] * v.y + m[11] * v.z + m[15]);
		dst.x = (m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12]) * w;
		dst.y = (m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13]) * w;
		dst.z = (m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14]) * w;
		return dst;
	}

	static normalize(v) {
		let dst = new this;
		const length = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);

		if (length > 0.00001) {
			dst.x = v.x / length;
			dst.y = v.y / length;
			dst.z = v.z / length;
		}

		return dst;
	}

	static length(v) {
		return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
	}

	static cross(a, b) {
		let dst = new this;
		dst.x = a.y * b.z - a.z * b.y;
		dst.y = a.z * b.x - a.x * b.z;
		dst.z = a.x * b.y - a.y * b.x;
		return dst;
	}

	static dot(a, b) {
		return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
	}

	static copy(v) {
		return new this(v.x, v.y, v.z);
	}
}