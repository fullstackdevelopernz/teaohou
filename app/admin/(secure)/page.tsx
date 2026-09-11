import Link from 'next/link';
import { BriefcaseBusiness, ListChecks, UserRoundCheck, Clock3, ArrowRight } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { assignCaseToSelf, createTask, updateCaseStatus, updateTaskStatus } from '../../workspace/operations/actions';
import styles from '../admin.module.css';

const statuses=['intake','triage','active','waiting','ready_to_file','filed','hearing','completed','closed'];

export default async function AdminDashboard(){
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub!;
  const [{data:profile},{data:cases},{data:tasks}]=await Promise.all([
    supabase.from('teaohou_profiles').select('role,display_name').eq('user_id',userId).maybeSingle(),
    supabase.from('teaohou_cases').select('id,reference_code,title,case_type,status,priority,assigned_to,target_date,created_at').order('created_at',{ascending:false}).limit(100),
    supabase.from('teaohou_case_tasks').select('id,case_id,title,status,due_date,assigned_to,owner_id').order('created_at',{ascending:false}).limit(100)
  ]);
  const all=cases||[];
  const allTasks=tasks||[];
  const unassigned=all.filter(c=>!c.assigned_to);
  const mine=all.filter(c=>c.assigned_to===userId);
  const overdue=allTasks.filter(t=>t.due_date&&new Date(`${t.due_date}T23:59:59`).getTime()<Date.now()&&!['completed','cancelled'].includes(t.status));
  return <main className={styles.content}>
    <section className={styles.hero}><span>JACKSON'S OPERATIONS WORKSPACE</span><h1>Case management command centre</h1><p>Triage new matters, assign ownership, manage work, track deadlines and keep whānau cases moving through the right operational stage.</p></section>
    <div className={styles.stats}><div className={styles.stat}><BriefcaseBusiness size={18}/><b>{all.length}</b><span>Total visible cases</span></div><div className={styles.stat}><Clock3 size={18}/><b>{unassigned.length}</b><span>Unassigned intake</span></div><div className={styles.stat}><UserRoundCheck size={18}/><b>{mine.length}</b><span>Assigned to you</span></div><div className={styles.stat}><ListChecks size={18}/><b>{overdue.length}</b><span>Overdue tasks</span></div></div>
    <div className={styles.grid}><section className={styles.panel} id="cases"><h2>Active case queue</h2>{!all.length?<p>No live cases yet.</p>:<div className={styles.queue}>{all.map(c=><article key={c.id} className={styles.case}><div className={styles.caseTop}><div><strong>{c.reference_code} · {c.title}</strong><p>{c.case_type} · {c.priority} priority{c.target_date?` · target ${new Date(`${c.target_date}T00:00:00`).toLocaleDateString('en-NZ')}`:''}</p></div><span className={styles.status}>{String(c.status).replaceAll('_',' ')}</span></div><div className={styles.actions}>{!c.assigned_to&&<form action={assignCaseToSelf}><input type="hidden" name="case_id" value={c.id}/><button type="submit">Assign to me</button></form>}<form action={updateCaseStatus} style={{display:'flex',gap:7}}><input type="hidden" name="case_id" value={c.id}/><select name="status" defaultValue={c.status}>{statuses.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select><button type="submit">Update stage</button></form><Link href={`/workspace/cases/${c.id}`} style={{fontSize:10,fontWeight:800,color:'#4a236f',alignSelf:'center'}}>Open case <ArrowRight size={11} style={{verticalAlign:'middle'}}/></Link></div></article>)}</div>}</section>
      <aside><section className={styles.panel}><h2>Create case task</h2><form action={createTask} className={styles.formPanel}><select name="case_id" required defaultValue=""><option value="" disabled>Select case</option>{all.map(c=><option key={c.id} value={c.id}>{c.reference_code} · {c.title}</option>)}</select><input name="title" required placeholder="Task title"/><textarea name="description" rows={3} placeholder="What needs to happen?"/><input name="due_date" type="date"/><button type="submit">Add task</button></form></section><section className={styles.panel} id="tasks" style={{marginTop:18}}><h2>Task board</h2>{!allTasks.length?<p>No case tasks yet.</p>:allTasks.slice(0,20).map(t=><div key={t.id} className={styles.task}><strong>{t.title}</strong>{t.due_date&&<p>Due {new Date(`${t.due_date}T00:00:00`).toLocaleDateString('en-NZ')}</p>}<form action={updateTaskStatus} className={styles.actions}><input type="hidden" name="task_id" value={t.id}/><input type="hidden" name="case_id" value={t.case_id}/><select name="status" defaultValue={t.status}>{['not_started','in_progress','blocked','completed','cancelled'].map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select><button type="submit">Save</button></form></div>)}</section></aside>
    </div>
  </main>
}
