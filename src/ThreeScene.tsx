import { useEffect, useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ShaderMaterial } from 'three'
import type { VoiceState } from './useTranscription'

type Props = { state: VoiceState; level: MutableRefObject<number>; active: boolean; onReady: () => void; onFailure: () => void }
const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`
// A ray-marched liquid shell surrounds a translucent, moving volume.
// All light is procedural: no HDR downloads, textures or Blender dependency.
const fragment = `precision highp float;
varying vec2 vUv; uniform float uTime; uniform float uLevel; uniform float uAspect;
mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec3 local(vec3 p){p.xz=rot(.55+uTime*.12)*p.xz;p.yz=rot(.27+sin(uTime*.29)*.12)*p.yz;p.xy=rot(-.12+sin(uTime*.23)*.08)*p.xy;return p;}
float field(vec3 p){return sin(p.x*2.8+uTime*.7)*sin(p.y*3.2-uTime*.6)*sin(p.z*2.4+uTime*.4);}
float shape(vec3 p){p=local(p);vec3 q=abs(p)-vec3(.79);float d=length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-.27;return d+field(p)*(.055+uLevel*.1);}
vec3 normalAt(vec3 p){vec2 e=vec2(.003,0.);return normalize(vec3(shape(p+e.xyy)-shape(p-e.xyy),shape(p+e.yxy)-shape(p-e.yxy),shape(p+e.yyx)-shape(p-e.yyx)));}
void main(){
vec2 uv=(vUv-.5)*2.;uv.x*=uAspect;
vec3 ro=vec3(0.,0.,5.);vec3 rd=normalize(vec3(uv*1.65,-4.));
float t=0.;float d=0.;
for(int i=0;i<64;i++){d=shape(ro+rd*t);if(d<.002||t>8.)break;t+=max(d*.8,.004);}
if(t>8.||d>.015){gl_FragColor=vec4(0.);return;}
vec3 hit=ro+rd*t;vec3 n=normalAt(hit);
float fres=pow(1.-max(dot(n,-rd),0.),3.);
vec3 color=vec3(.008,.065,.046);float density=0.;
vec3 refr=refract(rd,n,.79);
for(int j=0;j<28;j++){
float travel=float(j)*.082;
vec3 p=hit+refr*travel;vec3 q=local(p);
float inside=1.-smoothstep(-.1,.04,shape(p));
float f=field(q*1.5+vec3(sin(uTime*.21),0.,0.));
float ribbon=exp(-abs(q.y*.65+q.x*.45+f*.55)*6.);
float thread=pow(.5+.5*sin(q.z*8.+q.x*6.+f*4.+uTime*.6),8.);
vec3 green=vec3(.08,.82,.38);vec3 blue=vec3(.04,.36,.78);vec3 amber=vec3(1.,.34,.065);
vec3 ink=mix(green,blue,smoothstep(-.25,.95,q.x+q.z*.45));
float fire=pow(smoothstep(-.08,.8,f+q.y*.5-q.x*.2),2.);
ink=mix(ink,amber,fire*.98);
float amount=(.02+ribbon*.055+thread*.018)*inside;
color+=ink*amount*(1.-density*.42);density+=amount*.45;
}
vec3 light=normalize(vec3(-.6,1.,2.));
float gloss=pow(max(dot(reflect(rd,n),light),0.),60.);
float rim=pow(max(dot(n,normalize(vec3(-1.,.5,1.))),0.),16.);
color+=vec3(.69,.95,.86)*(fres*.38+gloss*.6+rim*.2);
color+=vec3(.07,.32,.3)*fres;
color=1.-exp(-color*1.6);
float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
color+=grain*.012;
float alpha=smoothstep(0.,.12,max(dot(n,-rd),0.))*.96;
gl_FragColor=vec4(color,alpha);
}`
function LiquidCube({ level, onReady }: Props) {
  const material = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uTime:{value:0},uLevel:{value:0},uAspect:{value:1} }), [])
  useEffect(onReady,[onReady])
  useFrame(({ clock, size },delta) => {
    if (!material.current) return
    uniforms.uTime.value=clock.elapsedTime
    uniforms.uLevel.value+=(level.current-uniforms.uLevel.value)*Math.min(1,delta*9)
    uniforms.uAspect.value=size.width/size.height
  })
  return <mesh><planeGeometry args={[2,2]}/><shaderMaterial ref={material} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false}/></mesh>
}
export default function ThreeScene(props: Props) {
  const canvas=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{const node=canvas.current;const lost=(event:Event)=>{event.preventDefault();props.onFailure()};node?.addEventListener('webglcontextlost',lost);return()=>node?.removeEventListener('webglcontextlost',lost)},[props.onFailure])
  return <div className="cube-canvas"><Canvas ref={canvas} dpr={[1,1.25]} frameloop={props.active?'always':'never'} gl={{alpha:true,antialias:false,powerPreference:'low-power'}}><LiquidCube {...props}/></Canvas></div>
}
