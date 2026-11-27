// WMK Ocean 0.4.2 — ondas direcionais e esteiras persistentes em espaço mundial.
import { normalizeOcean, oceanPreset } from './ocean-config.js';
export function createOcean(THREE,scene,initial={}){
 let config=normalizeOcean(initial); const waves=config.waves.map(w=>[w.amplitude,w.kx,w.kz,w.speed]);
 let time=0,phase=0,lastTime=null,amp=config.amplitude;
 const uniforms={uTime:{value:0},uAmplitude:{value:1},uUnder:{value:0},uFogColor:{value:new THREE.Color(0x567b8c)},uFogNear:{value:105},uFogFar:{value:290}};
 Object.assign(uniforms,{uWaves:{value:waves.map(w=>new THREE.Vector4(...w))},uDetail:{value:1},uFoam:{value:1},uReflection:{value:1},uSun:{value:1},uOpacity:{value:.96},uUnderOpacity:{value:.64},uWake:{value:1},uDeep:{value:new THREE.Color()},uShallow:{value:new THREE.Color()},uFoamColor:{value:new THREE.Color()}});
 const waveGLSL=`
 uniform float uTime,uAmplitude;
 uniform vec4 uWaves[4];
 float heightAt(vec2 q){float h=0.;for(int i=0;i<4;i++){vec4 w=uWaves[i];h+=w.x*sin(dot(q,w.yz)+uTime*w.w);}return h*uAmplitude;}
 vec2 slopeAt(vec2 q){vec2 s=vec2(0.);for(int i=0;i<4;i++){vec4 w=uWaves[i];s+=w.x*cos(dot(q,w.yz)+uTime*w.w)*w.yz;}return s*uAmplitude;}
 `;
 const geometry=new THREE.PlaneGeometry(700,700,config.segments,config.segments);geometry.rotateX(-Math.PI/2);
 const material=new THREE.ShaderMaterial({uniforms,side:THREE.DoubleSide,transparent:true,depthWrite:false,
 vertexShader:waveGLSL+`
 varying vec3 vWorld;
 void main(){vec3 p=position;p.y+=heightAt(p.xz);vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}
 `,
 fragmentShader:waveGLSL+`
 uniform float uUnder,uFogNear,uFogFar,uDetail,uFoam,uReflection,uSun,uOpacity,uUnderOpacity;uniform vec3 uFogColor,uDeep,uShallow,uFoamColor;
 varying vec3 vWorld;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){
 vec2 p=vWorld.xz;float dist=length(cameraPosition-vWorld);
 float detail=1.-smoothstep(45.,220.,dist);
 vec2 s=slopeAt(p);
 float a=dot(p,vec2(2.2,1.3))+uTime*2.0,b=dot(p,vec2(-1.7,3.1))-uTime*1.5,c=dot(p,vec2(5.1,-4.3))+uTime*2.8;
 s+=uAmplitude*detail*uDetail*(.12*cos(a)*vec2(.85,.52)+.075*cos(b)*vec2(-.48,.87)+.035*cos(c)*vec2(.76,-.65));
 vec3 N=normalize(vec3(-s.x,1.,-s.y)),V=normalize(cameraPosition-vWorld);
 float F=.025+.975*pow(1.-clamp(abs(dot(N,V)),0.,1.),5.);
 vec3 R=reflect(-V,N),sun=normalize(vec3(-.46,.72,.32));
 vec3 sky=mix(vec3(.54,.70,.78),vec3(.12,.33,.56),clamp(R.y,0.,1.));
 float cloud=noise(R.xz*8.+vec2(uTime*.008,0.));sky=mix(sky,vec3(.75,.82,.87),smoothstep(.60,.88,cloud)*.65);
 float h=heightAt(p)/max(.1,uAmplitude);
 vec3 deep=uDeep,shallow=uShallow;
 vec3 col=mix(mix(deep,shallow,smoothstep(-.7,.8,h)),sky,F*uReflection);
 float sunDot=max(dot(R,sun),0.);col+=vec3(1.,.86,.62)*(pow(sunDot,100.)*.95+pow(sunDot,18.)*.13)*uSun;
 float n=noise(p*1.8+vec2(uTime*.12,-uTime*.08));
 float foam=smoothstep(.48,.77,h+n*.17)*smoothstep(.4,1.2,uAmplitude)*(.35+.65*smoothstep(.3,.7,n));
 col=mix(col,uFoamColor,clamp(foam*.85*detail*uFoam,0.,1.));
 if(uUnder>.5){col=mix(vec3(.015,.15,.23),vec3(.19,.47,.52),1.-F);col+=vec3(.06,.14,.13)*max(0.,sin(a)*sin(b));}
 col=mix(col,uFogColor,smoothstep(uFogNear,uFogFar,dist));gl_FragColor=vec4(col,uUnder>.5?uUnderOpacity:uOpacity);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=1;scene.add(mesh);
 const trails=new Map(), bubbles=[];const maxPoints=112;
 const wakeMaterial=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
 vertexShader:waveGLSL+`attribute float fade;varying float vFade;varying vec2 vUv;void main(){vec3 p=position;p.y=heightAt(p.xz)+.065;vFade=fade;vUv=uv;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
 fragmentShader:`varying float vFade;varying vec2 vUv;uniform float uTime,uWake;uniform vec3 uFoamColor;void main(){float x=abs(vUv.x*2.-1.);float edge=exp(-pow((x-.72)*8.,2.));float core=exp(-x*x*8.);float turbulence=.5+.5*sin(vUv.y*43.+sin(vUv.x*23.+uTime)*2.);float a=(edge*.72+core*.43)*(.4+.6*turbulence)*vFade;gl_FragColor=vec4(uFoamColor,clamp(a*uWake,0.,1.));}`});
 function makeTrail(){
 const g=new THREE.BufferGeometry(),p=new Float32Array(maxPoints*6),f=new Float32Array(maxPoints*2),uv=new Float32Array(maxPoints*4),ix=[];
 for(let i=0;i<maxPoints;i++){uv.set([0,i/(maxPoints-1),1,i/(maxPoints-1)],i*4);if(i<maxPoints-1){let k=i*2;ix.push(k,k+1,k+2,k+1,k+3,k+2);}}
 g.setAttribute("position",new THREE.BufferAttribute(p,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute("fade",new THREE.BufferAttribute(f,1).setUsage(THREE.DynamicDrawUsage));g.setAttribute("uv",new THREE.BufferAttribute(uv,2));g.setIndex(ix);g.setDrawRange(0,0);
 const m=new THREE.Mesh(g,wakeMaterial);m.frustumCulled=false;m.renderOrder=2;scene.add(m);return {m,points:[],last:-1};
 }
 const bubbleGeo=new THREE.SphereGeometry(.1,6,4), bubbleMat=new THREE.MeshBasicMaterial({color:0xa1d8e5,transparent:true,opacity:.55,depthWrite:false});
 const bubbleMesh=new THREE.InstancedMesh(bubbleGeo,bubbleMat,160);bubbleMesh.count=0;bubbleMesh.frustumCulled=false;scene.add(bubbleMesh);const dummy=new THREE.Object3D();
 function heightCPU(x,z){return amp*waves.reduce((h,[a,kx,kz,w])=>h+a*Math.sin(x*kx+z*kz+phase*w),0);}
 function track(id,x,z,heading,speed,width,length,depth,dt){
 let tr=trails.get(id);if(!tr){tr=makeTrail();trails.set(id,tr);}
 const sx=Math.sin(heading),cz=Math.cos(heading),px=x+sx*length*.45,pz=z+cz*length*.45;
 if(depth<2&&Math.abs(speed)>.15&&time-tr.last>.12){tr.points.unshift({x:px,z:pz,t:time,width,heading});tr.last=time;if(tr.points.length>maxPoints)tr.points.pop();}
 if(depth>=2&&Math.abs(speed)>.15&&bubbles.length<160&&Math.random()<dt*config.bubbles){bubbles.push({x:px+(Math.random()-.5)*width,z:pz,y:.28-depth*.15,t:time,size:.65+Math.random()*1.6});}
 }
 function renderEffects(){
 for(const tr of trails.values()){
 tr.points=tr.points.filter(p=>time-p.t<config.wakeLife);const p=tr.m.geometry.attributes.position,f=tr.m.geometry.attributes.fade;
 for(let i=0;i<tr.points.length;i++){const q=tr.points[i],age=time-q.t,w=q.width*.55+age*config.wakeSpread,rx=Math.cos(q.heading),rz=-Math.sin(q.heading);
 p.setXYZ(i*2,q.x-rx*w,0,q.z-rz*w);p.setXYZ(i*2+1,q.x+rx*w,0,q.z+rz*w);let a=Math.max(0,1-age/config.wakeLife)*Math.min(1,age*5+.35);f.setX(i*2,a);f.setX(i*2+1,a);}
 p.needsUpdate=true;f.needsUpdate=true;tr.m.geometry.setDrawRange(0,Math.max(0,tr.points.length-1)*6);}
 for(let i=bubbles.length-1;i>=0;i--){const b=bubbles[i],age=time-b.t;if(age>5||b.y+age*.5>heightCPU(b.x,b.z)){bubbles.splice(i,1);continue;}}
 bubbles.forEach((b,i)=>{let age=time-b.t;dummy.position.set(b.x+Math.sin(age*3+i)*.12,b.y+age*.5,b.z);dummy.scale.setScalar(b.size*(1+age*.12));dummy.updateMatrix();bubbleMesh.setMatrixAt(i,dummy.matrix);});bubbleMesh.count=bubbles.length;bubbleMesh.instanceMatrix.needsUpdate=true;
 }
 function clearEffects(){for(const tr of trails.values()){scene.remove(tr.m);tr.m.geometry.dispose();}trails.clear();bubbles.length=0;bubbleMesh.count=0;}
 function setConfig(raw){
 const next=normalizeOcean(raw);
 if(next.segments!==config.segments){const g=new THREE.PlaneGeometry(700,700,next.segments,next.segments);g.rotateX(-Math.PI/2);mesh.geometry.dispose();mesh.geometry=g;}
 config=next;amp=config.amplitude;uniforms.uAmplitude.value=amp;
 config.waves.forEach((w,i)=>{waves[i]=[w.amplitude,w.kx,w.kz,w.speed];uniforms.uWaves.value[i].set(...waves[i]);});
 for(const [key,u] of Object.entries({detail:"uDetail",foam:"uFoam",reflection:"uReflection",sun:"uSun",opacity:"uOpacity",underOpacity:"uUnderOpacity",wake:"uWake"}))uniforms[u].value=config[key];
 uniforms.uDeep.value.set(config.deep);uniforms.uShallow.value.set(config.shallow);uniforms.uFoamColor.value.set(config.foamColor);
 }
 setConfig(config);
 return {mesh,update(t){const dt=lastTime===null?0:Math.max(0,Math.min(.1,t-lastTime));lastTime=t;time=t;phase+=dt*config.rate;uniforms.uTime.value=phase;},setPreset(n){setConfig(oceanPreset(n));},setConfig,getConfig(){return normalizeOcean(config);},setUnderwater(v){uniforms.uUnder.value=v?1:0;},setFog(f){uniforms.uFogColor.value.copy(f.color);uniforms.uFogNear.value=f.near;uniforms.uFogFar.value=f.far;},heightAt:heightCPU,track,renderEffects,clearEffects};
}
