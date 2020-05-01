import {clamp, toRad} from "./Utils";

class URLData {
	constructor() {
		this.hash = window.location.hash;
	}

	setHash(hashArray) {
		const hashString = '#' + hashArray.join(',');
		history.replaceState(undefined, undefined, hashString);
		this.hash = hashString;
	}

	getHash() {
		const hashString = window.location.hash;
		let changedByUser = false;
		let hashData = hashString.slice(1).split(',');

		if(hashString !== this.hash && hashData.length === 5) {
			changedByUser = true;
		}

		if(hashData.length === 5) {
			hashData[0] = clamp(parseFloat(hashData[0]), -85.051129, 85.051129);
			hashData[1] = clamp(parseFloat(hashData[1]), -180, 180);
			hashData[2] = toRad(clamp(parseFloat(hashData[2]), 0, 360));
			hashData[3] = toRad(clamp(parseFloat(hashData[3]), 0.1, 89.9));
			hashData[4] = clamp(parseFloat(hashData[4]), 2, 8000);
		} else {
			hashData = null;
		}

		this.hash = hashString;

		return {data: hashData, changedByUser}
	}
}

export default new URLData();
