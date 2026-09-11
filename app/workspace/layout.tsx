import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, LandPlot, Compass, Users, HeartHandshake, House, FileText, FolderOpen, ShieldCheck, LogOut, CalendarDays, MessageSquare } from 'lucide-react';
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
];

const responsiveWorkspaceCss = `
.workspace,.workspace-main,.workspace-content,.panel,.notice{min-width:0}
.create-case-heading{display:flex;justify-content:space-between;gap:20px;align-items:center;flex-wrap:wrap}
.create-case-heading h2{margin:8px 0 5px;font-size:21px}
.create-case-heading p{margin:0;color:#625d6b;font-size:12px;line-height:1.75}
.create-case-form{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:12px;margin-top:22px}
.create-case-form input,.create-case-form select,.create-case-form textarea{width:100%;min-width:0;padding:13px 12px;border:1px solid #e5dfec;border-radius:8px;background:#fff;color:#17131d}
.create-case-form textarea{grid-column:1/-1;min-height:100px;resize:vertical}
.create-case-form .button{justify-self:start}
.cases-section{margin-top:34px}
.cases-heading{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:16px}
.cases-heading h2{margin:8px 0 0;font-size:21px}
.cases-heading>span{font-size:11px;color:#827b8b}
.overview-links{margin-top:38px}
@media(max-width:760px){
  html,body{max-width:100%;overflow-x:hidden}
  .workspace{display:block!important;width:100%;max-width:100%;overflow-x:hidden}
  .workspace-main{width:100%;max-width:100%;overflow-x:hidden}
  .workspace-header{height:58px!important;padding:0 16px!important;justify-content:flex-end!important}
  .workspace-header span{font-size:10px!important;white-space:nowrap}
  .mobile-menu{display:flex!important;width:100%;max-width:100%;gap:8px!important;padding:10px 14px!important;overflow-x:auto!important;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .mobile-menu::-webkit-scrollbar{display:none}
  .mobile-menu a{flex:0 0 auto;padding:10px 12px!important;font-size:11px!important}
  .workspace-content{width:100%!important;max-width:100%!important;margin:0!important;padding:24px 16px 56px!important;overflow-x:hidden}
  .workspace-title{font-size:28px!important;line-height:1.12!important;letter-spacing:-.045em!important;overflow-wrap:anywhere}
  .workspace-lead{font-size:14px!important;line-height:1.7!important}
  .eyebrow{font-size:9px!important;line-height:1.5!important;letter-spacing:.14em!important;overflow-wrap:anywhere}
  .notice{width:100%;max-width:100%;padding:15px 16px!important;font-size:12px!important;line-height:1.65!important;overflow-wrap:anywhere}
  .notice svg{vertical-align:middle;margin-right:6px}
  .panel{width:100%!important;max-width:100%!important;padding:19px 17px!important;overflow:hidden}
  .panel h2,.panel h3,.panel p{overflow-wrap:anywhere}
  .workspace-grid{grid-template-columns:minmax(0,1fr)!important;width:100%!important;gap:12px!important}
  .workspace-content [style*="grid-template-columns"]{grid-template-columns:minmax(0,1fr)!important}
  .workspace-content [style*="display: grid"],.workspace-content [style*="display:grid"]{max-width:100%!important}
  .workspace-content form{width:100%!important;max-width:100%!important}
  .workspace-content input,.workspace-content select,.workspace-content textarea{width:100%!important;max-width:100%!important;min-width:0!important;font-size:16px!important}
  .workspace-content textarea{min-height:110px}
  .create-case-panel{margin-top:20px!important}
  .create-case-heading{display:block}
  .create-case-heading>svg{margin-top:16px}
  .create-case-heading h2{font-size:24px;line-height:1.2;margin-top:8px}
  .create-case-heading p{font-size:13px;line-height:1.7}
  .create-case-form{grid-template-columns:minmax(0,1fr)!important;gap:10px;margin-top:20px}
  .create-case-form textarea{grid-column:auto!important}
  .create-case-form .button{justify-self:stretch!important;width:100%;min-height:48px}
  .cases-section{margin-top:28px}
  .cases-heading{align-items:flex-start;gap:10px}
  .cases-heading h2{font-size:22px}
  .overview-links{margin-top:28px!important}
  .section-list a,.section-list>div{min-width:0;padding:16px!important;align-items:flex-start!important}
  .section-list strong,.section-list small{overflow-wrap:anywhere}
  .button{min-height:44px}
}
@media(max-width:390px){
  .workspace-content{padding-left:13px!important;padding-right:13px!important}
  .panel{padding:17px 14px!important}
  .workspace-title{font-size:26px!important}
}
`;

export default async function WorkspaceLayout({children}:{children:React.ReactNode}){
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) redirect('/login');
  const { data: profile } = await supabase.from('teaohou_profiles').select('display_name,role').eq('user_id',claims.sub).maybeSingle();
  const displayName = profile?.display_name || String(claims.email || 'Whānau member');
  return <div className="workspace">
    <style>{responsiveWorkspaceCss}</style>
    <aside className="sidebar">
      <Link href="/" className="brand"><img src="/te-ao-hou-symbol.svg" alt="Te Ao Hou" style={{width:46,height:46,objectFit:'contain'}}/><span><strong>TE AO HOU</strong><small>WHĀNAU WORKSPACE</small></span></Link>
      <nav><span className="sidebar-label">YOUR WORKSPACE</span>{links.map(l=><Link href={l.href} key={l.href}><l.icon size={18}/>{l.label}</Link>)}</nav>
      <div className="sidebar-bottom">
        <ShieldCheck size={19}/><p>Private whānau workspace · authenticated session</p>
        <small style={{display:'block',marginBottom:12,overflowWrap:'anywhere'}}>{displayName}</small>
        <form action={signOut}><button type="submit" style={{display:'inline-flex',alignItems:'center',gap:7,border:0,background:'transparent',padding:0,color:'#4a236f',fontWeight:700,fontSize:11}}><LogOut size={14}/> Sign out</button></form>
        <Link href="/" style={{display:'block',marginTop:12}}>← Back to website</Link>
      </div>
    </aside>
    <div className="workspace-main">
      <header className="workspace-header"><span>Secure whānau workspace</span></header>
      <nav className="mobile-menu">{links.map(l=><Link href={l.href} key={l.href}>{l.label}</Link>)}</nav>
      {children}
    </div>
  </div>;
}
