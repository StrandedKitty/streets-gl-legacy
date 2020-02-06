let config = {
	drawDistance: 5000,
	textureAnisotropy: undefined,
	maxTiles: 50,
	SSAA: 2,
	SMAA: true,
	SSAO: true,
	SSAOResolution: 0.5,
	SSAOBlur: true,
	volumetricLighting: false,
	realTimeSun: false
};

config.set = function (key, value, force) {
	if(config[key] === undefined || force)
		config[key] = value;
};

export default config;
