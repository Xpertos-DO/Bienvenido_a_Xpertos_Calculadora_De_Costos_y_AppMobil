// =========================
// Config (edítame sin miedo)
// =========================
const STORAGE_KEY = 'lead_calc_v2';

// Detecta endpoint por prioridad: query -> localStorage -> constante por defecto

// 🔒 Usa SIEMPRE este endpoint (tu URL /exec):
const LEADS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzwoqZB366HSbIGfCRPe3Edi2b6XjsU5iP-DStYEUlfaPW4LDY6GBJAb3I7aoSXtEl6-Q/exec';

// Limpia cualquier valor viejo que pudo quedar guardado
try { localStorage.removeItem('LEADS_ENDPOINT'); } catch(_) {}


const links = {
  calc: 'https://xpertos-do.github.io/Calculadora_de_Costos_de_Producci-n_y_Manufactura_Xpertos_DO/',
  android: 'https://play.google.com/store/apps/details?id=com.Xperto.Xperto',
  ios: 'https://apps.apple.com/do/app/xpertos/id6742215137'
};

// =========================
// Utilidades
// =========================
const QS = new URLSearchParams(location.search);
const UTM = {
  utm_source: QS.get('utm_source') || 'direct',
  utm_medium: QS.get('utm_medium') || 'none',
  utm_campaign: QS.get('utm_campaign') || 'calculadora',
  utm_content: QS.get('utm_content') || ''
};
function withUtm(url){
  const u = new URL(url, location.origin);
  Object.entries(UTM).forEach(([k,v])=> v && u.searchParams.set(k,v));
  return u.toString();
}
function pushEvent(name, payload={}){ window.dataLayer = window.dataLayer || []; window.dataLayer.push({event:name, ...payload}); }
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display='block';
  setTimeout(()=> t.style.display='none', 3200);
}

// =========================
// CTAs con UTM y OS
// =========================
(function setCtas(){
  // iOS real (no cuenta macOS)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const storeUrl = isIOS ? links.ios : links.android;

  const navApp = document.getElementById('ctaNavApp');
  if(navApp) navApp.href = withUtm(storeUrl);

  const o = document.getElementById('ctaOpenCalc');
  const a = document.getElementById('ctaAndroid');
  const i = document.getElementById('ctaiOS');
  if(o) o.href = withUtm(links.calc);
  if(a) a.href = withUtm(links.android);
  if(i) i.href = withUtm(links.ios);
})();

// =========================
// Lead capture
// =========================
document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('leadForm');
const submitBtn = document.getElementById('submitBtn');
const formMsg = document.getElementById('formMsg');
const success = document.getElementById('success');
const emailInput = document.getElementById('email');

// Estado inicial (si ya capturamos)
try{
  const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if(cached && cached.email){
    if (form) form.style.display = 'none';
    if (success) success.style.display = 'block';
  }
}catch(_){}

// Track clicks con data-evt
document.addEventListener('click', (e)=>{
  const target = e.target.closest('[data-evt]');
  if(target) pushEvent(target.getAttribute('data-evt'));
});

// ENVÍO robusto (sin quebrarse por CORS)
async function sendLead(payload){
  // 1) intento normal (CORS simple)
  try{
    const res = await fetch(LEADS_ENDPOINT,{
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      keepalive: true
    });
    if (res.ok || res.type === 'opaque') return true; // ok real u "opaque"
  }catch(_){ /* seguimos */ }

  // 2) reintento sin CORS (respuesta será opaque, pero el POST llega)
  try{
    await fetch(LEADS_ENDPOINT,{
      method:'POST',
      mode:'no-cors',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      keepalive: true
    });
    return true;
  }catch(_){ /* seguimos */ }

  // 3) último recurso: sendBeacon
  try{
    const blob = new Blob([JSON.stringify(payload)], { type:'text/plain;charset=utf-8' });
    if (navigator.sendBeacon && navigator.sendBeacon(LEADS_ENDPOINT, blob)) return true;
  }catch(_){}

  return false;
}

form?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());
  if(data.company) return; // Honeypot

  const name = String(data.name||'').trim();
  const email = String(data.email||'').trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  emailInput.setAttribute('aria-invalid', validEmail ? 'false' : 'true');
  formMsg.textContent = validEmail ? '' : 'Por favor ingresa un email válido.';
  if(!validEmail) return;

  if(!document.getElementById('consent').checked){
    formMsg.textContent = 'Necesitamos tu consentimiento para enviarte la calculadora.';
    return;
  }

  submitBtn.disabled = true; submitBtn.textContent = 'Enviando…';

  const payload = {
    name, email,
    consent: true,
    source:'landing_calculadora',
    ts: Date.now(),
    utm: UTM,
    page: location.href,
    ua: navigator.userAgent,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  };

  const ok = await sendLead(payload);

  if(!ok){
    formMsg.textContent = 'No se pudo registrar el correo. Intenta de nuevo.';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Quiero mi calculadora';
    return;
  }

  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify({name, email, when:Date.now()})); }catch(_){}
  pushEvent('lead_captured', {tool:'calculadora', email, delivered: ok});

  form.style.display = 'none';
  success.style.display = 'block';
  toast('¡Gracias! Revisa tu correo');

  submitBtn.disabled = false; submitBtn.textContent = 'Quiero mi calculadora';
});

