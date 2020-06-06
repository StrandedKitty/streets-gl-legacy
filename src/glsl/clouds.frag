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
uniform vec3 cameraPositionE5;
uniform vec3 lightDirection;
uniform sampler2D tWeather;
uniform sampler2D tBlueNoise;
uniform sampler3D tNoise;
uniform sampler2D tAccum;
uniform float time;
uniform int needsFullUpdate;
uniform float densityFactor;
uniform float densityFactor2;
uniform float powderFactor;

#include <noise>
#include <clouds>

void main() {
	vec3 position = vec3(texture(tPosition, vUv));
	vec3 view = normalize(-position);
	vec3 worldView = normalize(normalMatrix * view);

	vec4 color = calculateCloudsColor(cameraPositionE5, -worldView, normalize(lightDirection));

	if(needsFullUpdate == 0) {
		vec4 uvInPrevFrame = projectionMatrix * mvMatrixPrev * inverse(mvMatrixCurr) * vec4(view * 1e10, 1.0);
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
