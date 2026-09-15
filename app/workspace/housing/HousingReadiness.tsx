'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, RotateCcw, ShieldCheck } from 'lucide-react';
import styles from '../tools.module.css';

type Gate = {
  id: string;
  title: string;
  description: string;
  evidence: string;
};

const gates: Gate[] = [
  { id: 'authority', title: 'Authority confirmed', description: 'The owners, trustees or authorised decision-makers are known and the right to occupy or develop is clear.', evidence: 'Ownership record + written authority' },
  { id: 'site', title: 'Site checked', description: 'Access, water, wastewater, power, hazards and physical constraints have been investigated.', evidence: 'Site information + service notes' },
  { id: 'scope', title: 'Build goal defined', description: 'The household, number of homes, intended use, concept and indicative budget are recorded.', evidence: 'Project brief + indicative budget' },
  { id: 'consents', title: 'Consent pathway checked', description: 'Council planning, resource consent, building consent and technical report requirements are understood.', evidence: 'Council / professional advice' },
  { id: 'funding', title: 'Funding position understood', description: 'Likely project cost, available contribution, affordability and finance pathway have been tested.', evidence: 'Budget + funding evidence' },
  { id: 'build', title: 'Construction gate ready', description: 'Authority, design, consents, finance, contracts and insurance are ready before physical work starts.', evidence: 'Approved pack + contracts' },
];

const STORAGE_KEY = 'teaohou:housing-readiness:v1';

export default function HousingReadiness(){
  const [complete,setComplete] = useState<string[]>([]);
  const [loaded,setLoaded] = useState(false);

  useEffect(()=>{
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if(saved) setComplete(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  },[]);

  useEffect(()=>{
    if(!loaded) return;
    try { window.localStorage.setItem(STORAGE_KEY,JSON.stringify(complete)); } catch {}
  },[complete,loaded]);

  const percent = useMemo(()=>Math.round((complete.length/gates.length)*100),[complete]);
  const toggle=(id:string)=>setComplete(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);

  return <section className={styles.readinessPanel}>
    <div className={styles.readinessTop}>
      <div>
        <span className={styles.eyebrowDark}>MY PROJECT READINESS</span>
        <h2>Know what’s ready — and what still blocks the build</h2>
        <p>Tick a gate only when you have enough evidence to rely on it. This tracker is saved on this device.</p>
      </div>
      <div className={styles.progressRing} aria-label={`${percent}% ready`}>
        <strong>{percent}%</strong><span>ready</span>
      </div>
    </div>
    <div className={styles.progressTrack}><span style={{width:`${percent}%`}}/></div>
    <div className={styles.gateList}>
      {gates.map((gate,index)=>{
        const done=complete.includes(gate.id);
        return <button type="button" key={gate.id} className={`${styles.gateRow} ${done?styles.gateDone:''}`} onClick={()=>toggle(gate.id)} aria-pressed={done}>
          <span className={styles.gateIcon}>{done?<CheckCircle2 size={22}/>:<Circle size={22}/>}</span>
          <span className={styles.gateNumber}>{String(index+1).padStart(2,'0')}</span>
          <span className={styles.gateCopy}><strong>{gate.title}</strong><small>{gate.description}</small><em><ShieldCheck size={12}/>{gate.evidence}</em></span>
        </button>
      })}
    </div>
    {complete.length>0&&<button className={styles.resetButton} type="button" onClick={()=>setComplete([])}><RotateCcw size={13}/> Reset tracker</button>}
  </section>
}
