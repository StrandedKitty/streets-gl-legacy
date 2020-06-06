#define weather	0.0			//0 is clear 1 is rainy
#define rCoeff vec3(0.3,0.5,0.9)	//Rayleigh coefficient //You can edit this to your liking
#define mCoeff mix(0.2, 5.0, weather)	//Mie coefficient //You can edit this to your liking
#define ms mix(0.05, 1.0, weather)	//Mie Multiscatter Radius //You can edit this to your liking
#define eR 600.0			//Earth radius (not particulary accurate) //You can edit this to your liking
#define aR 0.5				//Atmosphere radius (also not accurate) //You can edit this to your liking

vec3 r(vec3 x, float x2, float y) {
    return (x * y + x2 * y);
}

vec3 a(vec3 x, float x2, float y) {
    return exp2(-r(x,x2,y));
}

vec3 d(vec3 x) {
    return abs(x+1.0e-32);
}

vec3 sA(vec3 x, vec3 y, vec3 z, vec3 w) {
    return d(x-y)/d(z-w);
}

vec3 scatter(vec3 x, vec3 y, vec3 z, vec3 w, vec3 s) {
    return sA(x,y,z,w)*s;
}

//Calculates the distance between the camera and the edge of the atmosphere
float gDepth(float x){
    const float d = eR + aR, eR2 = eR * eR;
    float b = -2.0 * (x * eR) + eR;
    return sqrt(d * d + b * b - eR2) + b;
}

//Rayleigh phase function
float rPhase(float x) {
    return 0.375 * (x * x + 1.0);
}

//Henyey greenstein phase function
float gPhase(float x, float g) {
    float g2 = g * g;
    return (1.0 / 4.0 * PI) * ((1.0 - g2) / pow(1.0 + g2 - 2.0 * g * x, 1.5));
}

//Mie phase function
float mPhase(float x, float b) {
    return gPhase(x, exp2(b * -ms));
}

float calcSunSpot(float x) {
    const float sunSize = 0.99;
    return smoothstep(sunSize, sunSize + 0.001, x);
}

vec3 calculateAtmosphericScattering(vec3 viewDir, vec3 lightDir){ //
    return vec3(0.2,0.5,1.0)*(1.0-viewDir.y) * 0.8;
}
