#version 300 es
precision highp float;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;

uniform sampler2D sampleTexture;
uniform float time;

const mat4 thresholdMatrix = mat4(
    1.0 / 17.0,  9.0 / 17.0,  3.0 / 17.0, 11.0 / 17.0,
    13.0 / 17.0,  5.0 / 17.0, 15.0 / 17.0,  7.0 / 17.0,
    4.0 / 17.0, 12.0 / 17.0,  2.0 / 17.0, 10.0 / 17.0,
    16.0 / 17.0,  8.0 / 17.0, 14.0 / 17.0,  6.0 / 17.0
);

float CubicOut(float k) {
    return --k * k * k + 1.;
}

void main() {
    float alpha = CubicOut(clamp(time, 0., 0.5) * 2.);
    float v = alpha - thresholdMatrix[int(gl_FragCoord.x) % 4][int(gl_FragCoord.y) % 4];

    if(v < 0.) discard;

    outColor = texture(sampleTexture, vUv * 8.);
    outNormal = vNormal * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(0, 1., 0, 1.);
}
