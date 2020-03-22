const Config = {
	drawDistance: 5000,
	textureAnisotropy: undefined,
	maxTiles: 50,
	tilesPerWorker: 2,
	pixelRatio: undefined,
	SSAA: 1,
	SMAA: false,
	SSAO: true,
	SSAOResolution: 1,
	SSAOBlur: true,
	volumetricLighting: false,
	realTimeSun: false,
	layerHeight: 6
};

Config.set = function (key, value, force) {
	if(Config[key] === undefined || force)
		Config[key] = value;
};

export default Config;
