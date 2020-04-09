import MapWorker from './MapWorker';
import Config from "../Config";

export default class MapWorkerManager {
	constructor(num, path) {
		this.workers = [];

		for(let i = 0; i < num; i++) {
			let worker = new MapWorker(path);
			this.workers.push(worker);
		}
	}

	getFreeWorker() {
		for(let i = 0; i < this.workers.length; i++) {
			let worker = this.workers[i];

			if(worker.queue < Config.tilesPerWorker) {
				return worker;
			}
		}

		return undefined;
	}
}
