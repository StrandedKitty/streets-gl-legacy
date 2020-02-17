#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;

in vec3 vNormal;
in vec3 vPosition;
in vec2 vUv;
flat in int vInstanceID;

uniform sampler2D tDiffuse;
uniform sampler2D tNormal;

vec4 readDiffuse(const vec2 uv) {
    return texture(tDiffuse, uv);
}

vec4 readNormal(const vec2 uv) {
    return texture(tNormal, uv);
}

vec3 getNormal() {
    vec3 pos_dx = dFdx(vPosition);
    vec3 pos_dy = dFdy(vPosition);
    vec3 tex_dx = dFdx(vec3(vUv, 0.0));
    vec3 tex_dy = dFdy(vec3(vUv, 0.0));
    vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

    vec3 ng = normalize(vNormal);

    t = normalize(t - ng * dot(ng, t));
    vec3 b = normalize(cross(ng, t));
    mat3 tbn = mat3(t, b, ng);

    vec3 map = readNormal(vUv).rgb * 2. - 1.;

    vec3 normal = normalize(tbn * map);

    return normal;
}

void main() {
    vec4 diffuse = readDiffuse(vUv);

    float metalness = 0.01;
    float roughness = 0.7;
    float specular = 0.01;

    outColor = vec4(diffuse.rgb, 1.);
    vec3 normal = getNormal() * (float(gl_FrontFacing) * 2.0 - 1.0);
    outNormal = normal * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(metalness, roughness, specular, 1.);
}
