import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ExternalLink, FileSearch, GitBranch, House, LandPlot, Plus, Scale, ShieldCheck, Users } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { createWhenuaRecord, updateWhenuaRecord } from './actions';
import styles from './whenua.module.css';

export const dynamic='force-dynamic';

const structures:Record<string,string>={unknown:'Unknown',individual:'Individual interests',whanau_trust:'Whānau trust',ahu_whenua:'Ahu whenua trust',whenua_topu:'Whenua tōpū trust',other:'Other'};

function completeness(w:any){
  const fields=[w.block_name,w.location_text,w.legal_description,w.court_reference,w.ownership_structure&&w.ownership_structure!=='unknown',w.source_url];
  const done=fields.filter(Boolean).length;
  return Math.round((done/fields.length)*100);
}
function missingFields(w:any){
  const missing:string[]=[];
  if(!w.block_name)missing.push('block name');
  if(!w.location_text)missing.push('location');
  if(!w.legal_description)missing.push('legal description');
  if(!w.court_reference)missing.push('Court reference');
  if(!w.ownership_structure||w.ownership_structure==='unknown')missing.push('ownership structure');
  if(!w.source_url)missing.push('official source');
  return missing;
}

export default async function WhenuaPage(){
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(!userId) redirect('/login');

  const [{data:cases},{data:whenua}]=await Promise.all([
    supabase.from('teaohou_cases').select('id,title,reference_code,case_type,status,updated_at').or(`owner_id.eq.${userId},assigned_to.eq.${userId}`).order('updated_at',{ascending:false}),
    supabase.from('teaohou_whenua').select('id,case_id,block_name,legal_description,location_text,court_reference,ownership_structure,trust_name,notes,source_url,verified_at,created_at,updated_at').order('updated_at',{ascending:false})
  ]);

  const caseRows=cases||[];
  const records=whenua||[];
  const caseMap=new Map(caseRows.map(c=>[c.id,c]));
  const complete=records.filter(r=>completeness(r)>=80).length;
  const verified=records.filter(r=>r.verified_at).length;

  return <main className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.heroMain}><span className={styles.eyebrow}>MY WHENUA</span><h1>Build a complete picture of your whenua</h1><p>Keep the block, ownership structure, Court references, source evidence and whānau knowledge together. Te Ao Hou uses this record to help route the matter into succession, governance, housing or another application pathway.</p></div>
      <aside className={styles.heroAside}><div className={styles.metric}><span>Whenua records</span><strong>{records.length}</strong></div><div className={styles.metric}><span>80%+ complete</span><strong>{complete}</strong></div><div className={styles.metric}><span>Verified records</span><strong>{verified}</strong></div></aside>
    </section>

    <div className={styles.toolbar}><div><h2>Your whenua portfolio</h2><p>Add what you know now, then strengthen each record with official references and supporting evidence.</p></div><div className={styles.quick}><Link href="/workspace/documents">Evidence library</Link><Link href="/workspace/plan">My Whenua Plan</Link><a href="https://www.xn--morilandcourt-wqb.govt.nz/en/maori-land" target="_blank" rel="noreferrer">Official Māori Land Court info</a></div></div>

    <div className={styles.layout}>
      <section className={styles.panel}><div className={styles.panelTitle}><span><Plus size={18}/></span><h3>Add a whenua record</h3></div>{!caseRows.length?<div className={styles.empty}><strong>Create a matter first</strong>A whenua record must stay attached to a case so its documents, messages, applications and next steps remain together.<br/><Link className={styles.link} href="/workspace">Create a case <ArrowRight size={12}/></Link></div>:<form action={createWhenuaRecord} className={styles.form}><label>Case<select name="case_id" required defaultValue=""><option value="" disabled>Select matter</option>{caseRows.map(c=><option key={c.id} value={c.id}>{c.reference_code?`${c.reference_code} · `:''}{c.title}</option>)}</select></label><div className={styles.formGrid}><label>Block name<input name="block_name" maxLength={180} placeholder="Known Māori land block name"/></label><label>Location / rohe<input name="location_text" maxLength={250} placeholder="Town, rohe, road or place name"/></label></div><label>Legal description<input name="legal_description" maxLength={500} placeholder="Legal description from official record, if known"/></label><div className={styles.formGrid}><label>Court reference<input name="court_reference" maxLength={180} placeholder="Court / title reference"/></label><label>Ownership structure<select name="ownership_structure" defaultValue="unknown"><option value="unknown">Unknown</option><option value="individual">Individual interests</option><option value="whanau_trust">Whānau trust</option><option value="ahu_whenua">Ahu whenua trust</option><option value="whenua_topu">Whenua tōpū trust</option><option value="other">Other</option></select></label></div><label>Trust name<input name="trust_name" maxLength={220} placeholder="Trust name, if applicable"/></label><label>Official source URL<input name="source_url" type="url" maxLength={1000} placeholder="Link to the official source used to confirm this record"/></label><label>Whānau notes<textarea name="notes" rows={5} maxLength={3000} placeholder="What does your whānau know? Add spelling variants, tūpuna names, access details, old orders or anything still to confirm."/></label><button className={styles.primary} type="submit"><LandPlot size={15}/>Save whenua record</button></form>}</section>

      <section className={styles.panel}><div className={styles.panelTitle}><span><LandPlot size={18}/></span><h3>Recorded whenua</h3></div>{!records.length?<div className={styles.empty}><strong>No whenua records yet</strong>Add the first block or known whenua details using the form. You can start with incomplete information and improve it over time.</div>:<div className={styles.records}>{records.map(w=>{const pct=completeness(w);const missing=missingFields(w);const c=caseMap.get(w.case_id);return <article key={w.id} className={styles.record}><div className={styles.recordTop}><div><h3>{w.block_name||'Unnamed whenua record'}</h3><p>{c?.reference_code?`${c.reference_code} · `:''}{c?.title||'Linked matter'} · Updated {new Date(w.updated_at).toLocaleDateString('en-NZ',{dateStyle:'medium'})}</p></div><span className={styles.badge}>{w.verified_at?'Verified':'Working record'}</span></div><div className={styles.facts}><div className={styles.fact}><span>Location</span><b>{w.location_text||'Not recorded'}</b></div><div className={styles.fact}><span>Ownership</span><b>{structures[w.ownership_structure]||'Unknown'}</b></div><div className={styles.fact}><span>Court reference</span><b>{w.court_reference||'Not recorded'}</b></div><div className={styles.fact}><span>Trust</span><b>{w.trust_name||'None recorded'}</b></div></div><div className={styles.readiness}><div className={styles.readinessHead}><span>Record completeness</span><span>{pct}%</span></div><div className={styles.bar}><i style={{width:`${pct}%`}}/></div>{missing.length>0&&<p className={styles.missing}>Still to confirm: {missing.join(', ')}.</p>}</div><div className={styles.recordActions}>{c&&<Link className={styles.link} href={`/workspace/cases/${c.id}`}>Open case <ArrowRight size={12}/></Link>}{w.source_url&&<a className={styles.source} href={w.source_url} target="_blank" rel="noreferrer">Open source <ExternalLink size={11}/></a>}</div><details className={styles.details}><summary>Edit or strengthen this record</summary><form action={updateWhenuaRecord} className={styles.form}><input type="hidden" name="whenua_id" value={w.id}/><input type="hidden" name="case_id" value={w.case_id}/><div className={styles.formGrid}><label>Block name<input name="block_name" defaultValue={w.block_name||''}/></label><label>Location / rohe<input name="location_text" defaultValue={w.location_text||''}/></label></div><label>Legal description<input name="legal_description" defaultValue={w.legal_description||''}/></label><div className={styles.formGrid}><label>Court reference<input name="court_reference" defaultValue={w.court_reference||''}/></label><label>Ownership structure<select name="ownership_structure" defaultValue={w.ownership_structure||'unknown'}><option value="unknown">Unknown</option><option value="individual">Individual interests</option><option value="whanau_trust">Whānau trust</option><option value="ahu_whenua">Ahu whenua trust</option><option value="whenua_topu">Whenua tōpū trust</option><option value="other">Other</option></select></label></div><label>Trust name<input name="trust_name" defaultValue={w.trust_name||''}/></label><label>Official source URL<input name="source_url" type="url" defaultValue={w.source_url||''}/></label><label>Whānau notes<textarea name="notes" rows={5} defaultValue={w.notes||''}/></label><button className={styles.primary} type="submit">Update record</button></form></details></article>})}</div>}</section>
    </div>

    <section className={styles.notice}><ShieldCheck size={15} style={{verticalAlign:'middle',marginRight:7}}/>A Te Ao Hou whenua record is a working whānau record. “Verified” means a staff member has checked the source information; it does not replace a Māori Land Court record, order, title search or legal advice.</section>

    <section><div className={styles.toolbar}><div><h2>Where does this whenua need to go next?</h2><p>Use the record to route the matter into the next practical workflow.</p></div></div><div className={styles.routeGrid}><div className={styles.route}><Users size={20}/><h4>Deceased owners or unsucceeded interests</h4><p>Build whakapapa, identify successors and organise the evidence needed for succession.</p><Link href="/workspace/succession">Succession pathway <ArrowRight size={11}/></Link></div><div className={styles.route}><GitBranch size={20}/><h4>Trust or governance questions</h4><p>Work through trustees, existing trust orders, owner engagement and governance records.</p><Link href="/workspace/trusts">Trusts & governance <ArrowRight size={11}/></Link></div><div className={styles.route}><House size={20}/><h4>Build or develop</h4><p>Move from authority and access into site feasibility, council requirements and funding readiness.</p><Link href="/workspace/housing">Housing & development <ArrowRight size={11}/></Link></div><div className={styles.route}><Scale size={20}/><h4>Need a formal order or application</h4><p>Identify the outcome sought, gather supporting records and track the correct formal process.</p><Link href="/workspace/applications">Applications <ArrowRight size={11}/></Link></div></div></section>

    <section className={styles.notice}><FileSearch size={15} style={{verticalAlign:'middle',marginRight:7}}/>Recommended workflow: record what the whānau knows → confirm the block and title reference → add the official source → understand ownership/trust structure → attach evidence → choose the next pathway. This keeps the whenua record useful across the rest of Te Ao Hou.</section>
  </main>;
}
