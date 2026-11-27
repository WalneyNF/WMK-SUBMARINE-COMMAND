// WMK Ocean 0.4.2 — ondas direcionais e esteiras persistentes em espaço mundial.
export function createOcean(THREE,scene){
 const waves=[[0.43,0.105,0.045,0.83],[0.27,-0.11,0.18,1.15],[0.16,0.25,0.1,1.48],[0.085,-0.32,0.34,1.95]], presets={calm:.35,normal:1,rough:1.65};
 let time=0,amp=1;
 const uniforms={uTime:{value:0},uAmplitude:{value:1},uUnder:{value:0},uFogColor:{value:new THREE.Color(0x567b8c)},uFogNear:{value:105},uFogFar:{value:290}};
 const waveGLSL=`
 uniform float uTime,uAmplitude;
 float heightAt(vec2 q){float p0=dot(q,vec2(0.105,0.045))+uTime*0.83;
float p1=dot(q,vec2(-0.11,0.18))+uTime*1.15;
float p2=dot(q,vec2(0.25,0.1))+uTime*1.48;
float p3=dot(q,vec2(-0.32,0.34))+uTime*1.95; return uAmplitude*(0.43*sin(p0)+0.27*sin(p1)+0.16*sin(p2)+0.085*sin(p3));}
 vec2 slopeAt(vec2 q){float p0=dot(q,vec2(0.105,0.045))+uTime*0.83;
float p1=dot(q,vec2(-0.11,0.18))+uTime*1.15;
float p2=dot(q,vec2(0.25,0.1))+uTime*1.48;
float p3=dot(q,vec2(-0.32,0.34))+uTime*1.95; return uAmplitude*(0.43*cos(p0)*vec2(0.105,0.045)+0.27*cos(p1)*vec2(-0.11,0.18)+0.16*cos(p2)*vec2(0.25,0.1)+0.085*cos(p3)*vec2(-0.32,0.34));}
 `;
 const geometry=new THREE.PlaneGeometry(700,700,192,192);geometry.rotateX(-Math.PI/2);
 const material=new THREE.ShaderMaterial({uniforms,side:THREE.DoubleSide,transparent:true,depthWrite:false,
 vertexShader:waveGLSL+`
 varying vec3 vWorld;
 void main(){vec3 p=position;p.y+=heightAt(p.xz);vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}
 `,
 fragmentShader:waveGLSL+`
 uniform float uUnder,uFogNear,uFogFar;uniform vec3 uFogColor;
 varying vec3 vWorld;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){
 vec2 p=vWorld.xz;float dist=length(cameraPosition-vWorld);
 float detail=1.-smoothstep(45.,220.,dist);
 vec2 s=slopeAt(p);
 float a=dot(p,vec2(2.2,1.3))+uTime*2.0,b=dot(p,vec2(-1.7,3.1))-uTime*1.5,c=dot(p,vec2(5.1,-4.3))+uTime*2.8;
 s+=uAmplitude*detail*(.12*cos(a)*vec2(.85,.52)+.075*cos(b)*vec2(-.48,.87)+.035*cos(c)*vec2(.76,-.65));
 vec3 N=normalize(vec3(-s.x,1.,-s.y)),V=normalize(cameraPosition-vWorld);
 float F=.025+.975*pow(1.-clamp(abs(dot(N,V)),0.,1.),5.);
 vec3 R=reflect(-V,N),sun=normalize(vec3(-.46,.72,.32));
 vec3 sky=mix(vec3(.54,.70,.78),vec3(.12,.33,.56),clamp(R.y,0.,1.));
 float cloud=noise(R.xz*8.+vec2(uTime*.008,0.));sky=mix(sky,vec3(.75,.82,.87),smoothstep(.60,.88,cloud)*.65);
 float h=heightAt(p)/max(.1,uAmplitude);
 vec3 deep=vec3(.006,.055,.105),shallow=vec3(.025,.20,.24);
 vec3 col=mix(mix(deep,shallow,smoothstep(-.7,.8,h)),sky,F);
 float sunDot=max(dot(R,sun),0.);col+=vec3(1.,.86,.62)*(pow(sunDot,100.)*.95+pow(sunDot,18.)*.13);
 float n=noise(p*1.8+vec2(uTime*.12,-uTime*.08));
 float foam=smoothstep(.48,.77,h+n*.17)*smoothstep(.4,1.2,uAmplitude)*(.35+.65*smoothstep(.3,.7,n));
 col=mix(col,vec3(.78,.91,.91),foam*.85*detail);
 if(uUnder>.5){col=mix(vec3(.015,.15,.23),vec3(.19,.47,.52),1.-F);col+=vec3(.06,.14,.13)*max(0.,sin(a)*sin(b));}
 col=mix(col,uFogColor,smoothstep(uFogNear,uFogFar,dist));gl_FragColor=vec4(col,uUnder>.5?.64:.96);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=1;scene.add(mesh);
 const trails=new Map(), bubbles=[];const maxPoints=48;
 const wakeMaterial=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
 vertexShader:waveGLSL+`attribute float fade;varying float vFade;varying vec2 vUv;void main(){vec3 p=position;p.y=heightAt(p.xz)+.065;vFade=fade;vUv=uv;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
 fragmentShader:`varying float vFade;varying vec2 vUv;uniform float uTime;void main(){float x=abs(vUv.x*2.-1.);float edge=exp(-pow((x-.72)*8.,2.));float core=exp(-x*x*8.);float turbulence=.5+.5*sin(vUv.y*43.+sin(vUv.x*23.+uTime)*2.);float a=(edge*.72+core*.43)*(.4+.6*turbulence)*vFade;gl_FragColor=vec4(.79,.91,.93,a);}`});
 function makeTrail(){
 const g=new THREE.BufferGeometry(),p=new Float32Array(maxPoints*6),f=new Float32Array(maxPoints*2),uv=new Float32Array(maxPoints*4),ix=[];
 for(let i=0;i<maxPoints;i++){uv.set([0,i/(maxPoints-1),1,i/(maxPoints-1)],i*4);if(i<maxPoints-1){let k=i*2;ix.push(k,k+1,k+2,k+1,k+3,k+2);}}
 g.setAttribute("position",new THREE.BufferAttribute(p,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute("fade",new THREE.BufferAttribute(f,1).setUsage(THREE.DynamicDrawUsage));g.setAttribute("uv",new THREE.BufferAttribute(uv,2));g.setIndex(ix);g.setDrawRange(0,0);
 const m=new THREE.Mesh(g,wakeMaterial);m.frustumCulled=false;m.renderOrder=2;scene.add(m);return {m,points:[],last:-1};
 }
 const bubbleGeo=new THREE.SphereGeometry(.1,6,4), bubbleMat=new THREE.MeshBasicMaterial({color:0xa1d8e5,transparent:true,opacity:.55,depthWrite:false});
 const bubbleMesh=new THREE.InstancedMesh(bubbleGeo,bubbleMat,160);bubbleMesh.count=0;bubbleMesh.frustumCulled=false;scene.add(bubbleMesh);const dummy=new THREE.Object3D();
 function heightCPU(x,z){return amp*waves.reduce((h,[a,kx,kz,w])=>h+a*Math.sin(x*kx+z*kz+time*w),0);}
 function track(id,x,z,heading,speed,width,length,depth,dt){
 let tr=trails.get(id);if(!tr){tr=makeTrail();trails.set(id,tr);}
 const sx=Math.sin(heading),cz=Math.cos(heading),px=x+sx*length*.45,pz=z+cz*length*.45;
 if(depth<2&&Math.abs(speed)>.15&&time-tr.last>.12){tr.points.unshift({x:px,z:pz,t:time,width,heading});tr.last=time;if(tr.points.length>maxPoints)tr.points.pop();}
 if(depth>=2&&Math.abs(speed)>.15&&bubbles.length<160&&Math.random()<dt*28){bubbles.push({x:px+(Math.random()-.5)*width,z:pz,y:.28-depth*.15,t:time,size:.65+Math.random()*1.6});}
 }
 function renderEffects(){
 for(const tr of trails.values()){
 tr.points=tr.points.filter(p=>time-p.t<9);const p=tr.m.geometry.attributes.position,f=tr.m.geometry.attributes.fade;
 for(let i=0;i<tr.points.length;i++){const q=tr.points[i],age=time-q.t,w=q.width*.55+age*.55,rx=Math.cos(q.heading),rz=-Math.sin(q.heading);
 p.setXYZ(i*2,q.x-rx*w,0,q.z-rz*w);p.setXYZ(i*2+1,q.x+rx*w,0,q.z+rz*w);let a=Math.max(0,1-age/9)*Math.min(1,age*5+.35);f.setX(i*2,a);f.setX(i*2+1,a);}
 p.needsUpdate=true;f.needsUpdate=true;tr.m.geometry.setDrawRange(0,Math.max(0,tr.points.length-1)*6);}
 for(let i=bubbles.length-1;i>=0;i--){const b=bubbles[i],age=time-b.t;if(age>5||b.y+age*.5>heightCPU(b.x,b.z)){bubbles.splice(i,1);continue;}}
 bubbles.forEach((b,i)=>{let age=time-b.t;dummy.position.set(b.x+Math.sin(age*3+i)*.12,b.y+age*.5,b.z);dummy.scale.setScalar(b.size*(1+age*.12));dummy.updateMatrix();bubbleMesh.setMatrixAt(i,dummy.matrix);});bubbleMesh.count=bubbles.length;bubbleMesh.instanceMatrix.needsUpdate=true;
 }
 function clearEffects(){for(const tr of trails.values()){scene.remove(tr.m);tr.m.geometry.dispose();}trails.clear();bubbles.length=0;bubbleMesh.count=0;}
 return {mesh,update(t){time=t;uniforms.uTime.value=t;},setPreset(n){amp=presets[n]??1;uniforms.uAmplitude.value=amp;},setUnderwater(v){uniforms.uUnder.value=v?1:0;},setFog(f){uniforms.uFogColor.value.copy(f.color);uniforms.uFogNear.value=f.near;uniforms.uFogFar.value=f.far;},heightAt:heightCPU,track,renderEffects,clearEffects};
}
