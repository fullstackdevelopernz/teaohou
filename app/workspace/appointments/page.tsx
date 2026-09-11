import Link from 'next/link';
import { CalendarPlus2, CalendarDays, MapPin, Clock3, ArrowRight, MessageSquareText, FolderOpen, CheckCircle2, XCircle, PencilLine } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { createAppointment, updateAppointment, updateAppointmentStatus } from '../operations/actions';
import styles from './appointments.module.css';

export const dynamic='force-dynamic';

type SearchParams={filter?:string};

function localInputValue(value:string|null){
  if(!value) return '';
  const d=new Date(value);
  const tz=d.getTimezoneOffset()*60000;
  return new Date(d.getTime()-tz).toISOString().slice(0,16);
}

export default async function AppointmentsPage({searchParams}:{searchParams:Promise<SearchParams>}){
  const {filter='upcoming'}=await searchParams;
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub!;
  const [{data:cases},{data:appointments}]=await Promise.all([
    supabase.from('teaohou_cases').select('id,title,reference_code,status').eq('owner_id',userId).order('created_at',{ascending:false}),
    supabase.from('teaohou_appointments').select('id,case_id,title,starts_at,ends_at,location,notes,status,updated_at').eq('owner_id',userId).order('starts_at',{ascending:true})
  ]);

  const caseMap=new Map((cases||[]).map(c=>[c.id,c]));
  const items=appointments||[];
  const now=new Date();
  const startOfToday=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const startOfTomorrow=new Date(startOfToday);startOfTomorrow.setDate(startOfTomorrow.getDate()+1);
  const today=items.filter(a=>{const d=new Date(a.starts_at);return d>=startOfToday&&d<startOfTomorrow&&a.status==='scheduled';});
  const upcoming=items.filter(a=>new Date(a.starts_at)>=startOfTomorrow&&a.status==='scheduled');
  const past=items.filter(a=>new Date(a.starts_at)<startOfToday||a.status==='completed'||a.status==='cancelled');
  const completed=items.filter(a=>a.status==='completed');
  const scheduled=items.filter(a=>a.status==='scheduled');

  const visible=filter==='today'?today:filter==='past'?past:filter==='all'?items:upcoming;
  const grouped=visible.reduce<Record<string,typeof items>>((acc,a)=>{
    const d=new Date(a.starts_at);
    const key=d.toLocaleDateString('en-NZ',{month:'long',year:'numeric'});
    (acc[key]??=[]).push(a);return acc;
  },{});

  return <main className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.heroMain}><span className={styles.eyebrow}>APPOINTMENTS & HUI</span><h1>Keep every important date connected to the whenua matter it belongs to</h1><p>Plan hui, professional meetings, hearings and follow-up dates in one place. Each appointment stays linked to its case so whānau can prepare, attend and record what happened next.</p></div>
      <aside className={styles.heroAside}>
        <div className={styles.metric}><span>Today</span><strong>{today.length}</strong></div>
        <div className={styles.metric}><span>Upcoming</span><strong>{upcoming.length}</strong></div>
        <div className={styles.metric}><span>Scheduled</span><strong>{scheduled.length}</strong></div>
        <div className={styles.metric}><span>Completed</span><strong>{completed.length}</strong></div>
      </aside>
    </section>

    <div className={styles.toolbar}>
      <div><h2>Your matter calendar</h2><p>See what is coming up, prepare properly, then keep a traceable record of the outcome.</p></div>
      <nav className={styles.filters} aria-label="Appointment filters">
        {[['upcoming','Upcoming'],['today','Today'],['past','Past & closed'],['all','All dates']].map(([key,label])=><Link key={key} href={`/workspace/appointments?filter=${key}`} className={`${styles.filter} ${filter===key?styles.active:''}`}>{label}</Link>)}
      </nav>
    </div>

    <div className={styles.layout}>
      <section className={styles.panel}>
        <div className={styles.panelTitle}><span><CalendarPlus2 size={18}/></span><h3>Add appointment or hui</h3></div>
        {!cases?.length?<div className={styles.empty}><strong>Create a matter first</strong>Appointments need to stay attached to a specific whenua matter.</div>:<form action={createAppointment} className={styles.form}>
          <label>Matter<select name="case_id" required defaultValue=""><option value="" disabled>Select matter</option>{cases.map(c=><option key={c.id} value={c.id}>{c.reference_code} · {c.title}</option>)}</select></label>
          <label>Appointment title<input name="title" required maxLength={180} placeholder="Whānau hui, planner meeting, Court hearing…"/></label>
          <div className={styles.formGrid}><label>Starts<input name="starts_at" required type="datetime-local"/></label><label>Ends <span className={styles.helper}>optional</span><input name="ends_at" type="datetime-local"/></label></div>
          <label>Location or meeting link<input name="location" maxLength={500} placeholder="Marae, office, Court, Teams/Zoom link…"/></label>
          <label>Preparation / agenda notes<textarea name="notes" maxLength={4000} placeholder="Who needs to attend? What documents should we take? What questions need answers?" rows={6}/></label>
          <button className={styles.primary} type="submit"><CalendarDays size={15}/>Save to matter calendar</button>
        </form>}
        <div className={styles.quick}>
          <Link href="/workspace/documents"><FolderOpen size={14} style={{verticalAlign:'middle',marginRight:6}}/>Prepare documents</Link>
          <Link href="/workspace/messages"><MessageSquareText size={14} style={{verticalAlign:'middle',marginRight:6}}/>Message about a matter</Link>
          <Link href="/workspace"><ArrowRight size={14} style={{verticalAlign:'middle',marginRight:6}}/>Open matter overview</Link>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelTitle}><span><CalendarDays size={18}/></span><h3>{filter==='today'?'Today':filter==='past'?'Past and closed':filter==='all'?'All appointments':'Upcoming appointments'}</h3></div>
        {!visible.length?<div className={styles.empty}><strong>No appointments in this view</strong>{filter==='upcoming'?'Future scheduled dates will appear here.':'Choose another view or add a new appointment.'}</div>:Object.entries(grouped).map(([month,rows])=><div key={month}><div className={styles.sectionLabel}>{month} <span className={styles.count}>· {rows.length}</span></div><div className={styles.schedule}>{rows.map(a=>{
          const d=new Date(a.starts_at); const end=a.ends_at?new Date(a.ends_at):null; const c=caseMap.get(a.case_id); const isToday=d>=startOfToday&&d<startOfTomorrow;
          return <article key={a.id} className={`${styles.event} ${isToday?styles.today:''} ${a.status==='cancelled'?styles.cancelled:''} ${a.status==='completed'?styles.completed:''}`}>
            <div className={styles.dateBox}><b>{d.toLocaleDateString('en-NZ',{day:'2-digit'})}</b><span>{d.toLocaleDateString('en-NZ',{month:'short'})}</span></div>
            <div>
              <div className={styles.eventTop}><div><span className={styles.caseRef}>{c?.reference_code||'MATTER'}{c?.title?` · ${c.title}`:''}</span><br/><strong>{a.title}</strong></div><span className={styles.status}>{String(a.status).replaceAll('_',' ')}</span></div>
              <div className={styles.meta}><Clock3 size={11} style={{verticalAlign:'middle',marginRight:5}}/>{d.toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'})}{end?` – ${end.toLocaleTimeString('en-NZ',{hour:'numeric',minute:'2-digit'})}`:''}</div>
              {a.location&&<div className={styles.meta}><MapPin size={11} style={{verticalAlign:'middle',marginRight:5}}/>{a.location}</div>}
              {a.notes&&<p className={styles.notes}>{a.notes}</p>}
              <div className={styles.actions}>
                <Link href={`/workspace/cases/${a.case_id}`}>Open matter</Link>
                <Link href="/workspace/documents">Documents</Link>
                <Link href={`/workspace/messages?case=${a.case_id}`}>Messages</Link>
                {a.status==='scheduled'&&<form action={updateAppointmentStatus}><input type="hidden" name="appointment_id" value={a.id}/><input type="hidden" name="case_id" value={a.case_id}/><input type="hidden" name="status" value="completed"/><button type="submit"><CheckCircle2 size={12} style={{verticalAlign:'middle',marginRight:4}}/>Complete</button></form>}
                {a.status==='scheduled'&&<form action={updateAppointmentStatus}><input type="hidden" name="appointment_id" value={a.id}/><input type="hidden" name="case_id" value={a.case_id}/><input type="hidden" name="status" value="cancelled"/><button type="submit"><XCircle size={12} style={{verticalAlign:'middle',marginRight:4}}/>Cancel</button></form>}
              </div>
              <details className={styles.edit}><summary><PencilLine size={12} style={{verticalAlign:'middle',marginRight:5}}/>Edit or reschedule</summary><form action={updateAppointment} className={styles.form} style={{marginTop:12}}><input type="hidden" name="appointment_id" value={a.id}/><input type="hidden" name="case_id" value={a.case_id}/><label>Title<input name="title" required defaultValue={a.title}/></label><div className={styles.formGrid}><label>Starts<input name="starts_at" required type="datetime-local" defaultValue={localInputValue(a.starts_at)}/></label><label>Ends<input name="ends_at" type="datetime-local" defaultValue={localInputValue(a.ends_at)}/></label></div><label>Location or link<input name="location" defaultValue={a.location||''}/></label><label>Preparation / outcome notes<textarea name="notes" rows={4} defaultValue={a.notes||''}/></label><button className={styles.primary} type="submit">Save changes</button></form></details>
            </div>
          </article>})}</div></div>)}
      </section>
    </div>
  </main>
}
