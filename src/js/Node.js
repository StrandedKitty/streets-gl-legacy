import {degrees2meters} from "./Utils";

export default class Node {
	constructor(id, lat, lon, tags) {
		this.id = id;
		this.lat = lat;
		this.lon = lon;
		this.tags = tags || {};

		let position = degrees2meters(this.lat, this.lon);

		this.x = position.x;
		this.z = position.z;
	}
}