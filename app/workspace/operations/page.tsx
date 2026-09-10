import Link from 'next/link';
import { createClient } from '../../../lib/supabase/server';
import { assignCaseToSelf, createTask, updateCaseStatus, updateTaskStatus } from './actions';

const staffRoles=['case_worker','admin','professional'];
const statuses=['intake','triage','active','waiting','ready_to_file','filed','hearing','completed','closed'];

export default async function OperationsPage(){
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub!;
  const {data:profile}=await supabase.from('teaohou_profiles').select('role,display_name').eq('user_id',userId).maybeSingle();
  const isStaff=staffRoles.includes(profile?.role||'');
  if(!isStaff) return <div className="workspace-content"><span className="eyebrow">OPERATIONS</span><h1 className="workspace-title">Staff workspace</h1><div className="notice">This area is restricted to Te Ao Hou case workers, professional staff and administrators.</div></div>;

  const [{data:cases},{data:tasks}]=await Promise.all([
    supabase.from('teaohou_cases').select('id,reference_code,title,case_type,status,priority,assigned_to,target_date,created_at').order('created_at',{ascending:false}).limit(100),
    supabase.from('teaohou_case_tasks').select('id,case_id,title,status,due_date,assigned_to,owner_id').order('created_at',{ascending:false}).limit(100)
  ]);
  const unassigned=(cases||[]).filter(c=>!c.assigned_to);
  const mine=(cases||[]).filter(c=>c.assigned_to===userId);
  return <div className="workspace-content"><span className="eyebrow">JACKSON'S OPERATIONS WORKSPACE</span><h1 className="workspace-title">Case management</h1><p className="workspace-lead">Triage incoming matters, take ownership, move cases through controlled stages and create the work needed to get each whānau to the next decision point.</p>
    <div className="workspace-grid"><section className="panel"><h3>Queue</h3><p><strong>{unassigned.length}</strong> unassigned · <strong>{mine.length}</strong> assigned to you · <strong>{cases?.length||0}</strong> total visible</p></section><section className="panel"><h3>Role</h3><p>{profile?.display_name||'Staff'} · {profile?.role?.replaceAll('_',' ')}</p></section></div>
    <section className="panel" style={{marginTop:20}}><h3>Active case queue</h3>{!cases?.length?<p>No live cases yet.</p>:<div style={{display:'grid',gap:14,marginTop:16}}>{cases.map(c=><article key={c.id} style={{border:'1px solid #e5dfec',borderRadius:12,padding:16}}><div style={{display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}><div><strong>{c.reference_code} · {c.title}</strong><p style={{margin:'6px 0'}}>{c.case_type} · {c.priority} priority</p></div><Link href={`/workspace/cases/${c.id}`} className="panel-link">Open case</Link></div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>{!c.assigned_to&&<form action={assignCaseToSelf}><input type="hidden" name="case_id" value={c.id}/><button className="button button-primary" type="submit">Assign to me</button></form>}<form action={updateCaseStatus} style={{display:'flex',gap:8}}><input type="hidden" name="case_id" value={c.id}/><select name="status" defaultValue={c.status}>{statuses.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select><button className="button" type="submit">Update stage</button></form></div></article>)}</div>}</section>
    <div className="workspace-grid" style={{marginTop:20}}><section className="panel"><h3>Create case task</h3><form action={createTask} style={{display:'grid',gap:12,marginTop:16}}><select name="case_id" required defaultValue=""><option value="" disabled>Select case</option>{(cases||[]).map(c=><option key={c.id} value={c.id}>{c.reference_code} · {c.title}</option>)}</select><input name="title" required placeholder="Task title"/><textarea name="description" rows={3} placeholder="What needs to happen?"/><input name="due_date" type="date"/><button className="button button-primary" type="submit">Add task</button></form></section>
    <section className="panel"><h3>Task board</h3>{!tasks?.length?<p>No case tasks yet.</p>:<div style={{display:'grid',gap:10,marginTop:14}}>{tasks.map(t=><div key={t.id} style={{border:'1px solid #e5dfec',borderRadius:12,padding:14}}><strong>{t.title}</strong>{t.due_date&&<p>Due {new Date(`${t.due_date}T00:00:00`).toLocaleDateString('en-NZ')}</p>}<form action={updateTaskStatus} style={{display:'flex',gap:8,marginTop:8}}><input type="hidden" name="task_id" value={t.id}/><input type="hidden" name="case_id" value={t.case_id}/><select name="status" defaultValue={t.status}>{['not_started','in_progress','blocked','completed','cancelled'].map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select><button className="button" type="submit">Save</button></form></div>)}</div>}</section></div>
  </div>
}
