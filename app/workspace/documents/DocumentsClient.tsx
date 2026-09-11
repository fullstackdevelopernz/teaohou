'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, ShieldCheck, FileText, UploadCloud } from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';
import styles from '../tools.module.css';

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
    <div className={styles.toolbar}><div><h2>Evidence workspace</h2><p>Add new evidence and see what is already on file.</p></div></div>
    <div className={styles.grid2}>
      <section className={styles.panel}><div className={styles.panelTitle}><span><UploadCloud size={18}/></span><h3>Upload evidence</h3></div><form onSubmit={upload} className={styles.form}><label>Case<select required name="case_id" defaultValue=""><option value="" disabled>Select a case</option>{cases.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label>Evidence type<select name="category" defaultValue="other"><option value="identity">Identity</option><option value="whakapapa">Whakapapa</option><option value="court_order">Court order / minute</option><option value="will">Will / estate</option><option value="trust">Trust / governance</option><option value="consent">Consent / hui record</option><option value="site">Site / development</option><option value="finance">Funding / finance</option><option value="other">Other evidence</option></select></label><div className={styles.dropzone}><FileUp size={24} style={{color:'#7851a9',marginBottom:6}}/><strong style={{display:'block',fontSize:12}}>Choose a file to attach</strong><small style={{display:'block',fontSize:10,color:'#817888',margin:'5px 0 8px'}}>PDF, image, DOC or DOCX · maximum 20 MB</small><input required name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"/></div><button className={styles.primary} type="submit" disabled={uploading}>{uploading?'Uploading…':'Upload securely'}</button></form>{message&&<div className={styles.notice} style={{marginTop:14}}><ShieldCheck size={16}/>{message}</div>}</section>
      <section className={styles.panel}><div className={styles.panelTitle}><span><FileText size={18}/></span><h3>Document register</h3></div>{documents.length===0?<div className={styles.empty}><strong>No documents uploaded yet</strong>Your evidence register will build here as files are added.</div>:<><div className={styles.listHeader}><span>Document</span><span>Category</span><span>Status</span></div><div className={styles.recordList}>{documents.map(d=><div key={d.id} className={styles.docRow}><div className={styles.docName}><FileText size={17} style={{color:'#7851a9',flex:'0 0 auto'}}/><div style={{minWidth:0}}><strong>{d.original_name}</strong><div className={styles.docMeta}>{new Date(d.created_at).toLocaleDateString('en-NZ')}</div></div></div><span className={styles.docMeta}>{(d.category||'other').replaceAll('_',' ')}</span><span className={styles.status}>{d.review_status.replaceAll('_',' ')}</span></div>)}</div></>}</section>
    </div>
  </>;
}
