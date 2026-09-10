import Link from 'next/link';
import { createClient } from '../../../lib/supabase/server';
import { createAppointment } from '../operations/actions';

export default async function AppointmentsPage(){
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub!;
  const [{data:cases},{data:appointments}]=await Promise.all([
    supabase.from('teaohou_cases').select('id,title,reference_code').eq('owner_id',userId).order('created_at',{ascending:false}),
    supabase.from('teaohou_appointments').select('id,case_id,title,starts_at,location,notes,status').eq('owner_id',userId).order('starts_at',{ascending:true})
  ]);
  return <div className="workspace-content"><span className="eyebrow">APPOINTMENTS</span><h1 className="workspace-title">Appointments and hui</h1><p className="workspace-lead">Record meetings, hui, professional appointments and hearing-related dates against the right case.</p><div className="workspace-grid">
    <section className="panel"><h3>Add appointment</h3><form action={createAppointment} style={{display:'grid',gap:12,marginTop:16}}><select name="case_id" required defaultValue=""><option value="" disabled>Select case</option>{(cases||[]).map(c=><option key={c.id} value={c.id}>{c.reference_code} · {c.title}</option>)}</select><input name="title" required placeholder="Appointment or hui title"/><input name="starts_at" required type="datetime-local"/><input name="location" placeholder="Location or video link"/><textarea name="notes" placeholder="What needs to be covered?" rows={4}/><button className="button button-primary" type="submit">Save appointment</button></form></section>
    <section className="panel"><h3>Upcoming and recorded</h3>{!appointments?.length?<p>No appointments recorded yet.</p>:<div style={{display:'grid',gap:12,marginTop:14}}>{appointments.map(a=><div key={a.id} style={{border:'1px solid #e5dfec',borderRadius:12,padding:14}}><strong>{a.title}</strong><p style={{margin:'7px 0'}}>{new Date(a.starts_at).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'})}</p>{a.location&&<p>{a.location}</p>}<span>{a.status}</span><div><Link href={`/workspace/cases/${a.case_id}`} className="panel-link">Open case</Link></div></div>)}</div>}</section>
  </div></div>
}
