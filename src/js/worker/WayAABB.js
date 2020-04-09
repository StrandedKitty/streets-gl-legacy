export default class WayAABB {
	constructor() {
		this.min = {x: 0, y: 0};
		this.max = {x: 0, y: 0};

		this.empty = true;
	}

	set(minX, minY, maxX, maxY) {
		this.min = {x: minX, y: minY};
		this.max = {x: maxX, y: maxY};

		this.empty = false;
	}

	includePoint(x, y) {
		if(this.empty) {
			this.min.x = x;
			this.min.y = y;

			this.max.x = x;
			this.max.y = y;

			this.empty = false;
		} else {
			this.min.x = Math.min(this.min.x, x);
			this.min.y = Math.min(this.min.y, y);

			this.max.x = Math.max(this.max.x, x);
			this.max.y = Math.max(this.max.y, y);
		}
	}

	intersectsAABB(box) {
		if(box.empty || this.empty) return false;

		return !(box.max.x <= this.min.x || box.min.x >= this.max.x ||
			box.max.y <= this.min.y || box.min.y >= this.max.y);
	}
}
