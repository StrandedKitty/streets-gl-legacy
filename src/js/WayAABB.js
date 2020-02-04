export default class WayAABB {
	constructor() {
		this.min = {x: 0, y: 0};
		this.max = {x: 0, y: 0};

		this.empty = true;
	}

	includePoint(point) {
		if(this.empty) {
			this.min.x = point.x;
			this.min.y = point.y;

			this.max.x = point.x;
			this.max.y = point.y;

			this.empty = false;
		} else {
			this.min.x = Math.min(this.min.x, point.x);
			this.min.y = Math.min(this.min.y, point.y);

			this.max.x = Math.max(this.max.x, point.x);
			this.max.y = Math.max(this.max.y, point.y);
		}
	}

	intersectsAABB(box) {
		if(box.empty || this.empty) return false;

		return !(box.max.x <= this.min.x || box.min.x >= this.max.x ||
			box.max.y <= this.min.y || box.min.y >= this.max.y);
	}
}
