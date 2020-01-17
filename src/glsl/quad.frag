#version 300 es
precision highp float;
out vec4 FragColor;

#define TONEMAP_ACES 1
#define PI 3.141592653589793

in vec2 vUv;

uniform sampler2D uNormal;
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform sampler2D uPosition;
uniform sampler2D uMetallicRoughness;
uniform sampler2D uAO;
uniform float ambientIntensity;
uniform samplerCube sky;
uniform sampler2D tBRDF;
uniform mat3 normalMatrix;

struct Light {
    vec3 direction;
    float range;
    vec3 color;
    float intensity;
    vec3 position;
    float innerConeCos;
    float outerConeCos;
    int type;
    vec2 padding;
};

uniform Light uLight;

#include <tonemapping>

struct AngularInfo {
    float NdotL;                  // cos angle between normal and light direction
    float NdotV;                  // cos angle between normal and view direction
    float NdotH;                  // cos angle between normal and half vector
    float LdotH;                  // cos angle between light direction and half vector
    float VdotH;                  // cos angle between view direction and half vector
    vec3 padding;
};

struct MaterialInfo {
    float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)
    vec3 reflectance0;            // full reflectance color (normal incidence angle)
    float alphaRoughness;         // roughness mapped to a more linear change in the roughness
    vec3 diffuseColor;            // color contribution from diffuse lighting
    vec3 reflectance90;           // reflectance color at grazing angle
    vec3 specularColor;           // color contribution from specular lighting
};

AngularInfo getAngularInfo(vec3 pointToLight, vec3 normal, vec3 view) {
    vec3 n = normalize(normal);           // Outward direction of surface point
    vec3 v = normalize(view);             // Direction from surface point to view
    vec3 l = normalize(pointToLight);     // Direction from surface point to light
    vec3 h = normalize(l + v);            // Direction of the vector between l and v

    float NdotL = clamp(dot(n, l), 0.0, 1.0);
    float NdotV = clamp(dot(n, v), 0.0, 1.0);
    float NdotH = clamp(dot(n, h), 0.0, 1.0);
    float LdotH = clamp(dot(l, h), 0.0, 1.0);
    float VdotH = clamp(dot(v, h), 0.0, 1.0);

    return AngularInfo(
        NdotL,
        NdotV,
        NdotH,
        LdotH,
        VdotH,
        vec3(0, 0, 0)
    );
}

vec3 specularReflection(MaterialInfo materialInfo, AngularInfo angularInfo) {
    return materialInfo.reflectance0 + (materialInfo.reflectance90 - materialInfo.reflectance0) * pow(clamp(1.0 - angularInfo.VdotH, 0.0, 1.0), 5.0);
}

float visibilityOcclusion(MaterialInfo materialInfo, AngularInfo angularInfo) {
    float NdotL = angularInfo.NdotL;
    float NdotV = angularInfo.NdotV;
    float alphaRoughnessSq = materialInfo.alphaRoughness * materialInfo.alphaRoughness;

    float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);
    float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);

    float GGX = GGXV + GGXL;
    if (GGX > 0.0)
    {
        return 0.5 / GGX;
    }
    return 0.0;
}

float microfacetDistribution(MaterialInfo materialInfo, AngularInfo angularInfo) {
    float alphaRoughnessSq = materialInfo.alphaRoughness * materialInfo.alphaRoughness;
    float f = (angularInfo.NdotH * alphaRoughnessSq - angularInfo.NdotH) * angularInfo.NdotH + 1.0;
    return alphaRoughnessSq / (PI * f * f);
}

// Lambert lighting
// https://seblagarde.wordpress.com/2012/01/08/pi-or-not-to-pi-in-game-lighting-equation/
vec3 diffuse(MaterialInfo materialInfo) {
    return materialInfo.diffuseColor / PI;
}

