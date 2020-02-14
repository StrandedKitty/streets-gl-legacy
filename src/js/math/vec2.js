export default class vec2 {
	constructor(...args) {
		let x = 0;
		let y = 0;

		if(args.length === 2) {
			x = args[0];
			y = args[1];
		} else if(args.length === 1) {
			if(args[0].x !== undefined && args[0].y !== undefined) {
				x = args[0].x;
				y = args[1].y;
			} else if(args[0].length === 2) {
				x = args[0][0];
				y = args[0][1];
			}
		}

		return {x, y};
	}

	static add(a, b) {
		return new this(a.x + b.x, a.y + b.y);
	}

	static sub(a, b) {
		return new this(a.x - b.x, a.y - b.y);
	}

	static addScalar(v, s) {
		return new this(v.x + s, v.y + s);
	}

	static multiplyScalar(v, s) {
		return new this(v.x * s, v.y * s);
	}

	static normalize(v) {
		let dst = new this;
		const length = Math.sqrt(v.x ** 2 + v.y ** 2);

		if (length > 0.00001) {
			dst.x = v.x / length;
			dst.y = v.y / length;
		}

		return dst;
	}

	static length(v) {
		return Math.sqrt(v.x ** 2 + v.y ** 2);
	}

	static dot(a, b) {
		const num = (a.x * b.x) + (a.y * b.y);
		return num <= -1 ? -1 : num >= 1 ? 1 : num;
	}

	static copy(v) {
		return new this(v.x, v.y);
	}

	static toArray(v) {
		return [v.x, v.y];
	}
}
