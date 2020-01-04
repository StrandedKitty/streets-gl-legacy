#version 300 es
precision highp float;

#define SMAA_MAX_SEARCH_STEPS 8
#define SMAA_AREATEX_MAX_DISTANCE 16
#define SMAA_AREATEX_PIXEL_SIZE	(1.0 / vec2( 160.0, 560.0))
#define SMAA_AREATEX_SUBTEX_SIZE (1.0 / 7.0)
#define SMAASampleLevelZeroOffset(tex, coord, offset) texture(tex, coord + float(offset) * resolution, 0.0)

uniform sampler2D tDiffuse;
uniform sampler2D tArea;
uniform sampler2D tSearch;
uniform vec2 resolution;

in vec2 vUv;
in vec4 vOffset[3];
in vec2 vPixcoord;

out vec4 FragColor;

vec2 round(vec2 x) {
    return sign(x) * floor(abs(x) + 0.5);
}

float SMAASearchLength(sampler2D searchTex, vec2 e, float bias, float scale) {
    e.r = bias + e.r * scale;
    return 255.0 * texture(searchTex, e, 0.0).r;
}

float SMAASearchXLeft(sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end) {
    vec2 e = vec2(0.0, 1.0);

    for (int i = 0; i < SMAA_MAX_SEARCH_STEPS; i ++) {
        e = texture(edgesTex, texcoord, 0.0).rg;
        texcoord -= vec2(2.0, 0.0) * resolution;
        if (! (texcoord.x > end && e.g > 0.8281 && e.r == 0.0)) break;
    }

    texcoord.x += 0.25 * resolution.x;
    texcoord.x += resolution.x;
    texcoord.x += 2.0 * resolution.x;
    texcoord.x -= resolution.x * SMAASearchLength(searchTex, e, 0.0, 0.5);

    return texcoord.x;
}

float SMAASearchXRight(sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end) {
    vec2 e = vec2(0.0, 1.0);

    for (int i = 0; i < SMAA_MAX_SEARCH_STEPS; i ++) {
        e = texture(edgesTex, texcoord, 0.0).rg;
        texcoord += vec2(2.0, 0.0) * resolution;
        if (! (texcoord.x < end && e.g > 0.8281 && e.r == 0.0)) break;
    }

    texcoord.x -= 0.25 * resolution.x;
    texcoord.x -= resolution.x;
    texcoord.x -= 2.0 * resolution.x;
    texcoord.x += resolution.x * SMAASearchLength(searchTex, e, 0.5, 0.5);

    return texcoord.x;
}

float SMAASearchYUp(sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end) {
    vec2 e = vec2(1.0, 0.0);

    for (int i = 0; i < SMAA_MAX_SEARCH_STEPS; i ++) {
        e = texture(edgesTex, texcoord, 0.0).rg;
        texcoord += vec2(0.0, 2.0) * resolution;
        if (! (texcoord.y > end && e.r > 0.8281 && e.g == 0.0)) break;
    }

    texcoord.y -= 0.25 * resolution.y;
    texcoord.y -= resolution.y;
    texcoord.y -= 2.0 * resolution.y;
    texcoord.y += resolution.y * SMAASearchLength(searchTex, e.gr, 0.0, 0.5);

    return texcoord.y;
}

float SMAASearchYDown(sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end) {
    vec2 e = vec2(1.0, 0.0);

    for (int i = 0; i < SMAA_MAX_SEARCH_STEPS; i ++) {
        e = texture(edgesTex, texcoord, 0.0).rg;
        texcoord -= vec2(0.0, 2.0) * resolution;
        if (! (texcoord.y < end && e.r > 0.8281 && e.g == 0.0)) break;
    }

    texcoord.y += 0.25 * resolution.y;
    texcoord.y += resolution.y;
    texcoord.y += 2.0 * resolution.y;
    texcoord.y -= resolution.y * SMAASearchLength(searchTex, e.gr, 0.5, 0.5);

    return texcoord.y;
}

vec2 SMAAArea(sampler2D areaTex, vec2 dist, float e1, float e2, float offset) {
    vec2 texcoord = float(SMAA_AREATEX_MAX_DISTANCE) * round(4.0 * vec2(e1, e2)) + dist;

    texcoord = SMAA_AREATEX_PIXEL_SIZE * texcoord + (0.5 * SMAA_AREATEX_PIXEL_SIZE);

    texcoord.y += SMAA_AREATEX_SUBTEX_SIZE * offset;

    return texture(areaTex, texcoord, 0.0).rg;
}

vec4 SMAABlendingWeightCalculationPS(vec2 texcoord, vec2 pixcoord, vec4 offset[3], sampler2D edgesTex, sampler2D areaTex, sampler2D searchTex, ivec4 subsampleIndices) {
    vec4 weights = vec4(0.0, 0.0, 0.0, 0.0);

    vec2 e = texture(edgesTex, texcoord).rg;

    if (e.g > 0.0) {
        vec2 d;

        vec2 coords;
        coords.x = SMAASearchXLeft(edgesTex, searchTex, offset[0].xy, offset[2].x);
        coords.y = offset[1].y;// offset[1].y = texcoord.y - 0.25 * resolution.y (@CROSSING_OFFSET)
        d.x = coords.x;

        float e1 = texture(edgesTex, coords, 0.0).r;

        coords.x = SMAASearchXRight(edgesTex, searchTex, offset[0].zw, offset[2].y);
        d.y = coords.x;

        d = d / resolution.x - pixcoord.x;

        vec2 sqrt_d = sqrt(abs(d));

        coords.y -= 1.0 * resolution.y;
        float e2 = SMAASampleLevelZeroOffset(edgesTex, coords, ivec2(1, 0)).r;

        weights.rg = SMAAArea(areaTex, sqrt_d, e1, e2, float(subsampleIndices.y));
    }

    if (e.r > 0.0) {
        vec2 d;
        vec2 coords;

        coords.y = SMAASearchYUp(edgesTex, searchTex, offset[1].xy, offset[2].z);
        coords.x = offset[0].x;
        d.x = coords.y;

        float e1 = texture(edgesTex, coords, 0.0).g;

        coords.y = SMAASearchYDown(edgesTex, searchTex, offset[1].zw, offset[2].w);
        d.y = coords.y;

        d = d / resolution.y - pixcoord.y;

        vec2 sqrt_d = sqrt(abs(d));

        coords.y -= 1.0 * resolution.y;
        float e2 = SMAASampleLevelZeroOffset(edgesTex, coords, ivec2(0, 1)).g;

        weights.ba = SMAAArea(areaTex, sqrt_d, e1, e2, float(subsampleIndices.x));
    }

    return weights;
}

void main() {
    FragColor = SMAABlendingWeightCalculationPS(vUv, vPixcoord, vOffset, tDiffuse, tArea, tSearch, ivec4(0.0));
}