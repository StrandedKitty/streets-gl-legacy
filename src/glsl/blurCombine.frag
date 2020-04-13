#version 300 es
precision highp float;
out vec4 FragColor;

in vec2 vUv;

#define PASSES 4

uniform sampler2D maps[PASSES];

void main() {
    vec3 sum = vec3(0);

    sum += texture(maps[0], vUv).rgb;
    sum += texture(maps[1], vUv).rgb;
    sum += texture(maps[2], vUv).rgb;
    sum += texture(maps[3], vUv).rgb;

    FragColor = vec4(sum, 1);
}
