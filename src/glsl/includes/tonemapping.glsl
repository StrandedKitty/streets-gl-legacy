uniform float uExposure;

const float GAMMA = 2.2;
const float INV_GAMMA = 1.0 / GAMMA;

vec3 LINEARtoSRGB(vec3 color) {
    return pow(color, vec3(INV_GAMMA));
}

vec4 SRGBtoLINEAR(vec4 srgbIn) {
    return vec4(pow(srgbIn.xyz, vec3(GAMMA)), srgbIn.w);
}

// ACES tone map
// see: https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
vec3 toneMapACES(vec3 color) {
    const float A = 2.51;
    const float B = 0.03;
    const float C = 2.43;
    const float D = 0.59;
    const float E = 0.14;
    return LINEARtoSRGB(clamp((color * (A * color + B)) / (color * (C * color + D) + E), 0.0, 1.0));
}

vec3 toneMap(vec3 color) {
    color *= uExposure;

    #ifdef TONEMAP_ACES
        return toneMapACES(color);
    #endif

    return LINEARtoSRGB(color);
}