#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
precision highp sampler2DArray;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
in vec3 vNormal;
in vec3 vPosition;
in vec2 vUv;
flat in int vInstanceID;
flat in int vType;

uniform sampler2DArray tDiffuse;
uniform sampler2DArray tNormal;
uniform sampler2D tVolumeNormal;

vec4 readDiffuse(const vec2 uv) {
    return texture(tDiffuse, vec3(uv, vType));
}

vec4 readNormal(const vec2 uv) {
    return texture(tNormal, vec3(uv, vType));
}

vec3 getNormal() {
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

    vec3 map1 = readNormal(vUv).rgb * 2. - 1.;
    vec3 map2 = texture(tVolumeNormal, vUv).rgb * 2. - 1.;

    vec3 normal = normalize(tbn * mix(map1, map2, 0.5));

    normal *= float(gl_FrontFacing) * 2.0 - 1.0;

    return normal;
}

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

#include <noise>

vec4 modifyTreeColor(const vec4 color) {
    vec3 hsv = rgb2hsv(color.rgb);
    hsv.x = 0.15 + noise(float(vInstanceID)) * 0.1;

    return vec4(hsv2rgb(hsv), color.a);
}

void main() {
    vec4 diffuse = modifyTreeColor(readDiffuse(vUv));
    if(diffuse.a < 0.5) discard;

    float metalness = 0.01;
    float roughness = 0.9;
    float specular = 0.01;

    outColor = vec4(diffuse.rgb, 1.);
    vec3 normal = getNormal();

    outNormal = normal * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(metalness, roughness, specular, 1.);
}
