import {degrees2meters} from "./Utils";
import OSMDescriptor from "./OSMDescriptor";

export default class Node {
	constructor(id, lat, lon, tags, pivot) {
		this.id = id;
		this.lat = lat;
		this.lon = lon;
		this.tags = tags || {};
		this.instances = {
			trees: []
		};

		let position = degrees2meters(this.lat, this.lon);

		this.x = position.x - pivot.x;
		this.z = position.z - pivot.z;

		this.descriptor = new OSMDescriptor(this.tags);
		this.properties = this.descriptor.properties;

		if(this.properties.type === 'tree') {
			this.instances.trees.push(this.x, this.z);
		}
	}
}