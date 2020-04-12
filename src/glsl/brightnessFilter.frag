#version 300 es
precision highp float;
out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tHDR;
uniform float uThreshold;

void main() {
    vec3 hdrValue = texture(tHDR, vUv).rgb;
    float brightness = dot(hdrValue, vec3(0.2126, 0.7152, 0.0722));
    FragColor = vec4(brightness > uThreshold ? hdrValue : vec3(0), 1);
}
