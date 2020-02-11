export default class MapWorker {
	constructor(path) {
		this.queue = 0;
		this.worker = new Worker(path);

		this.callbacks = {};

		this.worker.addEventListener('message', this.onmessage.bind(this), false);

		this.worker.postMessage({code: 'init'});
	}

	start(x, y, callback) {
		this.queue++;
		this.callbacks[x + ',' + y] = callback;

		this.worker.postMessage({code: 'start', position: [x, y]});
	}

	onmessage(e) {
		this.queue--;

		const callback = this.callbacks[e.data.x + ',' + e.data.y];
		callback(e.data.mesh);
		delete this.callbacks[e.data.x + ',' + e.data.y];
	}
}
