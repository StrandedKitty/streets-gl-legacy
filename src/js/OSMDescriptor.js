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
		for(const key in this.tags) {
			const value = this.tags[key];

			if(tagsMap[key]) {
				const props = tagsMap[key][value] || tagsMap[key].default || {};
				const res = {};

				for(let i in props) {
					const mapValue = props[i];

					if(mapValue === '@units') {
						res[i] = this.parseUnits(value);
					} else if(mapValue === '@color') {
						res[i] = colorNamesList[value.toLowerCase()] || hexToRgb(value);
					} else if(mapValue === '@int') {
						res[i] = parseInt(value);
					} else if(mapValue === '@this') {
						res[i] = value;
					} else {
						res[i] = mapValue;
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
