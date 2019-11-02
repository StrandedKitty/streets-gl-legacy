import MapWorker from './MapWorker';

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

			if(!worker.used) {
				return worker;
			}
		}

		return undefined;
	}
}