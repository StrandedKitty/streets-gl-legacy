#version 300 es
precision highp float;
precision highp int;
precision highp sampler3D;

in vec2 vUv;
out vec4 FragColor;

uniform mat4 mvMatrixPrev;
uniform mat4 mvMatrixCurr;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform sampler2D tPosition;
uniform sampler2D tDepth;
uniform vec3 cameraPositionE5;
uniform vec3 lightDirection;
uniform sampler2D tWeather;
uniform sampler2D tBlueNoise;
uniform sampler3D tNoise;
uniform sampler2D tAccum;
uniform float time;
uniform int needsFullUpdate;
uniform float densityFactor;
uniform float powderFactor;

float linearDepth(vec2 uv) {
	float zNear = 1.;
	float zFar = 15000.;
	float z_b = texture(tDepth, uv).x;
	float z_n = 2.0 * z_b - 1.0;
	return 2.0 * zNear * zFar / (zFar + zNear - z_n * (zFar - zNear));
}

#include <noise>
#include <clouds>

void main() {
	vec4 accumColor = texture(tAccum, vUv);
	vec3 position = vec3(texture(tPosition, vUv));
	vec3 view = normalize(-position);
	vec3 worldView = normalize(normalMatrix * view);

	float realDepth = max(linearDepth(vUv), length(position));
	vec4 color = calculateCloudsColor(cameraPositionE5, -worldView, realDepth, normalize(lightDirection));

	if(needsFullUpdate == 0) {
		vec4 uvInPrevFrame = projectionMatrix * mvMatrixPrev * inverse(mvMatrixCurr) * vec4(10000000. * view, 1.0);
		vec2 prevUv = (uvInPrevFrame.xy / uvInPrevFrame.z) * 0.5 + 0.5;

		if(prevUv.x > 0. && prevUv.x < 1. && prevUv.y > 0. && prevUv.y < 1.) {
			vec4 prevColor = texture(tAccum, prevUv);
			FragColor = mix(prevColor, color, 0.05);
		} else {
			FragColor = color;
		}
	} else {
		FragColor = color;
	}
}
