import {hexToRgb} from "./Utils";
const tagsMap = Object.freeze(require('./resources/tags.json'));
const colorNamesList = Object.freeze(require('./resources/colors'));

export default class OSMDescriptor {
	constructor(tags) {
		this.tags = tags || {};
		this.properties = {};

		this.getProperties();
	}

	getProperties() {
		for(let key in this.tags) {
			let value = this.tags[key];

			if(tagsMap[key]) {
				let props = tagsMap[key][value] || tagsMap[key].default;
				let res = {};

				for(let i in props) {
					res[i] = props[i];

					if(res[i] === '@units') {
						res[i] = this.parseUnits(value);
					}

					if(res[i] === '@color') {
						res[i] = colorNamesList[value] || hexToRgb(value);
					}

					if(res[i]) this.properties[i] = res[i];
				}
			}
		}
	}

	parseUnits(value) {
		let num = 0;
		value = value.replace(/,/g,'.').replace(/ /g,'').replace(/ft/g,'\'');

		if(value.search(/m/) !== -1) {
			num = parseFloat(value.replace(/m/g,''));
		} else if(value.search(/'/) !== -1) {
			if(value.search(/"/) !== -1) {
				value = value.replace(/"/g,'').split('\'');
				let feet = parseFloat(value[0]) + parseFloat(value[1]) / 12;
				num = parseFloat(feet) / 3.2808;
			} else {
				num = parseFloat(value.replace(/'/g,'')) / 3.2808;
			}
		} else {
			num = parseFloat(value);
		}

		return num;
	}
}