vec3 getPointShade(vec3 pointToLight, MaterialInfo materialInfo, vec3 normal, vec3 view) {
    AngularInfo angularInfo = getAngularInfo(pointToLight, normal, view);

    if (angularInfo.NdotL > 0.0 || angularInfo.NdotV > 0.0) {
        // Calculate the shading terms for the microfacet specular shading model
        vec3 F = specularReflection(materialInfo, angularInfo);
        float Vis = visibilityOcclusion(materialInfo, angularInfo);
        float D = microfacetDistribution(materialInfo, angularInfo);

        // Calculation of analytical lighting contribution
        vec3 diffuseContrib = (1.0 - F) * diffuse(materialInfo);
        vec3 specContrib = F * Vis * D;

        // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
        return angularInfo.NdotL * (diffuseContrib + specContrib);
    }

    return vec3(0.0, 0.0, 0.0);
}

vec3 applyDirectionalLight(Light light, MaterialInfo materialInfo, vec3 normal, vec3 view) {
    vec3 pointToLight = -light.direction;
    vec3 shade = getPointShade(pointToLight, materialInfo, normal, view);
    return light.intensity * light.color * shade;
}

vec3 getIBLContribution(MaterialInfo materialInfo, vec3 n, vec3 v) {
    float NdotV = clamp(dot(n, v), 0.0, 1.0);

    float mipCount = 11.;
    float lod = clamp(materialInfo.perceptualRoughness * mipCount, 0.0, mipCount);
    vec3 reflection = normalize(reflect(-v, n));

    vec2 brdfSamplePoint = clamp(vec2(NdotV, materialInfo.perceptualRoughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
    vec2 brdf = texture(tBRDF, brdfSamplePoint).rg;

    vec4 diffuseSample = textureLod(sky, n, 0.);

    vec4 specularSample = textureLod(sky, reflection, lod);

    vec3 diffuseLight = SRGBtoLINEAR(diffuseSample).rgb;
    vec3 specularLight = SRGBtoLINEAR(specularSample).rgb;

    vec3 diffuse = diffuseLight * materialInfo.diffuseColor;
    vec3 specular = specularLight * (materialInfo.specularColor * brdf.x + brdf.y);

    return diffuse + specular;
}

void main() {
    // MATERIAL

    float perceptualRoughness = 0.0;
    float metallic = 0.0;
    vec4 baseColor = vec4(0.0, 0.0, 0.0, 1.0);
    vec3 diffuseColor = vec3(0.0);
    vec3 specularColor = vec3(0.0);
    vec3 f0 = vec3(0.04);

    vec4 mrSample = texture(uMetallicRoughness, vUv);
    metallic = mrSample.r;
    perceptualRoughness = mrSample.g;
    //f0 = vec3(mrSample.b);
    baseColor = SRGBtoLINEAR(texture(uColor, vUv));
    diffuseColor = baseColor.rgb * (vec3(1.0) - f0) * (1.0 - metallic);
    specularColor = mix(f0, baseColor.rgb, metallic);

    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(clamp(reflectance * 50.0, 0.0, 1.0));

    MaterialInfo materialInfo = MaterialInfo(
        perceptualRoughness,
        specularEnvironmentR0,
        alphaRoughness,
        diffuseColor,
        specularEnvironmentR90,
        specularColor
    );

    // LIGHTING

    vec3 color = vec3(0.0, 0.0, 0.0);
    vec3 normal = normalize(texture(uNormal, vUv).xyz * 2. - 1.);
    vec3 position = vec3(texture(uPosition, vUv));
    vec3 cameraPosition = vec3(0, 0, 0);
    vec3 view = normalize(cameraPosition - position);

    vec3 worldView = normalize(normalMatrix * view);
    vec3 worldNormal = normalize(normalMatrix * normal);

    Light light = uLight;

    color += applyDirectionalLight(light, materialInfo, worldNormal, worldView);
    color += materialInfo.diffuseColor * ambientIntensity;
    color += getIBLContribution(materialInfo, worldNormal, worldView);

    // AO

    float ao = 1.0;
    float occlusionStrength = 1.0;
    ao = texture(uAO, vUv).r;
    color = mix(color, color * ao, occlusionStrength);

    // OUT

    FragColor = vec4(toneMap(color), baseColor.a);
}