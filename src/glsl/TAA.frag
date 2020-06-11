#version 300 es
precision highp float;
precision highp int;
precision highp sampler3D;

in vec2 vUv;
out vec4 FragColor;

uniform int ignoreHistory;
uniform sampler2D tNew;
uniform sampler2D tAccum;
uniform sampler2D tMotion;
uniform sampler2D tPosition;

void main() {
	vec4 pixelMovement = texture(tMotion, vUv);
	vec2 oldPixelUv = vUv - pixelMovement.xy;

	vec4 oldColor = texture(tAccum, oldPixelUv);
	vec4 newColor = texture(tNew, vUv);

	float oldDepth = pixelMovement.z;
	float newDepth = texture(tPosition, vUv).z;

	if(ignoreHistory == 1) {
		FragColor = newColor;
		return;
	}

	if(oldPixelUv.x >= 0. && oldPixelUv.x <= 1. && oldPixelUv.y >= 0. && oldPixelUv.y <= 1.) {
		vec2 size = vec2(textureSize(tNew, 0));

		if(abs(pixelMovement.x) <= 0.005 / size.x && abs(pixelMovement.y) <= 0.005 / size.y) {
			FragColor = mix(oldColor, newColor, 0.06);
			return;
		}

		vec2 offsets[] = vec2[](
			vec2(1, 0),
			vec2(-1, 0),
			vec2(0, 1),
			vec2(0, -1),
			vec2(1, 1),
			vec2(-1, -1),
			vec2(1, -1),
			vec2(-1, 1)
		);

		vec4 maxNeighbor = newColor;
		vec4 minNeighbor = newColor;
		vec4 avg = vec4(0);

		for(int i = 0; i < 4; i++) {
			vec2 neighborUv = vUv + offsets[i] / size;
			vec4 neighborTexel = texture(tNew, neighborUv);
			maxNeighbor = max(maxNeighbor, neighborTexel);
			minNeighbor = min(minNeighbor, neighborTexel);
			avg += neighborTexel;
		}

		if(avg.a == 0.) // temporary solution to disable TTA for skybox
			FragColor = newColor;
		else
			FragColor = mix(clamp(oldColor, minNeighbor, maxNeighbor), newColor, 0.1);
	} else {
		FragColor = newColor;
	}

	//FragColor = vec4(pixelMovement.xy, 0, 1);
}
