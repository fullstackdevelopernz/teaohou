'use client';

import Link from 'next/link';
import { TriangleAlert, RotateCcw } from 'lucide-react';

export default function HousingError({reset}:{error:Error & {digest?:string};reset:()=>void}){
  return <main style={{maxWidth:900,margin:'0 auto',padding:'48px 28px'}}>
    <section style={{background:'#fff',border:'1px solid #e5dfec',borderRadius:18,padding:28}}>
      <TriangleAlert size={28} color="#4a236f"/>
      <h1 style={{fontSize:28,margin:'16px 0 10px'}}>Housing workspace needs to reload</h1>
      <p style={{fontSize:16,lineHeight:1.65,color:'#625d6b'}}>Your records haven’t been deleted. Reload this workspace to reconnect it to the current Te Ao Hou deployment.</p>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:20}}>
        <button type="button" onClick={()=>reset()} style={{display:'inline-flex',alignItems:'center',gap:8,minHeight:44,padding:'10px 16px',border:0,borderRadius:9,background:'#4a236f',color:'#fff',fontWeight:700}}><RotateCcw size={16}/> Reload housing workspace</button>
        <Link href="/workspace" style={{display:'inline-flex',alignItems:'center',minHeight:44,padding:'10px 16px',border:'1px solid #d8cde2',borderRadius:9,fontWeight:700}}>Back to workspace</Link>
      </div>
    </section>
  </main>;
}
