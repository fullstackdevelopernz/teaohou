import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowRight, CalendarDays, FileText, FolderOpen, LandPlot, ListChecks, MessageSquareText, ShieldCheck } from 'lucide-react';
import { createClient } from '../../../../lib/supabase/server';
import { addWhenua, createDefaultPlan } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function CasePage({params}:{params:Promise<{id:string}>}){
  const { id } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect('/login');

  const { data: caseRow } = await supabase.from('teaohou_cases').select('*').eq('id',id).maybeSingle();
  if (!caseRow) notFound();

  const [whenuaResult, plansResult, appsResult, docsResult, appointmentsResult, messagesResult] = await Promise.all([
    supabase.from('teaohou_whenua').select('id,block_name,legal_description,location_text,court_reference,ownership_structure,trust_name,verified_at').eq('case_id',id).order('created_at',{ascending:false}),
    supabase.from('teaohou_plans').select('id,goal_title,status,current_stage').eq('case_id',id).order('created_at',{ascending:false}),
    supabase.from('teaohou_applications').select('id,application_type,status,court_reference').eq('case_id',id).order('created_at',{ascending:false}),
    supabase.from('teaohou_documents').select('id,original_name,category,review_status,created_at').eq('case_id',id).order('created_at',{ascending:false}),
    supabase.from('teaohou_appointments').select('id,title,starts_at,status').eq('case_id',id).order('starts_at',{ascending:true}),
    supabase.from('teaohou_messages').select('id,body,created_at').eq('case_id',id).order('created_at',{ascending:false}).limit(5),
  ]);

  const whenua = whenuaResult.data ?? [];
  const plans = plansResult.data ?? [];
  const apps = appsResult.data ?? [];
  const docs = docsResult.data ?? [];
  const appointments = appointmentsResult.data ?? [];
  const messages = messagesResult.data ?? [];

  const pathwayHref = caseRow.case_type === 'succession' ? '/workspace/succession' : caseRow.case_type === 'trust' ? '/workspace/trusts' : caseRow.case_type === 'housing' ? '/workspace/housing' : caseRow.case_type === 'whenua' ? '/workspace/whenua' : '/workspace/applications';

  return <div className="workspace-content">
    <span className="eyebrow">CASE / {String(caseRow.case_type).toUpperCase()}</span>
    <h1 className="workspace-title">{caseRow.title}</h1>
    <p className="workspace-lead">{caseRow.summary || 'Build the whenua record, pathway and evidence for this matter.'}</p>
    <div className="notice"><ShieldCheck size={17}/> This case is loaded through authenticated row-level access. Only authorised participants and Te Ao Hou staff with the appropriate role can access it.</div>

    <div className="workspace-grid" style={{marginTop:28}}>
      <div className="panel"><ListChecks size={24}/><h3 style={{marginTop:16}}>Status</h3><p style={{textTransform:'capitalize'}}>{String(caseRow.status).replaceAll('_',' ')} · {caseRow.priority} priority</p><Link className="panel-link" href={pathwayHref}>Open guidance <ArrowRight size={15}/></Link></div>
      <div className="panel"><LandPlot size={24}/><h3 style={{marginTop:16}}>Whenua records</h3><p>{whenua.length} record{whenua.length===1?'':'s'} linked to this case.</p></div>
      <div className="panel"><FolderOpen size={24}/><h3 style={{marginTop:16}}>Documents</h3><p>{docs.length} document record{docs.length===1?'':'s'} attached.</p><Link className="panel-link" href="/workspace/documents">Document workspace <ArrowRight size={15}/></Link></div>
      <div className="panel"><FileText size={24}/><h3 style={{marginTop:16}}>Applications</h3><p>{apps.length} tracked application{apps.length===1?'':'s'}.</p><Link className="panel-link" href="/workspace/applications">Application pathways <ArrowRight size={15}/></Link></div>
      <div className="panel"><CalendarDays size={24}/><h3 style={{marginTop:16}}>Appointments</h3><p>{appointments.length} appointment{appointments.length===1?'':'s'} recorded.</p></div>
      <div className="panel"><MessageSquareText size={24}/><h3 style={{marginTop:16}}>Messages</h3><p>{messages.length ? 'Recent case messages are available.' : 'No case messages yet.'}</p></div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:18,marginTop:28}}>
      <section className="panel">
        <span className="eyebrow">WHENUA RECORD</span><h2 style={{fontSize:20,margin:'9px 0'}}>Add known whenua information</h2>
        <p>Use what you know now. Official source references and verification can be added as the case develops.</p>
        <form action={addWhenua} style={{display:'grid',gap:10}}>
          <input type="hidden" name="case_id" value={id}/>
          <input name="block_name" maxLength={180} placeholder="Block name" style={{padding:12,border:'1px solid #e5dfec',borderRadius:8}}/>
          <input name="location_text" maxLength={250} placeholder="Location / rohe" style={{padding:12,border:'1px solid #e5dfec',borderRadius:8}}/>
          <input name="court_reference" maxLength={180} placeholder="Māori Land Court reference, if known" style={{padding:12,border:'1px solid #e5dfec',borderRadius:8}}/>
          <select name="ownership_structure" defaultValue="unknown" style={{padding:12,border:'1px solid #e5dfec',borderRadius:8,background:'white'}}><option value="unknown">Ownership structure unknown</option><option value="individual">Individual interests</option><option value="whanau_trust">Whānau trust</option><option value="ahu_whenua">Ahu whenua trust</option><option value="whenua_topu">Whenua tōpū trust</option><option value="other">Other</option></select>
          <textarea name="notes" maxLength={2000} placeholder="What does your whānau know about this whenua?" style={{padding:12,border:'1px solid #e5dfec',borderRadius:8,minHeight:90}}/>
          <button className="button button-primary" type="submit">Save whenua record</button>
        </form>
      </section>

      <section className="panel">
        <span className="eyebrow">MY WHENUA PLAN</span><h2 style={{fontSize:20,margin:'9px 0'}}>Create the case pathway</h2>
        {plans.length ? <div><p>A plan is already linked to this case.</p>{plans.map(p=><div key={p.id} style={{borderTop:'1px solid #e5dfec',padding:'12px 0'}}><strong>{p.goal_title}</strong><small style={{display:'block',marginTop:5,color:'#625d6b'}}>Stage {p.current_stage} · {p.status}</small></div>)}</div> : <><p>Generate a staged plan from the case type. It can then be refined as ownership, authority and evidence become clearer.</p><form action={createDefaultPlan}><input type="hidden" name="case_id" value={id}/><input type="hidden" name="case_type" value={caseRow.case_type}/><button className="button button-primary" type="submit">Create pathway</button></form></>}
      </section>
    </div>

    {whenua.length > 0 && <section className="panel" style={{marginTop:28}}><span className="eyebrow">RECORDED WHENUA</span><div className="section-list" style={{marginTop:15}}>{whenua.map(w=><div key={w.id}><LandPlot size={21}/><div><strong>{w.block_name || 'Unnamed whenua record'}</strong><small>{[w.location_text,w.ownership_structure?.replaceAll('_',' '),w.court_reference].filter(Boolean).join(' · ') || 'Details still being gathered'}</small></div></div>)}</div></section>}
  </div>;
}
