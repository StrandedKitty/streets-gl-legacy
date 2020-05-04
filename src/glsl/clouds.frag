#version 300 es
precision highp float;
precision highp int;
precision highp sampler3D;

in vec2 vUv;
out vec4 FragColor;

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
uniform float needsFullUpdate;
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

	float cloudsDepth = 0.;

	float realDepth = max(linearDepth(vUv), length(position));
	vec4 color = calculateCloudsColor(cameraPositionE5, -worldView, realDepth, normalize(lightDirection), cloudsDepth);

	FragColor = mix(accumColor, color, 0.05);
	if(needsFullUpdate == 1.) FragColor = color;
}
