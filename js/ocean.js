// WMK Ocean — shader procedural original, sem texturas externas.
export function createOcean(THREE, scene) {
  const presets={calm:0.35,normal:1,rough:1.8};
  let t=0, amplitude=1;
  const waves=[[.23,.24,.12,1.1],[.14,-.18,.32,1.65],[.075,.55,.26,2.25]];
  const geometry=new THREE.PlaneGeometry(700,700,160,160);
  geometry.rotateX(-Math.PI/2);
  const uniforms={
    uTime:{value:0},uAmplitude:{value:1},uUnder:{value:0},
    uFogColor:{value:new THREE.Color(0x567b8c)},uFogNear:{value:105},uFogFar:{value:290},
    uSun:{value:new THREE.Vector3(-35,55,24).normalize()}
  };
  const vertexShader=`
    uniform float uTime,uAmplitude;
    varying vec3 vWorld;
    varying vec2 vSlope;
    varying float vHeight;
    void main(){
      vec3 p=position;
      float a=dot(p.xz,vec2(.24,.12))+uTime*1.1;
      float b=dot(p.xz,vec2(-.18,.32))+uTime*1.65;
      float c=dot(p.xz,vec2(.55,.26))+uTime*2.25;
      float h=.23*sin(a)+.14*sin(b)+.075*sin(c);
      vSlope=uAmplitude*(.23*cos(a)*vec2(.24,.12)+.14*cos(b)*vec2(-.18,.32)+.075*cos(c)*vec2(.55,.26));
      p.y+=h*uAmplitude; vHeight=h;
      vWorld=(modelMatrix*vec4(p,1.)).xyz;
      gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);
    }`;
  const fragmentShader=`
    uniform float uTime,uAmplitude,uUnder,uFogNear,uFogFar;
    uniform vec3 uFogColor,uSun;
    varying vec3 vWorld;
    varying vec2 vSlope;
    varying float vHeight;
    void main(){
      vec2 p=vWorld.xz;
      float dist=length(cameraPosition-vWorld);
      float detail=1.-smoothstep(35.,180.,dist);
      float a=dot(p,vec2(2.1,1.3))+uTime*2.1;
      float b=dot(p,vec2(-1.5,2.6))-uTime*1.7;
      float c=dot(p,vec2(5.8,-3.2))+uTime*3.;
      vec2 ripple=detail*uAmplitude*(.075*cos(a)*vec2(.8,.5)+.055*cos(b)*vec2(-.5,.85)+.025*cos(c)*vec2(.9,-.45));
      vec2 slope=vSlope+ripple;
      vec3 N=normalize(vec3(-slope.x,1.,-slope.y));
      vec3 V=normalize(cameraPosition-vWorld);
      float fresnel=.025+.975*pow(1.-clamp(abs(dot(N,V)),0.,1.),5.);
      vec3 R=reflect(-V,N);
      vec3 sky=mix(vec3(.48,.65,.72),vec3(.12,.32,.49),clamp(R.y,0.,1.));
      vec3 water=mix(vec3(.012,.10,.145),vec3(.025,.27,.29),clamp(vHeight+.4,0.,1.));
      float glint=pow(max(dot(R,uSun),0.),85.);
      float broad=pow(max(dot(R,uSun),0.),12.);
      vec3 col=mix(water,sky,fresnel)+vec3(1.,.83,.55)*(glint*.8+broad*.08);
      float foam=smoothstep(.26,.40,vHeight+(.045*sin(a)*sin(b)))*smoothstep(.5,1.5,uAmplitude);
      col=mix(col,vec3(.76,.88,.88),foam*.68*detail);
      if(uUnder>.5){
        col=mix(vec3(.035,.25,.32),vec3(.20,.58,.61),1.-fresnel);
        col+=vec3(.12,.22,.20)*max(0.,sin(a)*sin(b))*.35;
      }
      col=mix(col,uFogColor,smoothstep(uFogNear,uFogFar,dist));
      gl_FragColor=vec4(col,uUnder>.5?.60:.94);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  const material=new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader,side:THREE.DoubleSide,transparent:true,depthWrite:false});
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
  return {mesh,update(time){t=time;uniforms.uTime.value=t;},setPreset(name){amplitude=presets[name]??1;uniforms.uAmplitude.value=amplitude;},setUnderwater(value){uniforms.uUnder.value=value?1:0;},setFog(fog){uniforms.uFogColor.value.copy(fog.color);uniforms.uFogNear.value=fog.near;uniforms.uFogFar.value=fog.far;},heightAt(x,z){return amplitude*waves.reduce((sum,[a,kx,kz,w])=>sum+a*Math.sin(x*kx+z*kz+t*w),0);}};
}
