const Config = {
	drawDistance: 5000,
	textureAnisotropy: undefined,
	maxTiles: 50,
	tilesPerWorker: 2,
	pixelRatio: undefined,
	SMAA: false,
	TAA: true,
	SSAO: true,
	SSAOResolution: 1,
	SSAOBlur: true,
	volumetricLighting: false,
	realTimeSun: false,
	shadows: true
};

Config.set = function (key, value, force) {
	if(Config[key] === undefined || force)
		Config[key] = value;
};

export default Config;