// =========================
// Testimonials dinámicos
// =========================
const TESTIMONIALS = [
  { name:'Laura', role:'Repostería', text:'Descubrí que estaba dejando 12% en la mesa. Subí precios con confianza.', img:'img/testimonials/laura.jpg' },
  { name:'Marcos', role:'Merch', text:'Lo hice en 2 minutos y entendí por qué no me cuadraban los números.', img:'img/testimonials/marcos.jpg' },
  { name:'Paola', role:'Belleza', text:'Luego migré a la app y ahora todo queda guardado.', img:'img/testimonials/paola.jpg' },
  { name:'Carlos', role:'Catering', text:'El cálculo por lote me salvó de vender por debajo del costo.', img:'' },
  { name:'Yasmin', role:'Artesanías', text:'Pasé de Excel a Xpertos y gané claridad de inmediato.', img:'' },
  { name:'Joel', role:'Bebidas', text:'Me ayudó a fijar un margen realista sin perder clientes.', img:'' }
];

function initials(name='?'){
  return name.trim().split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();
}
// Genera avatar SVG con gradiente determinista por nombre
function avatarDataUrl(name){
  const i = initials(name||'?');
  let h = 0; for (let c of (name||'')) h = (h*31 + c.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},70%,50%)"/>
        <stop offset="100%" stop-color="hsl(${(hue+50)%360},70%,45%)"/>
      </linearGradient></defs>
      <rect width="128" height="128" rx="64" fill="url(#g)"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
            font-family="system-ui,Segoe UI,Roboto,Helvetica,Arial" font-size="48" fill="#fff">${i}</text>
    </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function tCard(t){
  const src = t.img ? t.img : avatarDataUrl(t.name);
  return `
    <article class="tcard" data-name="${t.name}">
      <div class="avatar">
        <img src="${src}" loading="lazy" decoding="async" alt="${t.name}" onerror="this.src='${avatarDataUrl(t.name)}'"/>
      </div>
      <div>
        <p class="tname">${t.name} <span class="tmeta">· ${t.role}</span></p>
        <blockquote>“${t.text}”</blockquote>
      </div>
    </article>`;
}

const twRoot = document.getElementById('twCarousel');
let cursor = 0, paused = false, autoTimer = null;
function renderCarousel(){
  const cols = matchMedia('(max-width:640px)').matches ? 1 : matchMedia('(max-width:980px)').matches ? 2 : 3;
  const slice = [];
  for(let i=0;i<cols;i++){
    slice.push(TESTIMONIALS[(cursor+i)%TESTIMONIALS.length]);
  }
  twRoot.innerHTML = slice.map(tCard).join('');
  // animación suave
  requestAnimationFrame(()=> twRoot.querySelectorAll('.tcard').forEach(e=>e.classList.add('show')));
  // JSON-LD Reviews (para SEO)
  const ld = {
    "@context":"https://schema.org",
    "@type":"ItemList",
    "itemListElement": slice.map((t,i)=>({
      "@type":"Review",
      "position": i+1,
      "author": {"@type":"Person","name": t.name},
      "reviewBody": t.text
    }))
  };
  const ldEl = document.getElementById('reviews-ld');
  if (ldEl) ldEl.textContent = JSON.stringify(ld);
}
function next(){ cursor = (cursor+1)%TESTIMONIALS.length; renderCarousel(); pushEvent('tw_next'); }
function prev(){ cursor = (cursor-1+TESTIMONIALS.length)%TESTIMONIALS.length; renderCarousel(); pushEvent('tw_prev'); }
function play(){ if(autoTimer) clearInterval(autoTimer); autoTimer = setInterval(()=>{ if(!paused) next(); }, 6000); }
function toggle(){ paused = !paused; const b = document.getElementById('twPause'); if (b) b.setAttribute('aria-pressed', String(paused)); pushEvent('tw_toggle', {paused}); }

document.getElementById('twNext')?.addEventListener('click', next);
document.getElementById('twPrev')?.addEventListener('click', prev);
document.getElementById('twPause')?.addEventListener('click', toggle);

// Render inicial cuando visible
if (twRoot){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        renderCarousel(); play();
        io.disconnect();
      }
    });
  }, {threshold:.2});
  io.observe(twRoot);
}

// =========================
// Fin
// =========================
