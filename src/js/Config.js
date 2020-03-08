const Config = {
	drawDistance: 5000,
	textureAnisotropy: undefined,
	maxTiles: 50,
	tilesPerWorker: 2,
	pixelRatio: undefined,
	SSAA: 1,
	SMAA: true,
	SSAO: true,
	SSAOResolution: 0.5,
	SSAOBlur: true,
	volumetricLighting: false,
	realTimeSun: false
};

Config.set = function (key, value, force) {
	if(Config[key] === undefined || force)
		Config[key] = value;
};

export default Config;
