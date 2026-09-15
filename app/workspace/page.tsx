import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Compass, LandPlot, Users, House, FolderOpen, ShieldCheck, Plus, BriefcaseBusiness } from 'lucide-react';
import { createClient } from '../../lib/supabase/server';
import CaseCreateForm from './CaseCreateForm';

export const dynamic = 'force-dynamic';

const caseErrors:Record<string,string>={
  missing_details:'Add a case name and choose or name the matter type.',
  invalid_type:'That matter type could not be saved. Use letters and words only, then try again.',
  create_failed:'The case could not be created. Nothing was lost — please try again.',
};

export default async function Workspace({searchParams}:{searchParams:Promise<{case_error?:string}>}){
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect('/login');
  const params=await searchParams;

  const [{ data: profile }, { data: cases, error }] = await Promise.all([
    supabase.from('teaohou_profiles').select('display_name').eq('user_id', userId).maybeSingle(),
    supabase.from('teaohou_cases').select('id,title,case_type,status,priority,updated_at').order('updated_at',{ascending:false}).limit(24),
  ]);

  const firstName = profile?.display_name?.split(' ')[0] || 'Kia ora';
  const caseError=params.case_error?caseErrors[params.case_error]:null;
  return <div className="workspace-content workspace-overview">
    <span className="eyebrow">TE AO HOU / YOUR WORKSPACE</span>
    <h1 className="workspace-title">{firstName === 'Kia ora' ? 'Kia ora, welcome to your whenua journey.' : `Kia ora ${firstName}.`}</h1>
    <p className="workspace-lead">Create a case for any whenua or whānau matter you need to progress, then keep the pathway, evidence, decisions and next actions together.</p>
    <div className="notice"><ShieldCheck size={17}/> Your Te Ao Hou records use authenticated access and row-level security. Formal Court filing, legal decisions, council approvals and lending decisions remain with the relevant authorised bodies.</div>

    <div className="panel create-case-panel" style={{marginTop:28}}>
      <div className="create-case-heading">
        <div><span className="eyebrow">START A MATTER</span><h2>Create a new case</h2><p>Choose the closest matter type, or name your own. Te Ao Hou will create the case record and an initial working pathway automatically.</p></div>
        <Plus size={27}/>
      </div>
      {caseError&&<div className="notice" style={{marginTop:16}}>{caseError}</div>}
      <CaseCreateForm/>
    </div>

    <section className="cases-section">
      <div className="cases-heading"><div><span className="eyebrow">YOUR MATTERS</span><h2>Cases</h2></div><span>{cases?.length ?? 0} record{cases?.length===1?'':'s'}</span></div>
      {error ? <div className="notice">We couldn’t load your cases. Please refresh and try again.</div> : !cases?.length ? <div className="panel"><BriefcaseBusiness size={25}/><h3 style={{marginTop:18}}>No cases yet</h3><p>Create your first matter above. Te Ao Hou will keep its pathway, evidence and next steps together from the start.</p></div> : <div className="workspace-grid">{cases.map(c=><Link className="panel" key={c.id} href={`/workspace/cases/${c.id}`}><BriefcaseBusiness size={24}/><h3 style={{marginTop:16}}>{c.title}</h3><p style={{textTransform:'capitalize'}}>{c.case_type.replaceAll('_',' ')} · {c.status.replaceAll('_',' ')} · {c.priority} priority</p><span className="panel-link">Open case <ArrowRight size={15}/></span></Link>)}</div>}
    </section>

    <div className="workspace-grid overview-links"><div className="panel"><Compass size={27}/><h3 style={{marginTop:20}}>My Whenua Plan</h3><p>See your staged pathway and what has to happen next.</p><Link href="/workspace/plan" className="panel-link">Explore your plan <ArrowRight size={16}/></Link></div><div className="panel"><LandPlot size={27}/><h3 style={{marginTop:20}}>Understand your whenua</h3><p>Work through land records, ownership, trusts and existing orders.</p><Link href="/workspace/whenua" className="panel-link">Explore whenua <ArrowRight size={16}/></Link></div><div className="panel"><Users size={27}/><h3 style={{marginTop:20}}>Succession pathway</h3><p>Organise whakapapa, interests, evidence and the formal succession pathway.</p><Link href="/workspace/succession" className="panel-link">View pathway <ArrowRight size={16}/></Link></div><div className="panel"><House size={27}/><h3 style={{marginTop:20}}>Housing & development</h3><p>Sequence authority, site feasibility, council requirements and funding readiness.</p><Link href="/workspace/housing" className="panel-link">Explore housing <ArrowRight size={16}/></Link></div><div className="panel"><FolderOpen size={27}/><h3 style={{marginTop:20}}>Resources</h3><p>Use current official application guides and starting points.</p><Link href="/resources" className="panel-link">Open resource library <ArrowRight size={16}/></Link></div></div>
  </div>;
}
