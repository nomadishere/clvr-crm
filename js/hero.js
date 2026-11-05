/* Hero: the matte 3D clover inside a sweeping 60-minute clock ring, with drifting light dust.
   Scroll turns the clover and finishes the lap; the cursor (or phone tilt) adds a little parallax. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('gl');
const hero = canvas.parentElement, stage = document.querySelector('.stage');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
if (!renderer) { document.documentElement.classList.add('no-gl'); canvas.remove(); }
else {
const lowEnd = (navigator.hardwareConcurrency || 4) <= 4 || Math.min(screen.width, screen.height) < 400;
let dpr = Math.min(devicePixelRatio, lowEnd ? 1.5 : 2);
renderer.setPixelRatio(dpr);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .82;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
camera.position.set(0, 0, 9);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

// lights: warm key, mint rim, a gold glint that orbits
scene.add(new THREE.AmbientLight(0xffffff, .25));
const key = new THREE.DirectionalLight(0xfff1d6, 1.9); key.position.set(3, 4, 6); scene.add(key);
const rim = new THREE.PointLight(0x7ee8b4, 40, 14, 2); rim.position.set(-3, -1.5, -2); scene.add(rim);
const glint = new THREE.PointLight(0xffd27a, 18, 8, 2); scene.add(glint);

// --- the clover: four heart leaflets extruded from the same outline as the logo ---
const leafShape = (() => {
  // SVG leaflet (points up in SVG = negative y). Flip y so it points up in 3D. Units ≈ 1/40 of the leaf.
  const s = new THREE.Shape(), k = 1 / 40, P = (x, y) => [x * k, -y * k];
  const c = (a, b, d) => s.bezierCurveTo(...P(...a), ...P(...b), ...P(...d));
  s.moveTo(0, 0);
  c([-4, -6], [-17, -15], [-19.5, -26]); c([-21.5, -36], [-13, -42], [-6, -40.5]); c([-2.6, -39.6], [-.8, -37.6], [0, -35.6]);
  c([.8, -37.6], [2.6, -39.6], [6, -40.5]); c([13, -42], [21.5, -36], [19.5, -26]); c([17, -15], [4, -6], [0, 0]);
  return s;
})();
const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: .06, bevelEnabled: true, bevelThickness: .07, bevelSize: .05, bevelSegments: 6, curveSegments: 28 });
leafGeo.translate(0, 0, -.03);
// gently cup each leaflet so it catches light like a real leaf
{ const p = leafGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, p.getZ(i) + .14 * x * x - .05 * y); } leafGeo.computeVertexNormals(); }
const leafMat = new THREE.MeshPhysicalMaterial({ color: 0x3f962f, roughness: .58, metalness: 0, clearcoat: .25, clearcoatRoughness: .6, sheen: .35, sheenColor: new THREE.Color(0xa9dd86), sheenRoughness: .7, envMapIntensity: .7 });
const veinMat = new THREE.MeshStandardMaterial({ color: 0xd9f5c2, roughness: .6, transparent: true, opacity: .55 });
const clover = new THREE.Group();
[[-46, 1], [43, .96], [137, .93], [226, .98]].forEach(([deg, sc]) => {
  const g = new THREE.Group();
  const m = new THREE.Mesh(leafGeo, leafMat); g.add(m);
  // the pale V-mark on each leaflet
  const v = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.24, .42, .13), new THREE.Vector3(0, .26, .135), new THREE.Vector3(.24, .42, .13)]), 16, .012, 6), veinMat);
  g.add(v);
  g.rotation.z = -THREE.MathUtils.degToRad(deg); g.scale.setScalar(sc * 1.25);
  clover.add(g);
});
// stem
const stemCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -.05, -.02), new THREE.Vector3(.05, -.7, -.06), new THREE.Vector3(.18, -1.35, -.1), new THREE.Vector3(.42, -1.85, -.12)]);
clover.add(new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 40, .055, 10), new THREE.MeshPhysicalMaterial({ color: 0x4f9a33, roughness: .5, sheen: .5, sheenColor: new THREE.Color(0xc9f2a8) })));
clover.add(new THREE.Mesh(new THREE.SphereGeometry(.09, 20, 16), leafMat));
clover.position.y = .18;
scene.add(clover);

// --- the 60-minute clock ring ---
const R = 2.45;
const dial = new THREE.Group(); scene.add(dial);
const ringBase = new THREE.Mesh(new THREE.TorusGeometry(R, .018, 8, 180), new THREE.MeshBasicMaterial({ color: 0x2a3a2e, transparent: true, opacity: .8 }));
dial.add(ringBase);
// tick marks every 5 "minutes"
const ticks = new THREE.Group();
for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, t = new THREE.Mesh(new THREE.BoxGeometry(.03, i % 3 ? .1 : .2, .02), new THREE.MeshBasicMaterial({ color: 0x5c6b5f }));
  t.position.set(Math.sin(a) * (R + .2), Math.cos(a) * (R + .2), 0); t.rotation.z = -a; ticks.add(t); }
dial.add(ticks);
// the sweeping arc (shader colors it green → yellow → red along its length)
const arcMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { prog: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float prog; varying vec2 vUv;
    void main(){ float u = vUv.x; if (u > prog) discard;
      vec3 g = vec3(.49,.91,.70), y = vec3(1.,.82,.48), r = vec3(1.,.30,.37);
      vec3 c = u < .5 ? g : (u < .85 ? mix(g, y, smoothstep(.5,.62,u)) : mix(y, r, smoothstep(.85,.95,u)));
      float head = smoothstep(prog-.08, prog, u);
      gl_FragColor = vec4(c * (1.1 + head*1.8), .95); }` });
// torus with uv.x running around the circle, starting at 12 o'clock and going clockwise
const arcGeo = new THREE.TorusGeometry(R, .045, 12, 240, Math.PI * 2);
const arc = new THREE.Mesh(arcGeo, arcMat); arc.rotation.z = -Math.PI / 2; arc.scale.x = -1; dial.add(arc);
const tip = new THREE.Mesh(new THREE.SphereGeometry(.09, 20, 16), new THREE.MeshBasicMaterial({ color: 0xeafff4 }));
dial.add(tip);
const tipGlow = new THREE.PointLight(0x7ee8b4, 6, 3, 2); tip.add(tipGlow);

// --- dust ---
const N = lowEnd ? 420 : 900, pos = new Float32Array(N * 3), seed = new Float32Array(N);
for (let i = 0; i < N; i++) { const r = 1.2 + Math.random() * 5.5, a = Math.random() * Math.PI * 2; pos[i*3] = Math.cos(a) * r; pos[i*3+1] = (Math.random() - .5) * 7; pos[i*3+2] = (Math.random() - .7) * 6; seed[i] = Math.random(); }
const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); dg.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
const dustMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { time: { value: 0 }, px: { value: dpr } },
  vertexShader: `attribute float seed; uniform float time, px; varying float a;
    void main(){ vec3 p = position; p.y += mod(time*.08*(.4+seed) + seed*7., 7.) - 3.5 - position.y*0.;
      p.x += sin(time*.3 + seed*30.)*.12;
      vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
      gl_PointSize = px*(1.2 + seed*2.2)*(7./max(-mv.z,.5));
      a = (.35 + .65*sin(time*(1.5+seed*3.) + seed*50.)*.5 + .5) * smoothstep(3.6, 2., abs(p.y)); }`,
  fragmentShader: `varying float a; void main(){ float d = length(gl_PointCoord-.5); if (d>.5) discard;
    gl_FragColor = vec4(mix(vec3(.6,1.,.75), vec3(1.,.86,.5), step(.85, fract(a*7.)))*a*smoothstep(.5,0.,d), 1.); }` });
scene.add(new THREE.Points(dg, dustMat));

// --- post ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .45, .45, .88); composer.addPass(bloom);
composer.addPass(new OutputPass());
// keep the canvas transparent through post so the page's dark gradient shows
composer.renderTarget1.texture.format = composer.renderTarget2.texture.format = THREE.RGBAFormat;

// layout: the scene's centre follows the .stage box (right column on desktop, top on phones)
let cx = 0, cy = 0, scale = 1;
function resize() {
  const w = hero.clientWidth, h = hero.clientHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const hr = hero.getBoundingClientRect(), sr = stage.getBoundingClientRect();
  const sx = (sr.left + sr.width / 2 - hr.left) / w * 2 - 1, sy = -((sr.top + sr.height / 2 - hr.top) / h * 2 - 1);
  // world size of the view at z=0
  const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z, vw = vh * camera.aspect;
  cx = sx * vw / 2; cy = sy * vh / 2;
  scale = Math.min(sr.width / w * vw, sr.height / h * vh) / 6.2;
}
addEventListener('resize', resize); resize();
new ResizeObserver(resize).observe(stage);

// input
let mx = 0, my = 0, tmx = 0, tmy = 0, scrollK = 0;
addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5; }, { passive: true });
addEventListener('deviceorientation', e => { if (e.gamma == null) return; tmx = Math.max(-.5, Math.min(.5, e.gamma / 60)); tmy = Math.max(-.5, Math.min(.5, (e.beta - 45) / 60)); }, { passive: true });
addEventListener('scroll', () => { scrollK = Math.min(1, scrollY / Math.max(1, hero.offsetHeight)); }, { passive: true });

// only render while the hero is on screen and the tab is visible
let visible = true;
new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) loop(); }, { threshold: 0 }).observe(hero);
document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); document.documentElement.classList.add('no-gl'); canvas.style.display = 'none'; });

const clock = new THREE.Clock(); let running = false, frames = 0, fpsT = 0, tuned = false, intro = 0;
function loop() { if (running) return; running = true; requestAnimationFrame(tick); }
function tick() {
  if (!visible || document.hidden) { running = false; return; }
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  intro = Math.min(1, intro + dt / 1.6); const ie = 1 - Math.pow(1 - intro, 3);
  mx += (tmx - mx) * .05; my += (tmy - my) * .05;
  // adaptive quality: after 2s, if < 45fps drop DPR then bloom
  frames++; fpsT += dt;
  if (!tuned && fpsT > 2) { tuned = true; if (frames / fpsT < 45) { dpr = Math.max(1, dpr - .5); renderer.setPixelRatio(dpr); resize(); if (frames / fpsT < 30) bloom.enabled = false; } }

  const s = scale * (.86 + .14 * ie);
  clover.scale.setScalar(s); clover.position.x = cx;
  clover.position.y = cy + .18 * s + Math.sin(t * .9) * .06 * s;
  clover.rotation.y = (calm ? 0 : Math.sin(t * .45) * .35) + mx * .6 + scrollK * Math.PI * 1.2;
  clover.rotation.x = (calm ? 0 : Math.sin(t * .6) * .08) + my * .3 - .12;
  clover.rotation.z = Math.sin(t * .3) * .04;
  dial.position.set(cx, cy, 0); dial.scale.setScalar(s);
  dial.rotation.x = my * .35 - .08; dial.rotation.y = mx * .4;

  // lap: sweeps in on load, then slowly fills; scrolling finishes the lap
  const p = calm ? .72 : Math.min(.995, (.18 + ie * .3 + (t * .006) % .3) + scrollK * .6);
  arcMat.uniforms.prog.value = p;
  const a = p * Math.PI * 2;
  tip.position.set(Math.sin(a) * R, Math.cos(a) * R, 0);
  tipGlow.color.setHSL(p < .5 ? .42 : p < .85 ? .12 : .98, .9, .6);
  glint.position.set(cx + Math.cos(t * .7) * 3 * s, cy + Math.sin(t * .5) * 2 * s, 3);
  dustMat.uniforms.time.value = t;
  canvas.style.opacity = String(1 - scrollK * .9);
  composer.render();
  if (calm && intro >= 1) { running = false; return; }
  requestAnimationFrame(tick);
}
loop();
}
