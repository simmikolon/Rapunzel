import { Filter, GlProgram, TexturePool, defaultFilterVert } from '../../vendor/pixi.min.mjs';

// Screen-space post-processing. PixiJS renders a filtered container into a
// texture and hands it to `apply()`, which draws full-screen passes with the
// filter's shader; `uInputSize`, `uInputPixel`, `uInputClamp` and
// `uOutputFrame` are the global filter uniforms PixiJS binds for us. They are
// declared `highp` here because the shared vertex shader declares them so,
// and GLSL refuses to link a uniform whose precision differs between stages.

// --------------------------------------------------------------------- bloom
// Selective bloom: the renderer draws emissive copies of glowing things into
// a dedicated container, this filter blurs that container (at half
// resolution, separable 9-tap Gaussian, several iterations) and adds the
// result over the scene. No luminance threshold, so a bright daytime sky
// does not haze over.
const BLUR_FRAG = /* glsl */`
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform highp vec4 uInputPixel;
uniform highp vec4 uInputClamp;
uniform vec2 uDir;      // blur direction and spread, in texels
uniform float uGain;

const float W0 = 0.2270270270;
const float W1 = 0.1945945946;
const float W2 = 0.1216216216;
const float W3 = 0.0540540541;
const float W4 = 0.0162162162;

vec4 tap(vec2 uv) { return texture(uTexture, clamp(uv, uInputClamp.xy, uInputClamp.zw)); }

void main(void) {
  vec2 step = uDir * uInputPixel.zw;
  vec4 c = tap(vTextureCoord) * W0;
  c += (tap(vTextureCoord + step) + tap(vTextureCoord - step)) * W1;
  c += (tap(vTextureCoord + step * 2.0) + tap(vTextureCoord - step * 2.0)) * W2;
  c += (tap(vTextureCoord + step * 3.0) + tap(vTextureCoord - step * 3.0)) * W3;
  c += (tap(vTextureCoord + step * 4.0) + tap(vTextureCoord - step * 4.0)) * W4;
  finalColor = c * uGain;
}
`;

export class BloomFilter extends Filter {
  constructor({ spread = 1.5, passes = 2, gain = 1.2, resolution = 0.5 } = {}) {
    super({
      glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: BLUR_FRAG, name: 'rapunzel-bloom' }),
      resources: {
        bloomUniforms: {
          uDir: { value: new Float32Array([1, 0]), type: 'vec2<f32>' },
          uGain: { value: 1, type: 'f32' },
        },
      },
      resolution,
      blendMode: 'add',
      padding: 0,
    });
    this.spread = spread;
    this.passes = passes;
    this.gain = gain;
  }

  apply(filterManager, input, output, clearMode) {
    const u = this.resources.bloomUniforms.uniforms;
    const temp = TexturePool.getSameSizeTexture(input);
    let src = input;
    const n = Math.max(1, this.passes | 0);
    // Intermediate passes overwrite their target; only the last one blends
    // additively onto the scene.
    this._state.blend = false;
    for (let i = 0; i < n; i++) {
      const last = i === n - 1;
      // horizontal: src -> temp
      u.uDir[0] = this.spread; u.uDir[1] = 0; u.uGain = 1;
      filterManager.applyFilter(this, src, temp, true);
      if (last) {
        this._state.blend = true;
        u.uDir[0] = 0; u.uDir[1] = this.spread; u.uGain = this.gain;
        filterManager.applyFilter(this, temp, output, clearMode);
      } else {
        // vertical: temp -> input (safe to reuse: its contents were consumed)
        u.uDir[0] = 0; u.uDir[1] = this.spread; u.uGain = 1;
        filterManager.applyFilter(this, temp, input, true);
        src = input;
      }
    }
    TexturePool.returnTexture(temp);
  }
}

// ----------------------------------------------------------------------- CRT
// Curved tube, scanlines, a faint phosphor triad, chromatic aberration at the
// edges, corner shading and a little flicker. Applied to the whole frame
// (HUD included) so the game looks like it runs on an old portable screen.
const CRT_FRAG = /* glsl */`
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform highp vec4 uInputSize;
uniform highp vec4 uInputClamp;
uniform highp vec4 uOutputFrame;
uniform float uTime;
uniform float uCurvature;
uniform float uAberration;
uniform float uScanline;
uniform float uScanPeriod;
uniform float uMask;
uniform float uVignette;
uniform float uFlicker;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

vec3 scene(vec2 n, vec2 uvMax) {
  vec2 uv = clamp(n * uvMax, uInputClamp.xy, uInputClamp.zw);
  return texture(uTexture, uv).rgb;
}

void main(void) {
  // Normalised 0..1 position inside the output frame (the pooled input
  // texture can be larger than the frame).
  vec2 uvMax = uOutputFrame.zw * uInputSize.zw;
  vec2 n = vTextureCoord / uvMax;
  vec2 p = n * 2.0 - 1.0;
  // Barrel curvature, normalised so the edge centres stay put and only the
  // corners bend out of the picture.
  vec2 pc = p * (1.0 + uCurvature * dot(p, p)) / (1.0 + uCurvature);
  vec2 nc = pc * 0.5 + 0.5;
  float edge = max(abs(pc.x), abs(pc.y));
  float inside = 1.0 - smoothstep(0.996, 1.0, edge);

  // Chromatic aberration grows toward the edges.
  vec2 shift = pc * uAberration;
  vec3 col = vec3(scene(nc + shift, uvMax).r, scene(nc, uvMax).g, scene(nc - shift, uvMax).b);

  // Scanlines, one per art pixel row of the device, plus a phosphor triad.
  float sl = 0.5 + 0.5 * cos(gl_FragCoord.y * 6.28318530718 / uScanPeriod);
  col *= (1.0 - uScanline * sl) * (1.0 + uScanline * 0.3);
  float m = mod(gl_FragCoord.x, 3.0);
  float r = step(1.0, m), g = step(2.0, m);
  vec3 mask = 1.0 - uMask * vec3(r, 1.0 - (r - g), 1.0 - g);
  col *= mask * (1.0 + uMask * 0.66);

  // Tube shading and flicker.
  col *= 1.0 - uVignette * smoothstep(0.35, 1.7, dot(pc, pc));
  col *= 1.0 - uFlicker * hash(floor(uTime * 60.0));

  finalColor = vec4(col * inside, 1.0);
}
`;

export class CRTFilter extends Filter {
  constructor(o = {}) {
    super({
      glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: CRT_FRAG, name: 'rapunzel-crt', preferredFragmentPrecision: 'highp' }),
      resources: {
        crtUniforms: {
          uTime: { value: 0, type: 'f32' },
          uCurvature: { value: o.curvature ?? 0.035, type: 'f32' },
          uAberration: { value: o.aberration ?? 0.002, type: 'f32' },
          uScanline: { value: o.scanline ?? 0.2, type: 'f32' },
          uScanPeriod: { value: 4, type: 'f32' },
          uMask: { value: o.mask ?? 0.06, type: 'f32' },
          uVignette: { value: o.vignette ?? 0.25, type: 'f32' },
          uFlicker: { value: o.flicker ?? 0.02, type: 'f32' },
        },
      },
      resolution: 'inherit',
      padding: 0,
    });
  }

  get uniforms() { return this.resources.crtUniforms.uniforms; }
}
