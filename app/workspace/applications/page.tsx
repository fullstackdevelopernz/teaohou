import Link from 'next/link';
import { createClient } from '../../../lib/supabase/server';
import { createApplication } from '../operations/actions';

export default async function ApplicationsPage(){
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub!;
  const [{data:cases},{data:apps}]=await Promise.all([
    supabase.from('teaohou_cases').select('id,title,reference_code,status').eq('owner_id',userId).order('created_at',{ascending:false}),
    supabase.from('teaohou_applications').select('id,case_id,application_type,status,court_reference,official_form_url,submitted_at,hearing_at,decision_at,outcome,created_at').eq('owner_id',userId).order('created_at',{ascending:false})
  ]);
  return <div className="workspace-content">
    <span className="eyebrow">APPLICATIONS</span><h1 className="workspace-title">Prepare and track applications</h1><p className="workspace-lead">Keep the pathway, official source and progress for each Māori Land Court matter together. Te Ao Hou records preparation and progress; it does not make Court decisions.</p>
    <div className="workspace-grid">
      <section className="panel" style={{gridColumn:'span 2'}}><h3>Start an application record</h3><form action={createApplication} style={{display:'grid',gap:12,marginTop:16}}>
        <select name="case_id" required defaultValue=""><option value="" disabled>Select case</option>{(cases||[]).map(c=><option key={c.id} value={c.id}>{c.reference_code} · {c.title}</option>)}</select>
        <input name="application_type" required placeholder="e.g. Succession, occupation order, trustee change" />
        <input name="official_form_url" type="url" placeholder="Official form or guidance URL" />
        <button className="button button-primary" type="submit">Create application record</button>
      </form></section>
      <section className="panel" style={{gridColumn:'span 2'}}><h3>My application records</h3>{!apps?.length?<p>No application records yet.</p>:<div style={{display:'grid',gap:12,marginTop:14}}>{apps.map(a=><div key={a.id} style={{border:'1px solid #e5dfec',borderRadius:12,padding:16}}><div style={{display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}><strong>{a.application_type}</strong><span>{String(a.status).replaceAll('_',' ')}</span></div>{a.court_reference&&<p>Court reference: {a.court_reference}</p>}{a.official_form_url&&<p><a href={a.official_form_url} target="_blank" rel="noreferrer">Open official source</a></p>}<Link href={`/workspace/cases/${a.case_id}`} className="panel-link">Open linked case</Link></div>)}</div>}</section>
    </div>
  </div>
}
