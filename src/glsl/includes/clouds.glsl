#define CLOUDS_STEPS 12
#define CLOUDS_STEPS_LIGHT 6
#define CLOUDS_MIN_HEIGHT 3000.
#define CLOUDS_THICKNESS 4000.
#define CLOUDS_DEPTH 0
#define CLOUDS_MIN_TRANSMITTANCE 0.1
#define CLOUDS_EARTH_RADIUS 6371000.
#define CLOUDS_SPHERE_RADIUS_NEAR (CLOUDS_EARTH_RADIUS + CLOUDS_MIN_HEIGHT)
#define CLOUDS_SPHERE_RADIUS_FAR (CLOUDS_EARTH_RADIUS + CLOUDS_MIN_HEIGHT + CLOUDS_THICKNESS)

#define CLOUDS_FORWARD_SCATTERING_G 0.4
#define CLOUDS_BACKWARD_SCATTERING_G -0.2
#define CLOUDS_SCATTERING_LERP 0.5

#define CLOUDS_MAP_SCALE 100000.

#define CLOUDS_WIND_VECTOR vec2(1, 0)
#define CLOUDS_WIND_SPEED 100.

float hitSphere(vec3 sphereCenter, float sphereRadius, vec3 rayOrigin, vec3 rayDir) {
    vec3 oc = rayOrigin - sphereCenter;
    float a = dot(rayDir, rayDir);
    float b = 2.0 * dot(oc, rayDir);
    float c = dot(oc, oc) - sphereRadius * sphereRadius;
    float discriminant = b * b - 4. * a * c;

    if (discriminant < 0.0) {
        return -1.0;
    } else {
        float numerator = -b - sqrt(discriminant);
        if (numerator > 0.0) {
            return numerator / (2.0 * a);
        }

        numerator = -b + sqrt(discriminant);
        if (numerator > 0.0) {
            return numerator / (2.0 * a);
        }
        else {
            return -1.0;
        }
    }
}

float remap(float original_value, float original_min, float original_max, float new_min , float new_max) {
    return new_min + (((original_value - original_min) / (original_max - original_min)) * (new_max - new_min));
}

float sampleCloudMap(vec3 pos) {
    vec2 uv = (pos.xz + time * CLOUDS_WIND_VECTOR * CLOUDS_WIND_SPEED) / CLOUDS_MAP_SCALE;
    return texture(tWeather, uv).x;
}

vec2 sampleCloudNoise(vec3 pos) {
    vec4 color = texture(tNoise, pos.xzy / CLOUDS_THICKNESS).rgba;
    return color.rg;
}

float getHeightFractionForPoint(vec3 inPosition)
{
    float height_fraction = (inPosition.y - CLOUDS_MIN_HEIGHT) / CLOUDS_THICKNESS;
    return clamp(height_fraction, 0., 1.);
}

float getDensityHeightGradientForPoint(vec3 pos, vec3 weather) {
    vec3 sphereCenter = vec3(0, -CLOUDS_EARTH_RADIUS, 0);
    float distanceToEarthCenter = distance(sphereCenter, pos);
    float positionInDome = (distanceToEarthCenter - CLOUDS_SPHERE_RADIUS_NEAR) / CLOUDS_THICKNESS;
    return 1. - smoothstep(0., 0.5, positionInDome - 0.5) - smoothstep(0., 0.2, 1. - positionInDome - 0.8);
}

float sampleCloudDensity(vec3 pos) {
    vec3 weather_data = vec3(sampleCloudMap(pos), 1, 1);

    vec2 noiseSample = sampleCloudNoise(pos);

    // Build an FBM out of the low frequency Worley noises
    // that can be used to add detail to the low−frequency
    // Perlin−Worley noise.
    float low_freq_FBM = noiseSample.g;

    // Define the base cloud shape by dilating it with the
    // low−frequency FBM made of Worley noise.
    float base_cloud = remap(noiseSample.r, low_freq_FBM - 1., 1., 0., 1.);

    // Get the density−height gradient using the density height function.
    float density_height_gradient = getDensityHeightGradientForPoint(pos, weather_data);

    // Apply the height function to the base cloud shape.
    base_cloud *= density_height_gradient;

    float cloud_coverage = clamp(weather_data.r + densityFactor2, 0., 1.);

    // Use remap to apply the cloud coverage attribute.
    float base_cloud_with_coverage = remap(base_cloud, cloud_coverage, 1.0, 0.0, 1.0);
    base_cloud_with_coverage *= cloud_coverage;

    /*float high_freq_FBM = sampleCloudDetails(pos);

    float height_fraction = getHeightFractionForPoint(pos);

    float high_freq_noise_modifier = mix(high_freq_FBM, 1.0 - high_freq_FBM, clamp(height_fraction * 10., 0., 1.));
    //high_freq_noise_modifier = clamp(high_freq_noise_modifier, 0.0, 1.0);
    float final_cloud = remap(base_cloud_with_coverage, high_freq_noise_modifier * 0.2, 1.0, 0.0, 1.0);*/

    return max(0., base_cloud_with_coverage) * densityFactor;
}

