import { CheckCircle2, Circle, Clock3, ShieldCheck } from 'lucide-react';
import { setHousingStepStatus } from '../actions';
import styles from '../tools.module.css';

type Step={id:string;sequence:number;title:string;status:string};

const evidence=[
  'Ownership record + written authority',
  'Site information + service notes',
  'Project brief + indicative budget',
  'Council / professional advice',
  'Budget + funding evidence',
  'Approved pack + contracts'
];

export default function HousingReadiness({caseId,steps}:{caseId:string;steps:Step[]}){
  const complete=steps.filter(step=>step.status==='complete').length;
  const percent=steps.length?Math.round((complete/steps.length)*100):0;

  return <section className={styles.readinessPanel}>
    <div className={styles.readinessTop}>
      <div>
        <span className={styles.eyebrowDark}>MY PROJECT READINESS</span>
        <h2>Know what’s ready — and what still blocks the build</h2>
        <p>These gates are saved against this housing case. Mark a gate complete only when the project record contains enough evidence to rely on it.</p>
      </div>
      <div className={styles.progressRing} aria-label={`${percent}% ready`}><strong>{percent}%</strong><span>ready</span></div>
    </div>
    <div className={styles.progressTrack}><span style={{width:`${percent}%`}}/></div>
    <div className={styles.gateList}>
      {steps.map((step,index)=>{
        const done=step.status==='complete';
        const working=step.status==='in_progress';
        return <div key={step.id} className={`${styles.gateRow} ${done?styles.gateDone:''}`}>
          <span className={styles.gateIcon}>{done?<CheckCircle2 size={22}/>:working?<Clock3 size={22}/>:<Circle size={22}/>}</span>
          <span className={styles.gateNumber}>{String(step.sequence).padStart(2,'0')}</span>
          <span className={styles.gateCopy}><strong>{step.title}</strong><small>{done?'Evidence gate recorded as complete.':working?'This is the current project gate.':'This gate has not started yet.'}</small><em><ShieldCheck size={12}/>{evidence[index]??'Supporting project evidence'}</em></span>
          <form action={setHousingStepStatus} className={styles.gateActions}>
            <input type="hidden" name="case_id" value={caseId}/><input type="hidden" name="step_id" value={step.id}/>
            {done?<button name="status" value="in_progress" type="submit">Reopen</button>:<button name="status" value="complete" type="submit">Mark complete</button>}
          </form>
        </div>
      })}
    </div>
  </section>
}
