let config = {
	drawDistance: 3000,
	textureAnisotropy: undefined
};

config.set = function (key, value, force) {
	if(config[key] === undefined || force)
		config[key] = value;
};

export default config;