#version 300 es
precision highp float;

in vec2 vUv;
out vec4 FragColor;

uniform mat4 cameraMatrixWorld;
uniform mat4 cameraMatrixWorldInverse;
uniform sampler2D uPosition;
uniform vec3 lightDirection;
uniform float asymmetryFactor;

#define PI 3.141592653589793
#define PI2 6.28318530718
#define SHADOWMAP_SIZE 1000.
#define CSM_CASCADES 3
#define NB_STEPS 16

struct Cascade {
	sampler2D shadowMap;
	float resolution;
	float size;
	float bias;
	mat4 matrixWorldInverse;
};

uniform Cascade[CSM_CASCADES] cascades;
uniform float[CSM_CASCADES + 1] shadowSplits;

#include <shadowmapping>

const mat4 ditherPattern = mat4(
	0.0, 0.5, 0.125, 0.625,
	0.75, 0.22, 0.875, 0.375,
	0.1875, 0.6875, 0.0625, 0.5625,
	0.9375, 0.4375, 0.8125, 0.3125
);

// Henyey–Greenstein phase function
float computeScattering(float lightDotView) {
	float G_SCATTERING = asymmetryFactor;

	float result = 1. - G_SCATTERING * G_SCATTERING;
	result /= (4. * PI * pow(1. + G_SCATTERING * G_SCATTERING - (2. * G_SCATTERING) * lightDotView, 1.5));
	return result;
}

void main() {
	vec3 position = vec3(texture(uPosition, vUv));
	vec3 worldPosition = vec3(cameraMatrixWorld * vec4(position, 1.));
	vec3 cameraWorldPosition = vec3(cameraMatrixWorld * vec4(0, 0, 0, 1.));

	float accumFog = 0.;

	vec3 startPosition = cameraWorldPosition;

	vec3 rayVector = worldPosition.xyz - startPosition;
	float rayLength = length(rayVector);
	vec3 rayDirection = rayVector / rayLength;

	float stepLength = rayLength / float(NB_STEPS);
	vec3 step = rayDirection * stepLength;

	startPosition += step * ditherPattern[int(gl_FragCoord.x) % 4][int(gl_FragCoord.y) % 4];
	vec3 currentPosition = startPosition;

	for (int i = 0; i < NB_STEPS; i++) {
		vec4 cameraSpacePosition = cameraMatrixWorldInverse * vec4(currentPosition, 1.);

		int cascadeId = 0;

		for (int i = 0; i < CSM_CASCADES; i++) {
			if (-cameraSpacePosition.z > shadowSplits[i] && -cameraSpacePosition.z <= shadowSplits[i + 1]) cascadeId = i;
		}

		float shadowMapValue;

		if (cascadeId == 0) {
			vec4 shadowPosition = cascades[0].matrixWorldInverse * vec4(currentPosition, 1.);
			shadowMapValue = getShadow(cascades[0].shadowMap, 0., shadowPosition, cascades[0].size);
		} else if (cascadeId == 1) {
			vec4 shadowPosition = cascades[1].matrixWorldInverse * vec4(currentPosition, 1.);
			shadowMapValue = getShadow(cascades[1].shadowMap, 0., shadowPosition, cascades[1].size);
		} else if (cascadeId == 2) {
			vec4 shadowPosition = cascades[2].matrixWorldInverse * vec4(currentPosition, 1.);
			shadowMapValue = getShadow(cascades[2].shadowMap, 0., shadowPosition, cascades[2].size);
		}

		if (shadowMapValue > 0.) {
			accumFog += computeScattering(dot(rayDirection, -lightDirection));
		}

		currentPosition += step;
	}

	accumFog /= float(NB_STEPS);
	accumFog *= rayLength / 400.;

	FragColor = vec4(vec3(accumFog), 1.0);
}
