import Link from 'next/link';
import { MessageSquarePlus, MessagesSquare, ArrowRight } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { sendMessage } from '../operations/actions';
import styles from '../tools.module.css';

export default async function MessagesPage(){
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub!;
  const [{data:cases},{data:messages}]=await Promise.all([
    supabase.from('teaohou_cases').select('id,title,reference_code').or(`owner_id.eq.${userId},assigned_to.eq.${userId}`).order('created_at',{ascending:false}),
    supabase.from('teaohou_messages').select('id,case_id,sender_id,body,visibility,created_at').order('created_at',{ascending:false}).limit(100)
  ]);
  const items=messages||[];
  return <main className={styles.page}>
    <section className={styles.hero}><div className={styles.heroMain}><span className={styles.eyebrow}>CASE MESSAGES</span><h1>Keep important kōrero attached to the matter it belongs to</h1><p>Use case messages for clear, traceable communication about evidence, next steps, appointments and outstanding information.</p></div><aside className={styles.heroAside}><div className={styles.metric}><span>Recent messages</span><strong>{items.length}</strong></div><div className={styles.metric}><span>Cases available</span><strong>{cases?.length||0}</strong></div></aside></section>
    <div className={styles.toolbar}><div><h2>Messages</h2><p>Write with context. Every message stays linked to a case.</p></div></div>
    <div className={styles.grid2}>
      <section className={styles.panel}><div className={styles.panelTitle}><span><MessageSquarePlus size={18}/></span><h3>New case message</h3></div>{!cases?.length?<div className={styles.empty}><strong>No cases available</strong>Create or join a case before starting a message thread.</div>:<form action={sendMessage} className={styles.form}><label>Case<select name="case_id" required defaultValue=""><option value="" disabled>Select case</option>{cases.map(c=><option key={c.id} value={c.id}>{c.reference_code} · {c.title}</option>)}</select></label><label>Message<textarea name="body" required maxLength={10000} rows={8} placeholder="Write the update, question or information needed…"/></label><button className={styles.primary} type="submit"><MessagesSquare size={15}/>Send case message</button></form>}</section>
      <section className={styles.panel}><div className={styles.panelTitle}><span><MessagesSquare size={18}/></span><h3>Recent kōrero</h3></div>{!items.length?<div className={styles.empty}><strong>No messages yet</strong>Case communication will appear here.</div>:<div>{items.map(m=><article key={m.id} className={styles.thread}><div className={styles.avatar}>{m.sender_id===userId?'YOU':'TAH'}</div><div><div className={styles.threadMeta}><strong>{m.sender_id===userId?'You':'Te Ao Hou case participant'}</strong><small>{new Date(m.created_at).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'})}</small></div><p>{m.body}</p><Link href={`/workspace/cases/${m.case_id}`} className={styles.actionLink}>Open case <ArrowRight size={12}/></Link></div></article>)}</div>}</section>
    </div>
  </main>
}
