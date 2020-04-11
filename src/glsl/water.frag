#version 300 es
precision highp float;
precision highp sampler2DArray;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;

in vec3 vPosition;
in vec3 vNormal;
in vec3 vLocalPosition;
in vec2 vUv;

uniform sampler2D tNormal;
uniform float time;

#define TILE_SIZE 611.496226

vec3 tbn(vec3 mapValue) {
    vec2 uv = gl_FrontFacing ? vUv : -vUv;

    vec3 pos_dx = dFdx(vPosition);
    vec3 pos_dy = dFdy(vPosition);
    vec3 tex_dx = dFdx(vec3(uv, 0.0));
    vec3 tex_dy = dFdy(vec3(uv, 0.0));
    vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

    vec3 ng = normalize(vNormal);

    t = normalize(t - ng * dot(ng, t));
    vec3 b = normalize(cross(ng, t));
    mat3 tbn = mat3(t, b, ng);

    vec3 normal = normalize(tbn * mapValue);

    normal *= float(gl_FrontFacing) * 2.0 - 1.0;

    return normal;
}

void clip(vec3 position) {
    if (
    position.x < 0. || position.x >= TILE_SIZE ||
    position.z < 0. || position.z >= TILE_SIZE
    ) discard;
}

void main() {
    clip(vLocalPosition);

    vec2 uv = vLocalPosition.xz / TILE_SIZE;
    float waveTime = time * 0.1;
    vec2 uvOffsets[3] = vec2[](
        vec2(0.4, 0) * waveTime,
        vec2(0.3, 0.1) * waveTime,
        vec2(0, 0.2) * waveTime
    );

    vec3 normalValue =
        texture(tNormal, uv * 2. + uvOffsets[0]).rgb * 0.4 +
        texture(tNormal, uv * 5. + uvOffsets[1]).rgb * 0.5 +
        texture(tNormal, uv * 7. + uvOffsets[2]).rgb * 0.1;

    normalValue = normalValue * 2. - 1.;
    vec3 normal = tbn(normalValue);

    outColor = vec4(0.1, 0.3, 0.5, 1);
    outNormal = normal * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(0, 0.1, 0.1, 1.);
}
