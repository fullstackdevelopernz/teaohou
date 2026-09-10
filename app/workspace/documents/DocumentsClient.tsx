'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, ShieldCheck } from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';

type CaseOption={id:string;title:string};
type DocumentRow={id:string;original_name:string;category:string|null;review_status:string;created_at:string;case_id:string|null};

export default function DocumentsClient({userId,cases,documents}:{userId:string;cases:CaseOption[];documents:DocumentRow[]}){
  const router=useRouter();
  const [message,setMessage]=useState('');
  const [uploading,setUploading]=useState(false);

  async function upload(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const form=e.currentTarget;
    const data=new FormData(form);
    const file=data.get('file') as File|null;
    const caseId=String(data.get('case_id')||'');
    const category=String(data.get('category')||'other');
    if(!file || !file.size || !caseId){setMessage('Choose a case and a file first.');return;}
    if(file.size>20*1024*1024){setMessage('The maximum file size is 20 MB.');return;}
    setUploading(true);setMessage('');
    const supabase=createClient();
    const clean=file.name.replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-120);
    const path=`${userId}/${caseId}/${crypto.randomUUID()}-${clean}`;
    const {error:storageError}=await supabase.storage.from('teaohou-documents').upload(path,file,{upsert:false,contentType:file.type||undefined});
    if(storageError){setMessage(storageError.message);setUploading(false);return;}
    const {error:dbError}=await supabase.from('teaohou_documents').insert({case_id:caseId,owner_id:userId,storage_path:path,original_name:file.name,mime_type:file.type||null,size_bytes:file.size,category,review_status:'unreviewed'});
    if(dbError){await supabase.storage.from('teaohou-documents').remove([path]);setMessage(`Upload record failed: ${dbError.message}`);setUploading(false);return;}
    form.reset();setMessage('Document uploaded securely.');setUploading(false);router.refresh();
  }

  return <>
    <section className="panel" style={{marginTop:28}}>
      <div style={{display:'flex',gap:14,alignItems:'center'}}><FileUp size={25}/><div><h2 style={{fontSize:20,margin:0}}>Upload evidence</h2><p style={{margin:'6px 0 0',fontSize:12,color:'#625d6b'}}>Files are private and stored under your authenticated user folder.</p></div></div>
      <form onSubmit={upload} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:22}}>
        <select required name="case_id" defaultValue="" style={{padding:12,border:'1px solid #e5dfec',borderRadius:8,background:'white'}}><option value="" disabled>Select a case</option>{cases.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select>
        <select name="category" defaultValue="other" style={{padding:12,border:'1px solid #e5dfec',borderRadius:8,background:'white'}}><option value="identity">Identity</option><option value="whakapapa">Whakapapa</option><option value="court_order">Court order / minute</option><option value="will">Will / estate</option><option value="trust">Trust / governance</option><option value="consent">Consent / hui record</option><option value="site">Site / development</option><option value="finance">Funding / finance</option><option value="other">Other evidence</option></select>
        <input required name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" style={{gridColumn:'1 / -1',padding:12,border:'1px dashed #bca6d3',borderRadius:8,background:'#faf9fc'}}/>
        <button className="button button-primary" type="submit" disabled={uploading}>{uploading?'Uploading…':'Upload document'}</button>
      </form>
      {message&&<div className="notice" style={{marginTop:16}}><ShieldCheck size={16}/>{message}</div>}
    </section>

    <section style={{marginTop:30}}><span className="eyebrow">YOUR EVIDENCE</span><h2 style={{fontSize:20,margin:'8px 0 14px'}}>Document register</h2>{documents.length===0?<div className="panel"><p style={{margin:0}}>No documents uploaded yet.</p></div>:<div className="section-list">{documents.map(d=><div key={d.id}><FileUp size={20}/><div><strong>{d.original_name}</strong><small>{(d.category||'other').replaceAll('_',' ')} · {d.review_status.replaceAll('_',' ')} · {new Date(d.created_at).toLocaleDateString('en-NZ')}</small></div></div>)}</div>}</section>
  </>;
}
