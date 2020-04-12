#version 300 es
precision highp float;
out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tHDR;
uniform sampler2D tBloom;
uniform float uBloomStrength;

#include <tonemapping>

void main() {
    vec3 hdrValue = texture(tHDR, vUv).rgb + texture(tBloom, vUv).rgb * uBloomStrength;
    FragColor = vec4(toneMap(hdrValue), 1);
}
