#version 300 es
precision highp float;

in vec2 vUv;

out vec4 FragColor;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D texNoise;
uniform mat4 cameraProjectionMatrix;
uniform vec3 samples[64];
uniform vec2 resolution;

int kernelSize = 64;
float radius = 0.5;
float bias = 0.025;

void main() {
	vec2 noiseScale = resolution / vec2(4, 4);

    // get input for SSAO algorithm
    vec3 fragPos = texture(gPosition, vUv).xyz;
    vec3 normal = normalize(texture(gNormal, vUv).rgb * 2. - 1.);
    vec3 randomVec = normalize(texture(texNoise, vUv * noiseScale).xyz * 2. - 1.);
    // create TBN change-of-basis matrix: from tangent-space to view-space
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);
    // iterate over the sample kernel and calculate occlusion factor
    float occlusion = 0.0;
    for (int i = 0; i < kernelSize; ++i){
		// get sample position
		vec3 spl = TBN * samples[i];// from tangent to view-space
		spl = fragPos + spl * radius;

		// project sample position (to sample texture) (to get position on screen/texture)
		vec4 offset = vec4(spl, 1.0);
		offset = cameraProjectionMatrix * offset;// from view to clip-space
		offset.xyz /= offset.w;// perspective divide
		offset.xyz = offset.xyz * 0.5 + 0.5;// transform to range 0.0 - 1.0

		// get sample depth
		float sampleDepth = texture(gPosition, offset.xy).z;// get depth value of kernel sample

		// range check & accumulate
		float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleDepth));
		occlusion += (sampleDepth >= spl.z + bias ? 1.0 : 0.0) * rangeCheck;
	}
	occlusion = 1.0 - (occlusion / float(kernelSize));

	FragColor = vec4(vec3(occlusion), 1);
	if(vUv.x > 0.5) FragColor = vec4(samples[0], 1);
}