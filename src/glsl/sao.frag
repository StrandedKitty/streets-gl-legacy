#version 300 es
precision highp float;

in vec2 vUv;

out vec4 FragColor;

uniform sampler2D tPosition;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform sampler2D tNoise;
uniform vec3 samples[64];
uniform mat4 cameraProjectionMatrix;
uniform vec2 resolution;

float linearizeDepth(float depth) {
	float near = 1.;
	float far = 10000.;
	float z = depth * 2.0 - 1.0;
	return (2.0 * near * far) / (far + near - z * (far - near));
}

vec3 readNormal(const vec2 uv) {
	return texture(tNormal, uv).rgb * 2. - 1.;
}

vec3 readPosition(const vec2 uv) {
	return texture(tPosition, uv).rgb;
}

float readDepth(const vec2 uv) {
	return readPosition(uv).z;
}

const int kernelSize = 32;
const float radius = 15.;
const float bias = 1.0;

void main() {
	vec2 noiseScale = resolution / 4.;

	vec3 fragPos = readPosition(vUv);
	vec3 normal = normalize(readNormal(vUv));
	float depth = readDepth(vUv);
	vec3 randomVec = normalize(texture(tNoise, vUv * noiseScale).xyz);

	vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
	vec3 bitangent = cross(normal, tangent);
	mat3 TBN = mat3(tangent, bitangent, normal);

	float occlusion = 0.0;

	for(int i = 0; i < kernelSize; ++i) {
		vec3 smple = TBN * samples[i];
		smple = fragPos + smple * radius;

		vec4 offset = vec4(smple, 1.0);
		offset = cameraProjectionMatrix * offset;
		offset.xyz /= offset.w;
		offset.xyz = offset.xyz * 0.5 + 0.5;

		float sampleDepth = readDepth(offset.xy);

		float rangeCheck = smoothstep(0.0, 1.0, radius / abs(depth - sampleDepth));
		occlusion += (sampleDepth >= smple.z + bias ? 1.0 : 0.0) * rangeCheck;
	}

	occlusion = 1.0 - (occlusion / float(kernelSize));

	FragColor = vec4(vec3(occlusion), 1.0);
	FragColor.a = 1.;
}