float textureShadow(sampler2D depth, vec2 uv) {
    return texture(depth, uv).x;
}

float textureCompare(sampler2D depth, vec2 uv, float compare) {
    return float(step(compare, textureShadow(depth, uv)));
}

float textureShadowLerp(sampler2D depths, vec2 size, vec2 uv, float compare) {
    const vec2 offset = vec2(0.0, 1.0);
    vec2 texelSize = vec2(1.0) / size;
    vec2 centroidUV = (floor(uv * size - 0.5) + 0.5) * texelSize;
    float lb = textureCompare(depths, centroidUV + texelSize * offset.xx, compare);
    float lt = textureCompare(depths, centroidUV + texelSize * offset.xy, compare);
    float rb = textureCompare(depths, centroidUV + texelSize * offset.yx, compare);
    float rt = textureCompare(depths, centroidUV + texelSize * offset.yy, compare);
    vec2 f = fract(uv * size + 0.5);
    float a = mix(lb, lt, f.y);
    float b = mix(rb, rt, f.y);
    float c = mix(a, b, f.x);
    return c;
}

float getShadow(sampler2D shadowMap, float shadowBias, vec4 shadowPosition, float shadowFrustumSize) {
    float shadow = 1.0;
    vec2 shadowUV = (shadowPosition.xy / shadowFrustumSize + 1.) / 2.;

    bvec4 inFrustumVec = bvec4(shadowUV.x >= 0.0, shadowUV.x <= 1.0, shadowUV.y >= 0.0, shadowUV.y <= 1.0);
    bool inFrustum = all(inFrustumVec);

    if(inFrustum && shadowPosition.z / shadowPosition.w < 1.) {
        float shadowSpaceDepth = -shadowPosition.z + shadowBias;

        shadow = textureCompare(shadowMap, shadowUV.xy, shadowSpaceDepth);
    }

    return shadow;
}

float getShadowSoft(sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowPosition, float shadowFrustumSize) {
    float shadow = 1.0;
    vec2 shadowUV = (shadowPosition.xy / shadowFrustumSize + 1.) / 2.;
    bvec4 inFrustumVec = bvec4(shadowUV.x >= 0.0, shadowUV.x <= 1.0, shadowUV.y >= 0.0, shadowUV.y <= 1.0);
    bool inFrustum = all(inFrustumVec);

    if(inFrustum && shadowPosition.z / shadowPosition.w < 1.) {
        float shadowSpaceDepth = -shadowPosition.z + shadowBias;
        vec2 texelSize = vec2(1) / shadowMapSize;

        float dx0 = -texelSize.x * shadowRadius;
        float dy0 = -texelSize.y * shadowRadius;
        float dx1 = +texelSize.x * shadowRadius;
        float dy1 = +texelSize.y * shadowRadius;

        shadow = (
        textureShadowLerp(shadowMap, shadowMapSize, shadowUV.xy + vec2(dx0, dy0), shadowSpaceDepth) +
        textureShadowLerp(shadowMap, shadowMapSize, shadowUV.xy + vec2(0.0, dy0), shadowSpaceDepth) +
        textureShadowLerp(shadowMap, shadowMapSize, shadowUV.xy + vec2(dx1, dy0), shadowSpaceDepth) +
        textureShadowLerp(shadowMap, shadowMapSize, shadowUV.xy + vec2(dx0, 0.0), shadowSpaceDepth) +
        textureShadowLerp(shadowMap, shadowMapSize, shadowUV.xy + vec2(0.0, 0.0), shadowSpaceDepth) +
        textureShadowLerp(shadowMap, shadowMapSize, shadowUV.xy + vec2(dx1, 0.0), shadowSpaceDepth) +
        textureShadowLerp(shadowMap, shadowMapSize, shadowUV.xy + vec2(dx0, dy1), shadowSpaceDepth) +
        textureShadowLerp(shadowMap, shadowMapSize, shadowUV.xy + vec2(0.0, dy1), shadowSpaceDepth) +
        textureShadowLerp(shadowMap, shadowMapSize, shadowUV.xy + vec2(dx1, dy1), shadowSpaceDepth)
        ) * (1. / 9.);
    }

    return shadow;
}

