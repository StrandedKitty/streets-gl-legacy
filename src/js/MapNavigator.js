import {degrees2meters} from "./Utils";

export default class MapNavigator {
	constructor() {

	}

	getCurrentPosition(controls) {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function (position) {
				const worldPosition = degrees2meters(position.coords.latitude, position.coords.longitude);

				controls.target.x = worldPosition.x;
				controls.target.z = worldPosition.z;
			}, function (err) {
				console.error('Geolocation.getCurrentPosition() error ' + err);
			}, {timeout: 10000});
		}
	}
}
