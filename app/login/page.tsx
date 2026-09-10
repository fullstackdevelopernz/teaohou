'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LockKeyhole, Mail, UserPlus } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

const productionOrigin = 'https://teaohou.vercel.app';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const supabase = createClient();

    if (mode === 'signup') {
      const redirectOrigin = window.location.hostname === 'localhost' ? window.location.origin : productionOrigin;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${redirectOrigin}/auth/callback`,
        },
      });
      if (error) setMessage(error.message);
      else if (data.session) { router.push('/workspace'); router.refresh(); }
      else setMessage('Account created. Check your email and use the confirmation link to finish signing in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else { router.push('/workspace'); router.refresh(); }
    }
    setLoading(false);
  }

  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:'40px 20px',background:'#faf9fc'}}>
    <section className="panel" style={{width:'100%',maxWidth:500,padding:36}}>
      <Link href="/" className="brand" style={{marginBottom:30,display:'inline-flex'}}><span className="brand-mark">T<span>Ā</span></span><span><strong>TE AO HOU</strong><small>WHĀNAU · WHENUA · FUTURE</small></span></Link>
      <span className="eyebrow">SECURE WHĀNAU WORKSPACE</span>
      <h1 className="workspace-title" style={{fontSize:34}}>{mode === 'signin' ? 'Sign in' : 'Create your account'}</h1>
      <p className="workspace-lead">Your private cases, whenua plans, documents and messages are protected by your account.</p>
      <form onSubmit={submit} style={{display:'grid',gap:16,marginTop:26}}>
        {mode === 'signup' && <label style={{display:'grid',gap:7,fontSize:12,fontWeight:700}}>Your name<input required value={name} onChange={e=>setName(e.target.value)} style={{padding:'14px 12px',border:'1px solid #e5dfec',borderRadius:8}} /></label>}
        <label style={{display:'grid',gap:7,fontSize:12,fontWeight:700}}>Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:'14px 12px',border:'1px solid #e5dfec',borderRadius:8}} /></label>
        <label style={{display:'grid',gap:7,fontSize:12,fontWeight:700}}>Password<input required minLength={8} type="password" autoComplete={mode==='signin'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} style={{padding:'14px 12px',border:'1px solid #e5dfec',borderRadius:8}} /></label>
        {message && <div className="notice" style={{margin:0}}>{message}</div>}
        <button className="button button-primary" disabled={loading} type="submit">{mode === 'signin' ? <><LockKeyhole size={16}/>{loading?'Signing in…':'Sign in'}</> : <><UserPlus size={16}/>{loading?'Creating…':'Create account'}</>}</button>
      </form>
      <button type="button" onClick={()=>{setMode(mode==='signin'?'signup':'signin');setMessage('')}} style={{border:0,background:'transparent',padding:'18px 0 0',color:'#4a236f',fontWeight:700,fontSize:12}}>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
      <p style={{fontSize:11,color:'#827b8b',lineHeight:1.7,marginTop:24}}><Mail size={13} style={{verticalAlign:'middle',marginRight:6}}/>Use an email address you control. Do not share your password with Te Ao Hou staff.</p>
    </section>
  </main>;
}
