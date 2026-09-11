import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, BriefcaseBusiness, ListChecks, LogOut, ShieldCheck } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { signOut } from '../../workspace/actions';
import styles from '../admin.module.css';

export const dynamic='force-dynamic';
const staffRoles=['case_worker','admin','professional'];
const links=[
  {href:'/admin',label:'Dashboard',icon:LayoutDashboard},
  {href:'/admin#cases',label:'Cases',icon:BriefcaseBusiness},
  {href:'/admin#tasks',label:'Tasks',icon:ListChecks},
];

export default async function AdminLayout({children}:{children:React.ReactNode}){
  const supabase=await createClient();
  const {data:claimsData}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(!userId) redirect('/admin/login');
  const {data:profile}=await supabase.from('teaohou_profiles').select('role,display_name').eq('user_id',userId).maybeSingle();
  if(!staffRoles.includes(profile?.role||'')) redirect('/admin/login');
  return <div className={styles.shell}>
    <aside className={styles.sidebar}><Link href="/admin" className={styles.brand}><img src="/te-ao-hou-symbol.svg" alt="Te Ao Hou"/><span><strong>TE AO HOU</strong><small>ADMINISTRATION</small></span></Link><nav className={styles.nav}><span className={styles.navLabel}>JACKSON + ADMIN TEAM</span>{links.map(l=><Link key={l.href} href={l.href}><l.icon size={16}/>{l.label}</Link>)}</nav><div className={styles.sideBottom}><ShieldCheck size={16}/><p>Staff-only operational workspace</p><strong style={{display:'block',color:'#fff',fontSize:11}}>{profile?.display_name||'Te Ao Hou staff'}</strong><small style={{textTransform:'capitalize'}}>{String(profile?.role||'').replaceAll('_',' ')}</small><form action={signOut} style={{marginTop:14}}><button type="submit"><LogOut size={13} style={{verticalAlign:'middle',marginRight:6}}/>Sign out</button></form><Link href="/" style={{display:'block',marginTop:12,color:'#cdbbdd'}}>Public website →</Link></div></aside>
    <div className={styles.main}><header className={styles.topbar}><div><strong>Te Ao Hou Administration</strong><span style={{display:'block'}}>Jackson Tutahi · Operations</span></div><span>Secure staff session</span></header><nav className={styles.mobileNav}>{links.map(l=><Link key={l.href} href={l.href}>{l.label}</Link>)}</nav>{children}</div>
  </div>
}
