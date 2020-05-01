#define CLOUDS_STEPS 12
#define CLOUDS_STEPS_LIGHT 6
#define CLOUDS_MIN_HEIGHT 300.
#define CLOUDS_THICKNESS 300.
#define CLOUDS_DEPTH 1
#define CLOUDS_MIN_TRANSMITTANCE 0.1

#define CLOUDS_FORWARD_SCATTERING_G (.8)
#define CLOUDS_BACKWARD_SCATTERING_G (-.2)
#define CLOUDS_SCATTERING_LERP (.5)

#define CLOUDS_WIND_VECTOR vec2(1, 0)
#define CLOUDS_WIND_SPEED 2.

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

float sampleCloudMap(vec3 pos) {
    vec2 samplePos = (pos.xz + time * CLOUDS_WIND_VECTOR * CLOUDS_WIND_SPEED) / 300.;
    return clamp(cnoise(samplePos), 0., 1.);
}

vec4 sampleCloudNoise(vec3 pos) {
    return vec4(sampleCloudMap(pos)) * 0.8;
    vec4 color = texture(tWorley, pos).rgba / 300.;
    return color * 10.;
}

// Fractional value for sample position in the cloud layer
float GetHeightFractionForPoint(vec3 inPosition , vec2 inCloudMinMax)
{
    // Get global fractional position in cloud zone
    float height_fraction = (inPosition.z - inCloudMinMax.x) / (inCloudMinMax.y - inCloudMinMax.x);
    return clamp(height_fraction, 0., 1.);
}

// Utility function on that maps a value from one range to another
float remap(float original_value, float original_min, float original_max, float new_min , float new_max) {
    return new_min + (((original_value - original_min) / (original_max - original_min)) * (new_max - new_min));
}

float getDensityHeightGradientForPoint(vec3 pos, vec3 weather) {
    float height = pos.y / CLOUDS_MIN_HEIGHT - 1.;
    return 1. - smoothstep(0., 0.3, 1. - height - 0.7) - smoothstep(0., 0.3, height - 0.7);
}

float sampleCloudDensity(vec3 p) {
    vec3 weather_data = vec3(1);

    // Read the low−frequency Perlin−Worley and Worley noises.
    vec4 low_frequency_noises = sampleCloudNoise(p);

    // Build an FBM out of the low frequency Worley noises
    // that can be used to add detail to the low−frequency
    // Perlin−Worley noise.
    float low_freq_FBM = (low_frequency_noises.g * 0.625) + (low_frequency_noises.b * 0.25) + (low_frequency_noises.a * 0.125);

    // Define the base cloud shape by dilating it with the
    // low−frequency FBM made of Worley noise.
    float base_cloud = remap(low_frequency_noises.r, -(1.0 - low_freq_FBM), 1.0, 0.0, 1.0);

    // Get the density−height gradient using the density height function.
    float density_height_gradient = getDensityHeightGradientForPoint(p, weather_data);

    // Apply the height function to the base cloud shape.
    base_cloud *= density_height_gradient;

    return low_frequency_noises.r * density_height_gradient;
}

float beers(float density) {
    return exp(-density);
}

float henyeyGreenstein(float lightDotView, float g) {
    float gg = g * g;
    return (1. - gg) / pow( 1. + gg - 2. * g * lightDotView, 1.5);
}

vec3 boundsMin = vec3(-1000000000, CLOUDS_MIN_HEIGHT, -1000000000);
vec3 boundsMax = vec3(1000000000, CLOUDS_MIN_HEIGHT + CLOUDS_THICKNESS, 1000000000);
float lightAbsorptionTowardSun = 1.21;
float lightAbsorptionThroughCloud = 0.75;
float darknessThreshold = 0.15;

float lightmarch(vec3 position, vec3 lightDir) {
    vec3 dirToLight = -lightDir;
    float dstInsideBox = rayBoxIntersection(boundsMin, boundsMax, position, 1. / dirToLight).y;

    float stepSize = dstInsideBox / float(CLOUDS_STEPS_LIGHT);
    float totalDensity = 0.;

    stepSize = min(stepSize, 512.);

    for (int i = 0; i < CLOUDS_STEPS_LIGHT; i++) {
        position += dirToLight * stepSize;
        totalDensity += max(0., sampleCloudDensity(position) * stepSize);
    }

    float transmittance = beers(totalDensity * lightAbsorptionTowardSun);
    return darknessThreshold + transmittance * (1. - darknessThreshold);
}

float phase(float lightDirDot) {
    return mix(
        henyeyGreenstein(lightDirDot, CLOUDS_FORWARD_SCATTERING_G),
        henyeyGreenstein(lightDirDot, CLOUDS_BACKWARD_SCATTERING_G),
        CLOUDS_SCATTERING_LERP
    );
}

vec4 calculateCloudsColor(vec3 rayOrigin, vec3 rayDir, float depth, vec3 lightDir) {
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

    float cosAngle = dot(rayDir, -lightDir);
    float phaseVal = phase(cosAngle);

    float transmittance = 1.;
    vec3 lightEnergy = vec3(0);

    vec2 noiseTexel = vec2(gl_FragCoord + floor(time * 1000.)) / vec2(textureSize(tBlueNoise, 0));
    float noise = texture(tBlueNoise, noiseTexel).r;

    if(dstInsideBox > 0.){
        float stepSize = dstInsideBox / float(CLOUDS_STEPS);

        stepSize = min(stepSize, 1024.);

        vec3 position = rayOrigin + dstToBox * rayDir;
        position += rayDir * noise * stepSize;

        float totalDensity = 0.;

        for (int i = 0; i < CLOUDS_STEPS; i++) {
            float density = sampleCloudDensity(position);

            if (density > 0.) {
                float lightTransmittance = lightmarch(position, lightDir);
                lightEnergy += density * stepSize * transmittance * lightTransmittance * phaseVal;
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