float beers(float density) {
    return exp(-density);
}

float powder(float density) {
    return 1.0 - exp(-density * 2.0);
}

float henyeyGreenstein(float lightDotView, float g) {
    float gg = g * g;
    return (1. - gg) / pow(1. + gg - 2. * g * lightDotView, 1.5);
}

float phase(float lightDirDot) {
    return mix(
        henyeyGreenstein(lightDirDot, CLOUDS_FORWARD_SCATTERING_G),
        henyeyGreenstein(lightDirDot, CLOUDS_BACKWARD_SCATTERING_G),
        CLOUDS_SCATTERING_LERP
    );
}

vec3 boundsMin = vec3(-1000000000, CLOUDS_MIN_HEIGHT, -1000000000);
vec3 boundsMax = vec3(1000000000, CLOUDS_MIN_HEIGHT + CLOUDS_THICKNESS, 1000000000);
float lightAbsorptionTowardSun = 1.21;
float lightAbsorptionThroughCloud = 0.75;

float lightmarch(vec3 position, vec3 lightDir, float angle) {
    vec3 dirToLight = -lightDir;

    vec3 sphereCenter = vec3(0, -CLOUDS_EARTH_RADIUS, 0);
    float dstToNearSphere = hitSphere(sphereCenter, CLOUDS_SPHERE_RADIUS_NEAR, position, dirToLight);
    float dstToFarSphere = hitSphere(sphereCenter, CLOUDS_SPHERE_RADIUS_FAR, position, dirToLight);

    float dstInsideBox = abs(dstToFarSphere) - abs(dstToNearSphere);

    float stepSize = dstInsideBox / float(CLOUDS_STEPS_LIGHT);
    float totalDensity = 0.;

    vec2 noiseTexel = vec2(gl_FragCoord - floor(time * 1000.)) / vec2(textureSize(tBlueNoise, 0));
    float noise = texture(tBlueNoise, noiseTexel).g;

    stepSize = min(stepSize, 512.);

    position += dirToLight * stepSize * (noise + 0.1);

    float transmittance = 1.;

    for (int i = 0; i < CLOUDS_STEPS_LIGHT; i++) {
        float density = sampleCloudDensity(position);
        totalDensity += density * stepSize;

        //transmittance *= beers(density * stepSize * lightAbsorptionTowardSun);
        transmittance *= beers(density * stepSize);

        position += dirToLight * stepSize;

        if (transmittance < CLOUDS_MIN_TRANSMITTANCE) {
            break;
        }
    }

    return 2. * transmittance * (powder(totalDensity) + powderFactor) * phase(angle);
}

vec4 calculateCloudsColor(vec3 rayOrigin, vec3 rayDir, vec3 lightDir) {
    float cloudDensity = 0.;

    vec3 sphereCenter = vec3(0, -CLOUDS_EARTH_RADIUS, 0);
    float dstToNearSphere = hitSphere(sphereCenter, CLOUDS_SPHERE_RADIUS_NEAR, rayOrigin, rayDir);
    float dstToFarSphere = hitSphere(sphereCenter, CLOUDS_SPHERE_RADIUS_FAR, rayOrigin, rayDir);

    float dstToBox = abs(dstToNearSphere);
    float dstInsideBox = abs(dstToFarSphere) - abs(dstToNearSphere);

    float cosAngle = dot(normalize(rayDir), normalize(-lightDir));

    float transmittance = 1.;
    vec3 lightEnergy = vec3(0);

    vec2 noiseTexel = vec2(gl_FragCoord + floor(time * 1000.)) / vec2(textureSize(tBlueNoise, 0));
    vec2 noiseTexelStatic = vec2(gl_FragCoord) / vec2(textureSize(tBlueNoise, 0));
    float noise = texture(tBlueNoise, noiseTexel).r;
    float noiseStatic = texture(tBlueNoise, noiseTexelStatic).r;

    if(dstInsideBox > 0.){
        float stepSize = dstInsideBox / float(CLOUDS_STEPS);

        stepSize = min(stepSize, 5000.);

        vec3 position = rayOrigin + dstToBox * rayDir;
        position += rayDir * noise * stepSize;

        float totalDensity = 0.;

        vec3 ambientLight = vec3(0.6, 0.65, 0.7) * 0.;
        vec3 sunColor = vec3(0.6, 0.8, 0.99);

        for (int i = 0; i < CLOUDS_STEPS; i++) {
            if(position.y < 0.) break;

            float density = sampleCloudDensity(position);

            if (density > 0.) {
                float lightTransmittance = lightmarch(position, lightDir, cosAngle);
                lightEnergy += sunColor * density * stepSize * (ambientLight + transmittance * lightTransmittance);
                transmittance *= exp(-density * stepSize * lightAbsorptionThroughCloud);

                if (transmittance < CLOUDS_MIN_TRANSMITTANCE) {
                    break;
                }
            }

            position += rayDir * stepSize;
        }

        cloudDensity = totalDensity / float(CLOUDS_STEPS);
    }

    return vec4(lightEnergy, transmittance);
}
