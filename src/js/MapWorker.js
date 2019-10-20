export default class MapWorker {
	constructor(path) {
		this.used = false;
		this.worker = new Worker(path);

		let onmessage = this.onmessage;
		this.worker.addEventListener('message', onmessage, false);

		this.worker.postMessage({code: 'init'});
	}

	start(x, y, callback) {
		this.used = true;
		this.callback = callback;

		this.worker.postMessage({code: 'start', position: [x, y]});
	}

	onmessage(e) {
		this.callback(e.data);
		this.used = false;
	}
}