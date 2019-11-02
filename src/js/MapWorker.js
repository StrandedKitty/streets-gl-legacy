export default class MapWorker {
	constructor(path) {
		this.used = false;
		this.worker = new Worker(path);

		this.worker.addEventListener('message', this.onmessage.bind(this), false);

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