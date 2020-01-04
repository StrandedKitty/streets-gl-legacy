#version 300 es
precision highp float;

uniform sampler2D tDiffuse;
uniform sampler2D tColor;
uniform vec2 resolution;

in vec2 vUv;
in vec4 vOffset[2];

out vec4 FragColor;

vec4 SMAANeighborhoodBlendingPS(vec2 texcoord, vec4 offset[2], sampler2D colorTex, sampler2D blendTex) {
    vec4 a;
    a.xz = texture(blendTex, texcoord).xz;
    a.y = texture(blendTex, offset[1].zw).g;
    a.w = texture(blendTex, offset[1].xy).a;

    if (dot(a, vec4(1.0, 1.0, 1.0, 1.0)) < 1e-5) {
        return texture(colorTex, texcoord, 0.0);
    } else {
        vec2 offset;
        offset.x = a.a > a.b ? a.a : -a.b;
        offset.y = a.g > a.r ? -a.g : a.r;

        if (abs(offset.x) > abs(offset.y)) {
            offset.y = 0.0;
        } else {
            offset.x = 0.0;
        }

        vec4 C = texture(colorTex, texcoord, 0.0);
        texcoord += sign(offset) * resolution;
        vec4 Cop = texture(colorTex, texcoord, 0.0);
        float s = abs(offset.x) > abs(offset.y) ? abs(offset.x) : abs(offset.y);

        C.xyz = pow(C.xyz, vec3(2.2));
        Cop.xyz = pow(Cop.xyz, vec3(2.2));
        vec4 mixed = mix(C, Cop, s);
        mixed.xyz = pow(mixed.xyz, vec3(1.0 / 2.2));

        return mixed;
    }
}

void main() {
    FragColor = SMAANeighborhoodBlendingPS(vUv, vOffset, tColor, tDiffuse);
}