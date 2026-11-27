// WMK Ocean config schema v1 — shared by the game and Studio.
export const DEFAULT_OCEAN={schema:1,amplitude:1,rate:1,detail:1,foam:1,reflection:1,sun:1,opacity:.96,underOpacity:.64,wake:1,wakeLife:9,wakeSpread:.55,bubbles:28,segments:192,deep:"#124269",shallow:"#2c7c86",foamColor:"#e5f5f5",waves:[{amplitude:.43,kx:.105,kz:.045,speed:.83},{amplitude:.27,kx:-.11,kz:.18,speed:1.15},{amplitude:.16,kx:.25,kz:.1,speed:1.48},{amplitude:.085,kx:-.32,kz:.34,speed:1.95}]};
export const OCEAN_KEY="wmk_ocean_v1";
export const FIELDS={amplitude:[0,2.5,.05],rate:[0,3,.05],detail:[0,2,.05],foam:[0,2,.05],reflection:[0,1,.05],sun:[0,2,.05],opacity:[.1,1,.01],underOpacity:[.05,1,.01],wake:[0,2,.05],wakeLife:[1,12,.5],wakeSpread:[0,1.5,.05],bubbles:[0,60,1],segments:[64,256,16]};
const number=(v,d,a,b)=>typeof v==="number"&&Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;
export function normalizeOcean(raw={}){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("JSON de oceano inválido");
 if(raw.schema!==undefined&&raw.schema!==1)throw Error("Versão de schema não suportada");
 const c=JSON.parse(JSON.stringify(DEFAULT_OCEAN));
 for(const [k,[a,b]] of Object.entries(FIELDS))c[k]=number(raw[k],c[k],a,b);
 c.segments=Math.round(c.segments);
 for(const k of ["deep","shallow","foamColor"])if(typeof raw[k]==="string"&&/^#[0-9a-f]{6}$/i.test(raw[k]))c[k]=raw[k];
 if(Array.isArray(raw.waves))c.waves=c.waves.map((w,i)=>{const q=raw.waves[i]||{};return {amplitude:number(q.amplitude,w.amplitude,0,1.5),kx:number(q.kx,w.kx,-.7,.7),kz:number(q.kz,w.kz,-.7,.7),speed:number(q.speed,w.speed,-3,3)};});
 return c;
}
export function loadOcean(){try{return normalizeOcean(JSON.parse(localStorage.getItem(OCEAN_KEY)||"{}"));}catch{return normalizeOcean();}}
export function saveOcean(c){localStorage.setItem(OCEAN_KEY,JSON.stringify(normalizeOcean(c)));}
export function oceanPreset(name){const c=normalizeOcean();if(name==="calm"){c.amplitude=.35;c.foam=.35;}if(name==="rough"){c.amplitude=1.65;c.foam=1.4;}if(name==="tropical"){c.deep="#08627a";c.shallow="#2ab5ad";c.amplitude=.55;}return c;}
