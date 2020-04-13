#version 300 es
precision highp float;
out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tHDR;
uniform float uThreshold;

const float smoothWidth = 1.;

void main() {
    vec3 hdrValue = texture(tHDR, vUv).rgb;
    float v = dot(hdrValue, vec3(0.2126, 0.7152, 0.0722));
    float alpha = smoothstep(uThreshold, uThreshold + smoothWidth, v);

    FragColor = vec4(hdrValue * alpha, 1);
}