// PCSS

#define LIGHT_WORLD_SIZE .5
#define LIGHT_FRUSTUM_WIDTH 1.75
#define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)
#define NEAR_PLANE 9.5

#define NUM_SAMPLES 17
#define NUM_RINGS 11
#define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES
#define PCF_NUM_SAMPLES NUM_SAMPLES

vec2 poissonDisk[NUM_SAMPLES];

highp float rand( const in vec2 uv ) {
    const highp float a = 12.9898, b = 78.233, c = 43758.5453;
    highp float dt = dot( uv.xy, vec2( a, b ) ), sn = mod( dt, PI );
    return fract(sin(sn) * c);
}

void initPoissonSamples( const in vec2 randomSeed ) {
    float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
    float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );

    // jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
    float angle = rand( randomSeed ) * PI2;
    float radius = INV_NUM_SAMPLES;
    float radiusStep = radius;

    for( int i = 0; i < NUM_SAMPLES; i ++ ) {
        poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
        radius += radiusStep;
        angle += ANGLE_STEP;
    }
}

float penumbraSize( const in float zReceiver, const in float zBlocker ) { // Parallel plane estimation
    return (zReceiver - zBlocker) / zBlocker;
}

float findBlocker( sampler2D shadowMap, const in vec2 uv, const in float zReceiver ) {
    // This uses similar triangles to compute what
    // area of the shadow map we should search
    float searchRadius = LIGHT_SIZE_UV * ( zReceiver - NEAR_PLANE ) / zReceiver;
    float blockerDepthSum = 0.0;
    int numBlockers = 0;

    for( int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; i++ ) {
        float shadowMapDepth = textureShadow(shadowMap, uv + poissonDisk[i] * searchRadius);
        if ( shadowMapDepth < zReceiver ) {
            blockerDepthSum += shadowMapDepth;
            numBlockers ++;
        }
    }

    if( numBlockers == 0 ) return -1.0;

    return blockerDepthSum / float( numBlockers );
}

float PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius ) {
    float sum = 0.0;
    for( int i = 0; i < PCF_NUM_SAMPLES; i ++ ) {
        float depth = textureShadow( shadowMap, uv + poissonDisk[ i ] * filterRadius );
        if( zReceiver <= depth ) sum += 1.0;
    }
    for( int i = 0; i < PCF_NUM_SAMPLES; i ++ ) {
        float depth = textureShadow( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius );
        if( zReceiver <= depth ) sum += 1.0;
    }
    return sum / ( 2.0 * float( PCF_NUM_SAMPLES ) );
}

float PCSS ( sampler2D shadowMap, vec4 coords ) {
    vec2 uv = (coords.xy / SHADOWMAP_SIZE + 1.) / 2.;
    float zReceiver = -coords.z; // Assumed to be eye-space z in this code

    initPoissonSamples( uv );
    // STEP 1: blocker search
    float avgBlockerDepth = findBlocker( shadowMap, uv, zReceiver );

    //There are no occluders so early out (this saves filtering)
    if( avgBlockerDepth == -1.0 ) return 1.0;

    // STEP 2: penumbra size
    float penumbraRatio = penumbraSize( zReceiver, avgBlockerDepth );
    float filterRadius = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / zReceiver;

    // STEP 3: filtering
    //return avgBlockerDepth;
    return PCF_Filter( shadowMap, uv, zReceiver, filterRadius );
}

float getShadowPCSS(sampler2D shadowMap, float shadowBias, vec4 shadowPosition) {
    float shadow = 1.0;
    vec2 shadowUV = (shadowPosition.xy / SHADOWMAP_SIZE + 1.) / 2.;

    bvec4 inFrustumVec = bvec4(shadowUV.x >= 0.0, shadowUV.x <= 1.0, shadowUV.y >= 0.0, shadowUV.y <= 1.0);
    bool inFrustum = all(inFrustumVec);

    if(inFrustum && shadowPosition.z / shadowPosition.w < 1.) {
        shadowPosition.z -= shadowBias;
        shadow = PCSS(shadowMap, shadowPosition);
    }

    return shadow;
}
