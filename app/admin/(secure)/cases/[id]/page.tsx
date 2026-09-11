import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, FolderOpen, CalendarDays, MessageSquare, ListChecks } from 'lucide-react';
import { createClient } from '../../../../../lib/supabase/server';
import styles from '../../../admin.module.css';

export default async function AdminCasePage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();
  const [{data:caseRow},{data:tasks},{data:apps},{data:docs},{data:appointments},{data:messages}]=await Promise.all([
    supabase.from('teaohou_cases').select('*').eq('id',id).maybeSingle(),
    supabase.from('teaohou_case_tasks').select('id,title,status,due_date').eq('case_id',id).order('created_at',{ascending:false}),
    supabase.from('teaohou_applications').select('id,application_type,status,court_reference,hearing_at').eq('case_id',id).order('created_at',{ascending:false}),
    supabase.from('teaohou_documents').select('id,original_name,category,review_status,created_at').eq('case_id',id).order('created_at',{ascending:false}),
    supabase.from('teaohou_appointments').select('id,title,starts_at,status,location').eq('case_id',id).order('starts_at',{ascending:true}),
    supabase.from('teaohou_messages').select('id,body,created_at,sender_id,visibility').eq('case_id',id).order('created_at',{ascending:false}).limit(20)
  ]);
  if(!caseRow) notFound();
  return <main className={styles.content}>
    <Link href="/admin" style={{fontSize:10,fontWeight:800,color:'#4a236f',display:'inline-flex',gap:6,alignItems:'center',marginBottom:14}}><ArrowLeft size={13}/>Back to case queue</Link>
    <section className={styles.hero}><span>{caseRow.reference_code}</span><h1>{caseRow.title}</h1><p>{String(caseRow.case_type||'case').replaceAll('_',' ')} · {String(caseRow.status||'').replaceAll('_',' ')} · {String(caseRow.priority||'normal')} priority</p></section>
    <div className={styles.stats}><div className={styles.stat}><ListChecks size={18}/><b>{tasks?.length||0}</b><span>Tasks</span></div><div className={styles.stat}><FileText size={18}/><b>{apps?.length||0}</b><span>Applications</span></div><div className={styles.stat}><FolderOpen size={18}/><b>{docs?.length||0}</b><span>Documents</span></div><div className={styles.stat}><MessageSquare size={18}/><b>{messages?.length||0}</b><span>Recent messages</span></div></div>
    <div className={styles.grid}><section className={styles.panel}><h2>Case work</h2><div className={styles.queue}>{(tasks||[]).map(t=><div key={t.id} className={styles.case}><div className={styles.caseTop}><strong>{t.title}</strong><span className={styles.status}>{String(t.status).replaceAll('_',' ')}</span></div>{t.due_date&&<p>Due {new Date(`${t.due_date}T00:00:00`).toLocaleDateString('en-NZ')}</p>}</div>)}{!tasks?.length&&<p>No tasks yet.</p>}</div><h2 style={{marginTop:24}}>Applications</h2><div className={styles.queue}>{(apps||[]).map(a=><div key={a.id} className={styles.case}><div className={styles.caseTop}><strong>{a.application_type}</strong><span className={styles.status}>{String(a.status).replaceAll('_',' ')}</span></div>{a.court_reference&&<p>Court reference: {a.court_reference}</p>}{a.hearing_at&&<p>Hearing: {new Date(a.hearing_at).toLocaleString('en-NZ')}</p>}</div>)}{!apps?.length&&<p>No applications yet.</p>}</div></section>
      <aside><section className={styles.panel}><h2>Evidence</h2>{(docs||[]).slice(0,12).map(d=><div key={d.id} className={styles.task}><strong>{d.original_name}</strong><p>{String(d.category||'other').replaceAll('_',' ')} · {String(d.review_status).replaceAll('_',' ')}</p></div>)}{!docs?.length&&<p>No documents yet.</p>}</section><section className={styles.panel} style={{marginTop:18}}><h2>Appointments</h2>{(appointments||[]).map(a=><div key={a.id} className={styles.task}><strong>{a.title}</strong><p>{new Date(a.starts_at).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'})}{a.location?` · ${a.location}`:''}</p></div>)}{!appointments?.length&&<p>No appointments yet.</p>}</section><section className={styles.panel} style={{marginTop:18}}><h2>Recent messages</h2>{(messages||[]).slice(0,8).map(m=><div key={m.id} className={styles.task}><strong>{new Date(m.created_at).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'})}</strong><p>{m.body}</p></div>)}{!messages?.length&&<p>No messages yet.</p>}</section></aside>
    </div>
  </main>
}
