#version 300 es
precision highp float;
out vec4 FragColor;

#define SAMPLES 16

in vec2 vUv;

uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 resolution;
uniform float samplerOffsets[SAMPLES];
uniform vec2 direction;
uniform float texelSize;

float linearizeDepth(float depth) {
    float near = 1.;
    float far = 10000.;
    float z = depth * 2.0 - 1.0;
    return ((2.0 * near * far) / (far + near - z * (far - near)) - near) / (far - near);
}

void main() {
    float compareDepth = linearizeDepth(texture(tDepth, vUv).r);
    float size = texelSize / (length(resolution * direction));
    vec3 result = vec3(0);
    float weightSum = 0.0;

    for (int i = 0; i < SAMPLES; ++i) {
        vec2 sampleOffset = vec2(size * samplerOffsets[i]) * direction;
        vec2 samplePos = vUv + sampleOffset;
        float sampleDepth = linearizeDepth(texture(tDepth, samplePos).r);
        float weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30000.0);
        result += texture(tColor, samplePos).rgb * weight;
        weightSum += weight;
    }

    result /= weightSum;
    FragColor.rgb = vec3(result);
    FragColor.a = 1.0;
}