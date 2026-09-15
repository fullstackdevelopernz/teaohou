import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, BadgeDollarSign, Building2, FileCheck2, FileText, Hammer, HardHat, House, Landmark, MapPinned, Plus, Route, Scale, ShieldCheck, TriangleAlert, Users, WalletCards, Waves, Wrench } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { createDefaultPlan, createHousingProject } from '../actions';
import HousingReadiness from './HousingReadiness';
import styles from '../tools.module.css';

export const dynamic='force-dynamic';

const stages=[
  ['01','Authority first','Confirm ownership and the legal basis to occupy or develop the whenua.','Ownership · trustees · occupation / licence / lease'],
  ['02','Check the site','Test access, water, wastewater, power, hazards and physical constraints.','Access · services · hazards · topography'],
  ['03','Shape the project','Define who will live there, how many homes, scope, professionals and indicative budget.','Household · concept · scope · budget'],
  ['04','Confirm the consent pathway','Check district plan, resource consent, building consent and technical reports.','Planning · council · engineering'],
  ['05','Build the finance pack','Bring authority, plans, valuation, costs and borrower information together.','Security · valuation · budget · affordability'],
  ['06','Contract and build','Only proceed once authority, consents and funding gates are satisfied.','Contracts · insurance · construction · completion']
];
const pathways=[
  {icon:House,title:'One home on whānau whenua',text:'A household-led project where one whānau needs a lawful occupation pathway, site feasibility, consents and finance.'},
  {icon:Users,title:'Papakāinga / multiple homes',text:'A collective development requiring stronger governance, infrastructure planning, staging, professional advice and coordinated funding.'},
  {icon:Wrench,title:'Repair or improve an existing home',text:'For essential repairs, accessibility, healthy-home improvements or work needed to keep a whānau home safe and usable.'},
  {icon:Landmark,title:'Whenua development project',text:'For enabling works, shared infrastructure or a staged development that may support housing over time.'}
];
const siteChecks=[
  {icon:Route,title:'Legal and practical access',text:'Confirm how the site is reached, whether access is formed, and whether any easement or agreement is required.'},
  {icon:Waves,title:'Water and wastewater',text:'Identify potable water supply, stormwater and wastewater options before locking in a building location.'},
  {icon:TriangleAlert,title:'Hazards and constraints',text:'Check flooding, instability, contamination, coastal or geotechnical issues and any other site-specific constraints.'},
  {icon:Building2,title:'Planning controls',text:'Record zoning, overlays, setbacks, density rules and whether resource consent or specialist reports may be needed.'}
];
const financePack=['Evidence of ownership and authority to build or occupy','Site plan, concept drawings and project scope','Consent pathway and professional reports where required','Quantity-surveyor estimate, builder pricing or cost plan','Household income, contribution and affordability information','Valuation or security information where a lender requires it','Infrastructure, contingency and professional-fee allowances','Insurance and contract information before construction starts'];

