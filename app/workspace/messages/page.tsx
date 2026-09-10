import Link from 'next/link';
import { createClient } from '../../../lib/supabase/server';
import { sendMessage } from '../operations/actions';

export default async function MessagesPage(){
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub!;
  const [{data:cases},{data:messages}]=await Promise.all([
    supabase.from('teaohou_cases').select('id,title,reference_code').or(`owner_id.eq.${userId},assigned_to.eq.${userId}`).order('created_at',{ascending:false}),
    supabase.from('teaohou_messages').select('id,case_id,sender_id,body,visibility,created_at').order('created_at',{ascending:false}).limit(100)
  ]);
  return <div className="workspace-content"><span className="eyebrow">MESSAGES</span><h1 className="workspace-title">Case messages</h1><p className="workspace-lead">Keep whānau and case communication connected to the correct matter instead of scattered across inboxes.</p><div className="workspace-grid">
    <section className="panel"><h3>Send a message</h3><form action={sendMessage} style={{display:'grid',gap:12,marginTop:16}}><select name="case_id" required defaultValue=""><option value="" disabled>Select case</option>{(cases||[]).map(c=><option key={c.id} value={c.id}>{c.reference_code} · {c.title}</option>)}</select><textarea name="body" required maxLength={10000} rows={6} placeholder="Write a case message…"/><button className="button button-primary" type="submit">Send message</button></form></section>
    <section className="panel"><h3>Recent messages</h3>{!messages?.length?<p>No messages yet.</p>:<div style={{display:'grid',gap:12,marginTop:14}}>{messages.map(m=><div key={m.id} style={{border:'1px solid #e5dfec',borderRadius:12,padding:14}}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><strong>{m.sender_id===userId?'You':'Case participant'}</strong><small>{new Date(m.created_at).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'})}</small></div><p style={{whiteSpace:'pre-wrap'}}>{m.body}</p><Link href={`/workspace/cases/${m.case_id}`} className="panel-link">Open case</Link></div>)}</div>}</section>
  </div></div>
}
