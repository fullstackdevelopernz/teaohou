import Link from 'next/link';
import { CalendarPlus2, CalendarDays, MapPin, ArrowRight } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { createAppointment } from '../operations/actions';
import styles from '../tools.module.css';

export default async function AppointmentsPage(){
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub!;
  const [{data:cases},{data:appointments}]=await Promise.all([
    supabase.from('teaohou_cases').select('id,title,reference_code').eq('owner_id',userId).order('created_at',{ascending:false}),
    supabase.from('teaohou_appointments').select('id,case_id,title,starts_at,location,notes,status').eq('owner_id',userId).order('starts_at',{ascending:true})
  ]);
  const items=appointments||[];
  const upcoming=items.filter(a=>new Date(a.starts_at).getTime()>=Date.now());
  return <main className={styles.page}>
    <section className={styles.hero}><div className={styles.heroMain}><span className={styles.eyebrow}>APPOINTMENTS & HUI</span><h1>Keep every important date connected to the right whenua matter</h1><p>Record hui, professional meetings, case reviews and hearing-related dates in one place so the whānau journey is easier to follow.</p></div><aside className={styles.heroAside}><div className={styles.metric}><span>Upcoming</span><strong>{upcoming.length}</strong></div><div className={styles.metric}><span>Total recorded</span><strong>{items.length}</strong></div></aside></section>
    <div className={styles.toolbar}><div><h2>Your schedule</h2><p>What is coming up and what needs preparation.</p></div></div>
    <div className={styles.grid2}>
      <section className={styles.panel}><div className={styles.panelTitle}><span><CalendarPlus2 size={18}/></span><h3>Add appointment or hui</h3></div>{!cases?.length?<div className={styles.empty}><strong>Create a case first</strong>Appointments need to stay attached to a specific matter.</div>:<form action={createAppointment} className={styles.form}><label>Case<select name="case_id" required defaultValue=""><option value="" disabled>Select case</option>{cases.map(c=><option key={c.id} value={c.id}>{c.reference_code} · {c.title}</option>)}</select></label><label>Title<input name="title" required placeholder="Hui with whānau, planner meeting, Court hearing…"/></label><label>Date and time<input name="starts_at" required type="datetime-local"/></label><label>Location or link<input name="location" placeholder="Marae, office, court, Teams link…"/></label><label>Preparation notes<textarea name="notes" placeholder="What needs to be covered or taken?" rows={4}/></label><button className={styles.primary} type="submit"><CalendarDays size={15}/>Save appointment</button></form>}</section>
      <section className={styles.panel}><div className={styles.panelTitle}><span><CalendarDays size={18}/></span><h3>Upcoming and recorded</h3></div>{!items.length?<div className={styles.empty}><strong>No dates recorded yet</strong>Your upcoming hui and appointments will appear here.</div>:<div className={styles.calendarList}>{items.map(a=>{const d=new Date(a.starts_at);return <article key={a.id} className={styles.event}><div className={styles.dateBox}><b>{d.toLocaleDateString('en-NZ',{day:'2-digit'})}</b><span>{d.toLocaleDateString('en-NZ',{month:'short'})}</span></div><div><div className={styles.recordTop}><strong>{a.title}</strong><span className={styles.status}>{String(a.status).replaceAll('_',' ')}</span></div><p className={styles.docMeta}>{d.toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'})}</p>{a.location&&<p className={styles.docMeta}><MapPin size={11} style={{verticalAlign:'middle',marginRight:5}}/>{a.location}</p>}<Link href={`/workspace/cases/${a.case_id}`} className={styles.actionLink}>Open case <ArrowRight size={12}/></Link></div></article>})}</div>}</section>
    </div>
  </main>
}
