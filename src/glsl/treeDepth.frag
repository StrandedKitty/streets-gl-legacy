#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
precision highp sampler2DArray;

out vec4 outColor;

in vec3 vNormal;
in vec3 vPosition;
in vec2 vUv;
flat in int vType;

uniform sampler2DArray tDiffuse;

vec4 readDiffuse(const vec2 uv) {
    return texture(tDiffuse, vec3(uv, vType));
}

void main() {
    if(readDiffuse(vUv).a < 0.5) discard;

    outColor = vec4(vec3(-vPosition.z), 1.);
}
