let config = {
	drawDistance: 3000,
	textureAnisotropy: null
};

config.set = function (key, value, force) {
	if(config[key] === null || force)
		config[key] = value;
};

export default config;