#define CLOUDS_STEPS 12
#define CLOUDS_STEPS_LIGHT 6
#define CLOUDS_MIN_HEIGHT 2000.
#define CLOUDS_THICKNESS 4000.
#define CLOUDS_DEPTH 1
#define CLOUDS_MIN_TRANSMITTANCE 0.1

#define CLOUDS_FORWARD_SCATTERING_G 0.4
#define CLOUDS_BACKWARD_SCATTERING_G -0.2
#define CLOUDS_SCATTERING_LERP 0.5

#define CLOUDS_MAP_SCALE 60000.

#define CLOUDS_WIND_VECTOR vec2(1, 0)
#define CLOUDS_WIND_SPEED 50.

vec2 rayBoxIntersection(vec3 boundsMin, vec3 boundsMax, vec3 rayOrigin, vec3 rayDir) {
    // Adapted from: http://jcgt.org/published/0007/03/04/
    vec3 t0 = (boundsMin - rayOrigin) * rayDir;
    vec3 t1 = (boundsMax - rayOrigin) * rayDir;
    vec3 tmin = min(t0, t1);
    vec3 tmax = max(t0, t1);

    float dstA = max(max(tmin.x, tmin.y), tmin.z);
    float dstB = min(tmax.x, min(tmax.y, tmax.z));

    // CASE 1: ray intersects box from outside (0 <= dstA <= dstB)
    // dstA is dst to nearest intersection, dstB dst to far intersection

    // CASE 2: ray intersects box from inside (dstA < 0 < dstB)
    // dstA is the dst to intersection behind the ray, dstB is dst to forward intersection

    // CASE 3: ray misses box (dstA > dstB)

    float dstToBox = max(0., dstA);
    float dstInsideBox = max(0., dstB - dstToBox);
    return vec2(dstToBox, dstInsideBox);
}

float remap(float original_value, float original_min, float original_max, float new_min , float new_max) {
    return new_min + (((original_value - original_min) / (original_max - original_min)) * (new_max - new_min));
}

float sampleCloudMap(vec3 pos) {
    vec2 uv = (pos.xz + time * CLOUDS_WIND_VECTOR * CLOUDS_WIND_SPEED) / CLOUDS_MAP_SCALE;
    return texture(tWeather, uv).x;
}

vec4 sampleCloudNoise(vec3 pos) {
    vec4 color = texture(tNoise, pos.xzy / CLOUDS_THICKNESS).rgba;
    return color;
}

// Fractional value for sample position in the cloud layer
float getHeightFractionForPoint(vec3 inPosition)
{
    // Get global fractional position in cloud zone
    float height_fraction = (inPosition.y - CLOUDS_MIN_HEIGHT) / CLOUDS_THICKNESS;
    return clamp(height_fraction, 0., 1.);
}

float getDensityHeightGradientForPoint(vec3 pos, vec3 weather) {
    float height = (pos.y - CLOUDS_MIN_HEIGHT) / CLOUDS_THICKNESS;
    return 1. - smoothstep(0., 0.5, height - 0.5) - smoothstep(0., 0.2, 1. - height - 0.8);
}

float sampleCloudDensity(vec3 pos) {
    vec3 weather_data = vec3(sampleCloudMap(pos), 1, 1);

    vec4 noiseSample = sampleCloudNoise(pos);

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

    float cloud_coverage = weather_data.r;

    // Use remap to apply the cloud coverage attribute.
    float base_cloud_with_coverage = remap(base_cloud, cloud_coverage, 1.0, 0.0, 1.0);
    base_cloud_with_coverage = clamp(base_cloud_with_coverage, 0.0, 1.0);
    base_cloud_with_coverage *= cloud_coverage;

    float high_freq_FBM = noiseSample.b;

    float height_fraction = getHeightFractionForPoint(pos);

    float high_freq_noise_modifier = mix(high_freq_FBM, 1.0 - high_freq_FBM, clamp(height_fraction * 10., 0., 1.));
    high_freq_noise_modifier = clamp(high_freq_noise_modifier, 0.0, 1.0);
    float final_cloud = remap(base_cloud_with_coverage, high_freq_noise_modifier * 0.2, 1.0, 0.0, 1.0);

    return max(0., final_cloud) * densityFactor;
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
    float dstInsideBox = rayBoxIntersection(boundsMin, boundsMax, position, 1. / dirToLight).y;

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

vec4 calculateCloudsColor(vec3 rayOrigin, vec3 rayDir, float depth, vec3 lightDir, out float outDepth) {
    vec2 intersection = rayBoxIntersection(boundsMin, boundsMax, rayOrigin, 1. / rayDir);
    float dstToBox = intersection.x;
    float dstInsideBox = intersection.y;

    float dstLimit = dstInsideBox;
    float cloudDensity = 0.;

    #if CLOUDS_DEPTH == 1
    if(depth > 10000.) depth = 100000000.;

    if(dstToBox > depth) dstInsideBox = 0.;

    if(dstToBox + dstInsideBox > depth) {
        dstInsideBox = depth - dstToBox;
    }
    #endif

    float cosAngle = dot(normalize(rayDir), normalize(-lightDir));

    float transmittance = 1.;
    vec3 lightEnergy = vec3(0);

    vec2 noiseTexel = vec2(gl_FragCoord + floor(time * 1000.)) / vec2(textureSize(tBlueNoise, 0));
    vec2 noiseTexelStatic = vec2(gl_FragCoord) / vec2(textureSize(tBlueNoise, 0));
    float noise = texture(tBlueNoise, noiseTexel).r;
    float noiseStatic = texture(tBlueNoise, noiseTexelStatic).r;

    float cloudsDepth = 100000.;
    bool depthSet = false;

    if(dstInsideBox > 0.){
        float stepSize = dstInsideBox / float(CLOUDS_STEPS);

        stepSize = min(stepSize, 5000.);

        vec3 position = rayOrigin + dstToBox * rayDir;
        position += rayDir * noise * stepSize;

        float totalDensity = 0.;

        vec3 ambientLight = vec3(0.6, 0.65, 0.7) * 0.;
        vec3 sunColor = vec3(0.6, 0.8, 0.99);

        for (int i = 0; i < CLOUDS_STEPS; i++) {
            float density = sampleCloudDensity(position);

            if (density > 0.) {
                if(!depthSet) {
                    cloudsDepth = length(position - rayOrigin);
                    depthSet = true;
                }

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

    //lightEnergy = clamp(lightEnergy, vec3(0), vec3(3));

    outDepth = cloudsDepth;

    return vec4(lightEnergy, transmittance);
}