export default async function HousingPage({searchParams}:{searchParams:Promise<{case?:string}>}){
  const params=await searchParams;
  const supabase=await createClient();
  const { data:claimsData }=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(!userId) redirect('/login');

  const { data:caseRows }=await supabase.from('teaohou_cases').select('id,title,summary,status,created_at').eq('case_type','housing').eq('owner_id',userId).order('created_at',{ascending:false});
  const cases=caseRows??[];
  const selectedCase=cases.find(item=>item.id===params.case)??cases[0]??null;

  let plan:any=null;
  let steps:any[]=[];
  let whenua:any[]=[];
  if(selectedCase){
    const [planResult,whenuaResult]=await Promise.all([
      supabase.from('teaohou_plans').select('id,goal_title,status,current_stage').eq('case_id',selectedCase.id).eq('owner_id',userId).order('created_at',{ascending:false}).limit(1).maybeSingle(),
      supabase.from('teaohou_whenua').select('id,block_name,location_text,ownership_structure,verified_at').eq('case_id',selectedCase.id).order('created_at',{ascending:false})
    ]);
    plan=planResult.data;
    whenua=whenuaResult.data??[];
    if(plan){
      const { data:stepRows }=await supabase.from('teaohou_plan_steps').select('id,sequence,title,status').eq('plan_id',plan.id).order('sequence',{ascending:true});
      steps=stepRows??[];
    }
  }

  const completed=steps.filter(step=>step.status==='complete').length;
  const readiness=steps.length?Math.round((completed/steps.length)*100):0;

  return <main className={styles.page}>
    <section className={styles.hero}><div className={styles.heroMain}><span className={styles.eyebrow}>HOUSING & DEVELOPMENT</span><h1>Turn a housing goal into a buildable whenua project</h1><p>Work through authority, site feasibility, planning, funding and build readiness in the right order. Te Ao Hou keeps the evidence, decisions and next actions attached to the same housing case.</p><div className={styles.quickActions}><Link href="/workspace/whenua">Confirm whenua</Link><Link href="/workspace/documents">Upload project evidence</Link><Link href="/workspace/applications">Open applications</Link></div></div><aside className={styles.heroAside}><div className={styles.metric}><span>Housing projects</span><strong>{cases.length}</strong></div><div className={styles.metric}><span>Current readiness</span><strong>{readiness}%</strong></div><div className={styles.metric}><span>Linked whenua</span><strong>{whenua.length}</strong></div><div className={styles.heroNote}><ShieldCheck size={15}/><span>Project progress is now stored against the authenticated Te Ao Hou case record.</span></div></aside></section>

    <div className={styles.toolbar}><div><h2>My housing projects</h2><p>Select the project you’re working on, or start a new housing case.</p></div></div>
    <section className={styles.projectWorkspace}>
      <div className={styles.projectTabs}>{cases.map(item=><Link key={item.id} href={`/workspace/housing?case=${item.id}`} className={`${styles.projectTab} ${selectedCase?.id===item.id?styles.projectTabActive:''}`}><strong>{item.title}</strong><small>{String(item.status).replaceAll('_',' ')}</small></Link>)}</div>
      <form action={createHousingProject} className={styles.projectCreate}><div><span className={styles.eyebrowDark}>NEW PROJECT</span><h3>Start a housing case</h3></div><input name="title" required maxLength={180} placeholder="e.g. Build our whānau home on Te Puke block"/><textarea name="summary" maxLength={1000} placeholder="What are you trying to achieve, who is the home for, and what do you already know?"/><button className={styles.primary} type="submit"><Plus size={14}/> Create housing project</button></form>
    </section>

    {selectedCase&&<section className={styles.activeProject}><div><span className={styles.eyebrowDark}>ACTIVE HOUSING CASE</span><h2>{selectedCase.title}</h2><p>{selectedCase.summary||'Add the project purpose and whānau outcome as the case develops.'}</p></div><Link href={`/workspace/cases/${selectedCase.id}`} className={styles.actionLink}>Open full case record <ArrowRight size={13}/></Link></section>}

    <div className={styles.toolbar}><div><h2>What kind of housing project is this?</h2><p>Start with the real whānau outcome. The evidence and professional work needed will vary by project.</p></div></div>
    <div className={styles.pathwayGrid}>{pathways.map(({icon:Icon,title,text})=><article className={styles.pathwayCard} key={title}><span><Icon size={19}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>

    <div className={styles.toolbar}><div><h2>Development readiness</h2><p>Four workstreams determine whether a project can move forward safely.</p></div></div>
    <div className={styles.pipeline}><div className={styles.pipeCard}><Scale size={19}/><b style={{fontSize:14,marginTop:9}}>Authority</b><span>Who owns or administers the whenua, and what permission is required?</span></div><div className={styles.pipeCard}><MapPinned size={19}/><b style={{fontSize:14,marginTop:9}}>Site</b><span>Can the site be accessed, serviced and used safely?</span></div><div className={styles.pipeCard}><Building2 size={19}/><b style={{fontSize:14,marginTop:9}}>Consents</b><span>What planning, building and technical approvals apply?</span></div><div className={styles.pipeCard}><WalletCards size={19}/><b style={{fontSize:14,marginTop:9}}>Funding</b><span>Is the project finance-ready with evidence and realistic costs?</span></div></div>

    <div className={styles.toolbar}><div><h2>My readiness tracker</h2><p>This is now part of the selected housing case rather than a browser-only checklist.</p></div></div>
    {selectedCase?(plan&&steps.length?<HousingReadiness caseId={selectedCase.id} steps={steps}/>:<section className={styles.readinessPanel}><div className={styles.empty}><strong>No project pathway yet</strong><p>Create the six-stage housing pathway for this case. The readiness gates will then be saved permanently against it.</p><form action={createDefaultPlan}><input type="hidden" name="case_id" value={selectedCase.id}/><input type="hidden" name="case_type" value="housing"/><button className={styles.primary} type="submit">Create housing pathway</button></form></div></section>):<section className={styles.readinessPanel}><div className={styles.empty}><strong>Create a housing project first</strong><p>Your housing readiness, whenua, documents and formal work need a case record to attach to.</p></div></section>}

    <div className={styles.toolbar}><div><h2>From whenua to construction</h2><p>A practical sequence that prevents expensive work being done too early.</p></div></div>
    <div className={styles.grid2}><section className={styles.panel}><div className={styles.recordList}>{stages.map(([n,t,d,m])=><article key={n} className={styles.record}><div style={{display:'flex',gap:12}}><span className={styles.status}>{n}</span><div><strong>{t}</strong><p>{d}</p><p style={{color:'#4a236f',fontWeight:700}}>{m}</p></div></div></article>)}</div></section><aside className={styles.panel}><div className={styles.panelTitle}><span><HardHat size={18}/></span><h3>Project pack</h3></div><p className={styles.panelIntro}>Keep the core project information together so the whānau, professionals, council and funders are working from the same evidence.</p><div className={styles.recordList}>{['Land block and ownership record','Occupation, licence or lease authority','Site address, aerial or map reference','Access and utility information','Household and build goal','Concept or site plan','Indicative budget and funding position','Council and professional advice'].map(x=><div className={styles.record} key={x}><strong>{x}</strong></div>)}</div><Link href="/workspace/documents" className={styles.actionLink}>Open project documents <ArrowRight size={13}/></Link></aside></div>

    <div className={styles.toolbar}><div><h2>Site feasibility before design</h2><p>These checks can change where, how or whether a house can be built on the preferred site.</p></div></div><div className={styles.siteGrid}>{siteChecks.map(({icon:Icon,title,text})=><article key={title} className={styles.siteCard}><span><Icon size={18}/></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>

    <div className={styles.toolbar}><div><h2>Build the finance pack progressively</h2><p>Don’t leave finance evidence until the end. Cost and funding assumptions should be tested as the project develops.</p></div></div><section className={styles.financePanel}><div className={styles.financeLead}><span><BadgeDollarSign size={20}/></span><div><h3>Finance-ready means evidence-ready</h3><p>A lender, funder or whānau decision-maker will usually need to understand the land position, build scope, costs, household position and how risk is being controlled.</p></div></div><div className={styles.financeChecklist}>{financePack.map(item=><div key={item}><FileCheck2 size={15}/><span>{item}</span></div>)}</div></section>

    <div className={styles.toolbar}><div><h2>Before anyone starts building</h2><p>Use a clear go / no-go gate. A build should not begin because one part of the project is ready.</p></div></div><section className={styles.goNoGo}><div className={styles.goNoGoMain}><span><Hammer size={20}/></span><div><h3>Construction gate</h3><p>Proceed only when the project has confirmed authority, an appropriate design, required approvals, a funded budget, suitable contracts and an agreed delivery plan.</p></div></div><div className={styles.goNoGoChecks}><span><ShieldCheck size={15}/>Authority recorded</span><span><FileText size={15}/>Approvals held</span><span><WalletCards size={15}/>Funding confirmed</span><span><HardHat size={15}/>Contracts ready</span></div></section>

    <div className={styles.notice} style={{marginTop:22}}><TriangleAlert size={16}/><span>Council, engineering, Māori Land Court and lender requirements depend on the particular whenua and project. Record verified requirements for the actual case rather than assuming one national pathway.</span></div>

    <div className={styles.toolbar}><div><h2>Move the project forward</h2><p>Keep the next action attached to the same whenua and the same project record.</p></div></div><div className={styles.nextActionGrid}><Link href="/workspace/whenua" className={styles.nextActionCard}><MapPinned size={18}/><span><strong>Check my whenua</strong><small>Ownership, block details and whenua record</small></span><ArrowRight size={15}/></Link><Link href="/workspace/applications" className={styles.nextActionCard}><FileText size={18}/><span><strong>Open applications</strong><small>Court and formal authority work</small></span><ArrowRight size={15}/></Link><Link href="/workspace/documents" className={styles.nextActionCard}><FileCheck2 size={18}/><span><strong>Project documents</strong><small>Store site, consent and finance evidence</small></span><ArrowRight size={15}/></Link></div>
  </main>
}
