import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, LandPlot, Compass, Users, HeartHandshake, House, FileText, FolderOpen, BriefcaseBusiness, ShieldCheck, LogOut, CalendarDays, MessageSquare } from 'lucide-react';
import { createClient } from '../../lib/supabase/server';
import { signOut } from './actions';

export const dynamic = 'force-dynamic';

const links=[
  {href:'/workspace',label:'Overview',icon:LayoutDashboard},
  {href:'/workspace/plan',label:'My Whenua Plan',icon:Compass},
  {href:'/workspace/whenua',label:'My whenua',icon:LandPlot},
  {href:'/workspace/succession',label:'Succession',icon:Users},
  {href:'/workspace/trusts',label:'Trusts & governance',icon:HeartHandshake},
  {href:'/workspace/housing',label:'Housing & development',icon:House},
  {href:'/workspace/applications',label:'Applications',icon:FileText},
  {href:'/workspace/documents',label:'My documents',icon:FolderOpen},
  {href:'/workspace/appointments',label:'Appointments',icon:CalendarDays},
  {href:'/workspace/messages',label:'Messages',icon:MessageSquare},
  {href:'/workspace/operations',label:'Operations',icon:BriefcaseBusiness},
];

export default async function WorkspaceLayout({children}:{children:React.ReactNode}){
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) redirect('/login');

  const { data: profile } = await supabase.from('teaohou_profiles').select('display_name,role').eq('user_id',claims.sub).maybeSingle();
  const displayName = profile?.display_name || String(claims.email || 'Whānau member');
  const roleLabel = String(profile?.role || 'whanau').replaceAll('_',' ');

  return <div className="workspace">
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-mark">T<span>Ā</span></span><span><strong>TE AO HOU</strong><small>WHĀNAU WORKSPACE</small></span></Link>
      <nav><span className="sidebar-label">YOUR WORKSPACE</span>{links.map(l=><Link href={l.href} key={l.href}><l.icon size={18}/>{l.label}</Link>)}</nav>
      <div className="sidebar-bottom">
        <ShieldCheck size={19}/><p>Secure workspace · Authenticated session</p>
        <small style={{display:'block',marginBottom:4,overflowWrap:'anywhere'}}>{displayName}</small>
        <small style={{display:'block',marginBottom:12,textTransform:'capitalize'}}>{roleLabel}</small>
        <form action={signOut}><button type="submit" style={{display:'inline-flex',alignItems:'center',gap:7,border:0,background:'transparent',padding:0,color:'#4a236f',fontWeight:700,fontSize:11}}><LogOut size={14}/> Sign out</button></form>
        <Link href="/" style={{display:'block',marginTop:12}}>← Back to website</Link>
      </div>
    </aside>
    <div className="workspace-main">
      <header className="workspace-header"><Link href="/" className="brand"><strong>TE AO HOU</strong></Link><span>Secure whānau workspace</span></header>
      <nav className="mobile-menu">{links.map(l=><Link href={l.href} key={l.href}>{l.label}</Link>)}</nav>
      {children}
    </div>
  </div>;
}
