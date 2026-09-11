import { redirect } from 'next/navigation';
import { FolderOpen, ShieldCheck, Files } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import DocumentsClient from './DocumentsClient';
import styles from '../tools.module.css';

export const dynamic='force-dynamic';

export default async function DocumentsPage(){
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(!userId) redirect('/login');
  const [{data:cases},{data:documents}]=await Promise.all([
    supabase.from('teaohou_cases').select('id,title').order('updated_at',{ascending:false}),
    supabase.from('teaohou_documents').select('id,original_name,category,review_status,created_at,case_id').order('created_at',{ascending:false}),
  ]);
  const docs=documents??[];
  const unreviewed=docs.filter(d=>d.review_status==='unreviewed').length;
  return <main className={styles.page}>
    <section className={styles.hero}><div className={styles.heroMain}><span className={styles.eyebrow}>DOCUMENTS & EVIDENCE</span><h1>One secure evidence register for every whenua matter</h1><p>Upload evidence once, link it to the correct case and keep a clear record of what is still waiting for review.</p><div className={styles.quickActions}><span style={{fontSize:10,fontWeight:800,background:'rgba(255,255,255,.12)',padding:'8px 11px',borderRadius:999}}>Private storage</span><span style={{fontSize:10,fontWeight:800,background:'rgba(255,255,255,.12)',padding:'8px 11px',borderRadius:999}}>20 MB maximum per file</span></div></div><aside className={styles.heroAside}><div className={styles.metric}><span>Documents</span><strong>{docs.length}</strong></div><div className={styles.metric}><span>Awaiting review</span><strong>{unreviewed}</strong></div><div className={styles.metric}><span>Cases</span><strong>{cases?.length||0}</strong></div></aside></section>
    <div className={styles.notice} style={{marginTop:18}}><ShieldCheck size={17}/>Files are stored in the private Te Ao Hou bucket and access is restricted by authenticated user folder and row-level policies.</div>
    {!cases?.length?<section className={styles.panel} style={{marginTop:22}}><div className={styles.empty}><FolderOpen size={24}/><strong style={{marginTop:10}}>Create a case first</strong>Documents must be attached to a case so evidence stays connected to a specific whenua matter.</div></section>:<DocumentsClient userId={userId} cases={cases} documents={docs}/>} 
  </main>;
}
