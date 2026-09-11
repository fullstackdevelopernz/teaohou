'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';
import styles from '../admin.module.css';

const staffRoles=['case_worker','admin','professional'];

export default function AdminLoginPage(){
  const router=useRouter();
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(false);

  async function submit(e:FormEvent){
    e.preventDefault();setLoading(true);setMessage('');
    const supabase=createClient();
    const {data,error}=await supabase.auth.signInWithPassword({email,password});
    if(error){setMessage(error.message);setLoading(false);return;}
    const userId=data.user?.id;
    const {data:profile}=await supabase.from('teaohou_profiles').select('role').eq('user_id',userId).maybeSingle();
    if(!staffRoles.includes(profile?.role||'')){
      await supabase.auth.signOut();
      setMessage('This login is restricted to authorised Te Ao Hou staff.');
      setLoading(false);return;
    }
    router.push('/admin');router.refresh();
  }

  return <main className={styles.loginShell}>
    <section className={styles.loginBrand}><div><img src="/te-ao-hou-symbol.svg" alt="Te Ao Hou"/><h1>Jackson’s Te Ao Hou administration workspace</h1><p>A separate operational environment for case intake, assignment, tasks, applications, evidence, appointments and whānau communications.</p></div><small>Staff access only · Te Ao Hou</small></section>
    <section className={styles.loginPanel}><Link href="/" style={{fontSize:10,fontWeight:800,color:'#4a236f'}}>← Back to Te Ao Hou</Link><span style={{fontSize:9,fontWeight:800,letterSpacing:'.14em',color:'#7851a9',marginTop:28}}>ADMIN ACCESS</span><h2>Staff sign in</h2><p>Use the authorised account assigned to Jackson or a Te Ao Hou admin team member.</p><form onSubmit={submit} className={styles.form}><label>Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input required minLength={8} type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{message&&<div className={styles.error}>{message}</div>}<button type="submit" className={styles.button} disabled={loading}><LockKeyhole size={14} style={{verticalAlign:'middle',marginRight:7}}/>{loading?'Checking access…':'Sign in to administration'}</button></form><p style={{marginTop:22,display:'flex',gap:8,alignItems:'flex-start'}}><ShieldCheck size={15}/>Access is role-restricted. A normal whānau account cannot enter the admin workspace.</p></section>
  </main>
}
