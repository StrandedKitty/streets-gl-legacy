self.addEventListener('message', function(e) {
	let code = e.data.code;
	switch(code) {
		case 'init':
			break;
		case 'start':
			let position = e.data.position;
			let tile = {
				x: position[0],
				y: position[1],
			};

			load(tile);

			break;
	}
}, false);

function load(tile) {
	self.postMessage(tile);
}