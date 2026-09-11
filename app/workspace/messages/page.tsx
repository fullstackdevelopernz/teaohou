import Link from 'next/link';
import { ArrowRight, CalendarDays, FileText, MessageSquarePlus, MessagesSquare, BriefcaseBusiness, Clock3 } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { sendMessage } from '../operations/actions';
import styles from '../tools.module.css';

type SearchParams = Promise<{ case?: string }>;

function statusLabel(value:string){return value.replaceAll('_',' ')}
function nzDate(value?:string|null){
  if(!value) return 'No activity yet';
  return new Date(value).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short'});
}

export default async function MessagesPage({searchParams}:{searchParams:SearchParams}){
  const params=await searchParams;
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub!;

  const [{data:cases},{data:messages}]=await Promise.all([
    supabase.from('teaohou_cases').select('id,title,reference_code,status,priority,updated_at').or(`owner_id.eq.${userId},assigned_to.eq.${userId}`).order('updated_at',{ascending:false}),
    supabase.from('teaohou_messages').select('id,case_id,sender_id,body,visibility,created_at').order('created_at',{ascending:true}).limit(300)
  ]);

  const caseList=cases||[];
  const items=messages||[];
  const caseIds=new Set(caseList.map(c=>c.id));
  const visibleMessages=items.filter(m=>caseIds.has(m.case_id));
  const senderIds=[...new Set(visibleMessages.map(m=>m.sender_id).filter(Boolean))];
  const {data:profiles}=senderIds.length
    ? await supabase.from('teaohou_profiles').select('user_id,display_name,role').in('user_id',senderIds)
    : {data:[] as any[]};
  const profileMap=new Map((profiles||[]).map(p=>[p.user_id,p]));

  const grouped=new Map<string,typeof visibleMessages>();
  for(const c of caseList) grouped.set(c.id,[]);
  for(const m of visibleMessages){
    const list=grouped.get(m.case_id)||[];
    list.push(m);
    grouped.set(m.case_id,list);
  }

  const requestedCase=caseList.find(c=>c.id===params.case);
  const activeCase=requestedCase||caseList[0]||null;
  const activeMessages=activeCase ? grouped.get(activeCase.id)||[] : [];
  const latest=visibleMessages.at(-1)?.created_at||null;
  const casesWithMessages=caseList.filter(c=>(grouped.get(c.id)?.length||0)>0).length;

  return <main className={styles.page}>
    <section className={styles.messageHero}>
      <div>
        <span className={styles.eyebrow}>CASE COMMUNICATIONS</span>
        <h1>Keep every important kōrero connected to the right matter</h1>
        <p>Track questions, updates, evidence requests, appointments and decisions in one chronological record for each whenua case.</p>
      </div>
      <div className={styles.messageMetrics}>
        <div><strong>{visibleMessages.length}</strong><span>Total messages</span></div>
        <div><strong>{casesWithMessages}/{caseList.length}</strong><span>Cases with kōrero</span></div>
        <div><strong><Clock3 size={16}/></strong><span>{latest?`Latest ${nzDate(latest)}`:'No messages yet'}</span></div>
      </div>
    </section>

    {!caseList.length ? <section className={styles.panel} style={{marginTop:22}}><div className={styles.empty}><BriefcaseBusiness size={24}/><strong>No cases available</strong>Create a whenua case first. Messages are always attached to a matter so the history stays traceable.<Link href="/workspace" className={styles.actionLink}>Create a case <ArrowRight size={12}/></Link></div></section> : <>
      <div className={styles.messageToolbar}>
        <div><h2>Communication tracker</h2><p>Select a matter to see its complete kōrero history.</p></div>
        {activeCase&&<Link href={`/workspace/cases/${activeCase.id}`} className={styles.secondaryButton}>Open full case <ArrowRight size={13}/></Link>}
      </div>

      <div className={styles.messageWorkspace}>
        <aside className={styles.caseRail}>
          <div className={styles.caseRailHeader}><span>YOUR MATTERS</span><strong>{caseList.length}</strong></div>
          <div className={styles.caseRailList}>{caseList.map(c=>{
            const caseMessages=grouped.get(c.id)||[];
            const last=caseMessages.at(-1);
            const active=activeCase?.id===c.id;
            return <Link key={c.id} href={`/workspace/messages?case=${c.id}`} className={`${styles.caseConversation} ${active?styles.caseConversationActive:''}`}>
              <div className={styles.caseConversationTop}><span className={styles.status}>{statusLabel(c.status)}</span><b>{caseMessages.length}</b></div>
              <strong>{c.title}</strong>
              <small>{c.reference_code||'No reference code'}</small>
              <p>{last ? last.body : 'No kōrero on this matter yet.'}</p>
              <time>{last ? nzDate(last.created_at) : `Case updated ${nzDate(c.updated_at)}`}</time>
            </Link>
          })}</div>
        </aside>

        <section className={styles.conversationPanel}>
          {activeCase&&<>
            <header className={styles.conversationHeader}>
              <div><span className={styles.eyebrow}>{activeCase.reference_code||'ACTIVE MATTER'}</span><h2>{activeCase.title}</h2><p>{statusLabel(activeCase.status)} · {activeMessages.length} message{activeMessages.length===1?'':'s'}</p></div>
              <div className={styles.conversationLinks}><Link href={`/workspace/cases/${activeCase.id}`}><BriefcaseBusiness size={14}/>Case</Link><Link href="/workspace/documents"><FileText size={14}/>Documents</Link><Link href="/workspace/appointments"><CalendarDays size={14}/>Appointments</Link></div>
            </header>

            <div className={styles.timeline}>
              {!activeMessages.length ? <div className={styles.empty}><MessagesSquare size={24}/><strong>No messages on this case yet</strong>Start the record below. Every update will remain attached to this matter.</div> : activeMessages.map(m=>{
                const sender=profileMap.get(m.sender_id);
                const mine=m.sender_id===userId;
                const name=mine?'You':sender?.display_name||'Te Ao Hou team';
                const role=mine?'Whānau':sender?.role?statusLabel(sender.role):'Case participant';
                return <article key={m.id} className={`${styles.timelineMessage} ${mine?styles.timelineMine:''}`}>
                  <div className={styles.avatar}>{mine?'YOU':name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()}</div>
                  <div className={styles.timelineBody}><div className={styles.threadMeta}><div><strong>{name}</strong><small>{role}</small></div><time>{nzDate(m.created_at)}</time></div><p>{m.body}</p></div>
                </article>
              })}
            </div>

            <form action={sendMessage} className={styles.composer}>
              <input type="hidden" name="case_id" value={activeCase.id}/>
              <div className={styles.composerTitle}><MessageSquarePlus size={18}/><div><strong>Add to this matter</strong><span>Your message becomes part of the case communication record.</span></div></div>
              <textarea name="body" required maxLength={10000} rows={5} placeholder="Write an update, question, evidence note or next step…"/>
              <div className={styles.composerFooter}><span>{activeCase.reference_code||activeCase.title}</span><button className={styles.primary} type="submit"><MessagesSquare size={15}/>Send message</button></div>
            </form>
          </>}
        </section>
      </div>
    </>}
  </main>
}
