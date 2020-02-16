#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
out vec4 outColor;

in vec3 vNormal;
in vec3 vPosition;
in vec2 vUv;
flat in int vType;

uniform sampler2D tDiffuse[2];

vec4 readDiffuse(const vec2 uv) {
    if(vType == 0) return texture(tDiffuse[0], uv);
    if(vType == 1) return texture(tDiffuse[1], uv);
    else return vec4(1, 0, 1, 1);
}

void main() {
    if(readDiffuse(vUv).a < 0.5) discard;

    outColor = vec4(vec3(-vPosition.z), 1.);
}
