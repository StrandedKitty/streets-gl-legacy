export default class ControlsState {
	constructor(controls) {
		this.target = {
			x: controls.target.x,
			y: controls.target.y,
			z: controls.target.z
		};

		this.distance = controls.distance;

		this.pitch = controls.pitch;
		this.yaw = controls.yaw;
	}

	equals(state) {
		return this.target.x === state.target.x &&
			this.target.y === state.target.y &&
			this.target.z === state.target.z &&
			this.distance === state.distance &&
			this.pitch === state.pitch &&
			this.yaw === state.yaw
	}
}
