import { redirect } from 'next/navigation';
import { FolderOpen, ShieldCheck } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import DocumentsClient from './DocumentsClient';

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
  return <div className="workspace-content">
    <span className="eyebrow">YOUR WORKSPACE / EVIDENCE</span>
    <h1 className="workspace-title">My documents</h1>
    <p className="workspace-lead">Keep the evidence for each whenua matter together and linked to the case it supports.</p>
    <div className="notice"><ShieldCheck size={17}/> Files are stored in the private Te Ao Hou bucket. Access is restricted by authenticated user folder and row-level policies.</div>
    {!cases?.length?<div className="panel" style={{marginTop:28}}><FolderOpen size={24}/><h3 style={{marginTop:16}}>Create a case first</h3><p>Documents must be attached to a case so evidence stays connected to a specific whenua matter.</p></div>:<DocumentsClient userId={userId} cases={cases} documents={documents??[]}/>} 
  </div>;
}
