import Link from 'next/link';
import { ClipboardCheck, FilePlus2, Gavel, ArrowRight, CircleDot } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { createApplication } from '../operations/actions';
import styles from '../tools.module.css';

export default async function ApplicationsPage(){
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub!;
  const [{data:cases},{data:apps}]=await Promise.all([
    supabase.from('teaohou_cases').select('id,title,reference_code,status').eq('owner_id',userId).order('created_at',{ascending:false}),
    supabase.from('teaohou_applications').select('id,case_id,application_type,status,court_reference,official_form_url,submitted_at,hearing_at,decision_at,outcome,created_at').eq('owner_id',userId).order('created_at',{ascending:false})
  ]);
  const all=apps||[];
  const draft=all.filter(a=>['draft','preparing','intake'].includes(String(a.status))).length;
  const filed=all.filter(a=>['filed','submitted'].includes(String(a.status))).length;
  const hearings=all.filter(a=>Boolean(a.hearing_at)).length;
  const decided=all.filter(a=>Boolean(a.decision_at)||['decided','completed'].includes(String(a.status))).length;
  return <main className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.heroMain}><span className={styles.eyebrow}>APPLICATIONS</span><h1>Prepare, file and track each whenua application</h1><p>Keep the right case, official source, evidence and Court milestones together. Te Ao Hou helps you organise the pathway; the Māori Land Court makes the legal decision.</p><div className={styles.quickActions}><Link href="/workspace/documents">Check evidence</Link><Link href="/resources">Open official resources</Link></div></div>
      <aside className={styles.heroAside}><div className={styles.metric}><span>Total records</span><strong>{all.length}</strong></div><div className={styles.metric}><span>Preparing</span><strong>{draft}</strong></div><div className={styles.metric}><span>Hearings recorded</span><strong>{hearings}</strong></div></aside>
    </section>
    <div className={styles.pipeline}><div className={styles.pipeCard}><b>{draft}</b><span>Preparing</span></div><div className={styles.pipeCard}><b>{filed}</b><span>Filed / submitted</span></div><div className={styles.pipeCard}><b>{hearings}</b><span>Hearing dates</span></div><div className={styles.pipeCard}><b>{decided}</b><span>Decisions recorded</span></div></div>
    <div className={styles.toolbar}><div><h2>Application workspace</h2><p>Create a record only when it belongs to a real case.</p></div></div>
    <div className={styles.grid2}>
      <section className={styles.panel}><div className={styles.panelTitle}><span><FilePlus2 size={18}/></span><h3>Start an application record</h3></div>{!cases?.length?<div className={styles.empty}><strong>Create a case first</strong>An application needs to stay linked to a specific whenua matter.</div>:<form action={createApplication} className={styles.form}><label>Case<select name="case_id" required defaultValue=""><option value="" disabled>Select case</option>{cases.map(c=><option key={c.id} value={c.id}>{c.reference_code} · {c.title}</option>)}</select></label><label>Application type<input name="application_type" required placeholder="Succession, occupation order, trustee change…"/></label><label>Official source<input name="official_form_url" type="url" placeholder="Official form or guidance URL"/></label><button className={styles.primary} type="submit"><ClipboardCheck size={15}/>Create application record</button></form>}</section>
      <section className={styles.panel}><div className={styles.panelTitle}><span><Gavel size={18}/></span><h3>My application records</h3></div>{!all.length?<div className={styles.empty}><strong>No application records yet</strong>Your active Court-related matters will appear here.</div>:<div className={styles.recordList}>{all.map(a=><article key={a.id} className={styles.record}><div className={styles.recordTop}><div><strong>{a.application_type}</strong><p>{a.court_reference?`Court reference ${a.court_reference}`:'Court reference not recorded yet'}</p></div><span className={styles.status}><CircleDot size={9}/>&nbsp;{String(a.status).replaceAll('_',' ')}</span></div>{a.hearing_at&&<p>Hearing: {new Date(a.hearing_at).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'})}</p>}<div style={{display:'flex',gap:14,flexWrap:'wrap'}}>{a.official_form_url&&<a href={a.official_form_url} target="_blank" rel="noreferrer" className={styles.actionLink}>Official source <ArrowRight size={12}/></a>}<Link href={`/workspace/cases/${a.case_id}`} className={styles.actionLink}>Open linked case <ArrowRight size={12}/></Link></div></article>)}</div>}</section>
    </div>
  </main>
}
