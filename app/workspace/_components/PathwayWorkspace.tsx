import Link from 'next/link';
import { ArrowRight, ExternalLink, ShieldCheck, FolderOpen, FileText, CircleHelp, CheckCircle2, type LucideIcon } from 'lucide-react';
import styles from './pathway-workspace.module.css';

type Goal={title:string;description:string;icon:LucideIcon};
type Stage={title:string;description:string;tags?:string[];checks?:string[]};
type Resource={label:string;href:string};

type Props={
  eyebrow:string;
  title:string;
  subtitle:string;
  description:string;
  summary:string;
  icon:LucideIcon;
  goals:Goal[];
  stages:Stage[];
  prepare:string[];
  decisions:string[];
  resources:Resource[];
  warning?:string;
  nextHref?:string;
  nextLabel?:string;
};

export default function PathwayWorkspace({eyebrow,title,subtitle,description,summary,icon:Icon,goals,stages,prepare,decisions,resources,warning,nextHref='/workspace/applications',nextLabel='Start an application'}:Props){
  return <main className={styles.page}>
    <div className={styles.crumb}><Link href="/workspace">Workspace</Link><span>›</span><span>{title}</span></div>

    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <aside className={styles.heroMeta}>
        <span>What this workspace does</span>
        <strong>{subtitle}</strong>
        <p>{summary}</p>
      </aside>
    </section>

    <div className={styles.quickBar}>
      <div className={styles.quickItem}><div className={styles.quickIcon}><Icon size={17}/></div><div><span>Pathway</span><strong>{stages.length} clear stages</strong></div></div>
      <div className={styles.quickItem}><div className={styles.quickIcon}><FolderOpen size={17}/></div><div><span>Prepare</span><strong>{prepare.length} key items</strong></div></div>
      <div className={styles.quickItem}><div className={styles.quickIcon}><ShieldCheck size={17}/></div><div><span>Guidance</span><strong>Official sources linked</strong></div></div>
    </div>

    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div><span className={styles.eyebrow} style={{color:'#7851a9'}}>START WITH YOUR SITUATION</span><h2>What are you trying to work out?</h2></div>
        <p>Choose the part that best matches where your whānau is at now. You can move between these as the picture becomes clearer.</p>
      </div>
      <div className={styles.goalStrip}>{goals.map(({title,description,icon:GoalIcon})=><article className={styles.goal} key={title}><div className={styles.goalIcon}><GoalIcon size={17}/></div><h3>{title}</h3><p>{description}</p></article>)}</div>
    </section>

    <section className={styles.section}>
      <div className={styles.bodyGrid}>
        <div className={styles.journey}>
          <div className={styles.journeyHead}><div><span className={styles.eyebrow} style={{color:'#7851a9'}}>YOUR PATHWAY</span><h2>Work through it in this order</h2></div><span className={styles.progress}>Stage 1 → {stages.length}</span></div>
          {stages.map((stage,index)=><div className={styles.step} key={stage.title}>
            <div className={styles.stepNo}>{index+1}</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTop}><div><h3>{stage.title}</h3><p>{stage.description}</p></div></div>
              {stage.tags?.length ? <div className={styles.tags}>{stage.tags.map(tag=><span className={styles.tag} key={tag}>{tag}</span>)}</div> : null}
              {stage.checks?.length ? <div className={styles.checks}>{stage.checks.map(check=><div className={styles.check} key={check}><span className={styles.checkDot}></span><span>{check}</span></div>)}</div> : null}
            </div>
          </div>)}
        </div>

        <aside className={styles.rail}>
          <div className={styles.railCard}><h3>Have these ready</h3><div className={styles.list}>{prepare.map((item,index)=><div className={styles.listItem} key={item}><span className={styles.listIcon}>{index+1}</span><span>{item}</span></div>)}</div></div>
          <div className={styles.railCard}><h3>Questions that change the pathway</h3>{decisions.map(item=><div className={styles.decision} key={item}><CircleHelp size={13} style={{verticalAlign:'middle',marginRight:7,color:'#7851a9'}}/>{item}</div>)}</div>
          <div className={styles.railCard}><h3>Official resources</h3>{resources.map(resource=>{
            const external=resource.href.startsWith('http');
            return <Link className={styles.resource} href={resource.href} key={resource.label} target={external?'_blank':undefined} rel={external?'noreferrer':undefined}><span>{resource.label}</span>{external?<ExternalLink size={13}/>:<ArrowRight size={13}/>}</Link>
          })}</div>
          {warning ? <div className={styles.warning}><ShieldCheck size={16}/><span>{warning}</span></div> : null}
        </aside>
      </div>
    </section>

    <section className={styles.cta}>
      <div><h3>Ready to move this forward?</h3><p>Use your case workspace to save the whenua, upload evidence and turn this guidance into a tracked application or next action.</p></div>
      <div className={styles.actions}><Link href="/workspace/documents" className={styles.secondary}><FileText size={14}/> Add documents</Link><Link href={nextHref} className={styles.primary}>{nextLabel} <ArrowRight size={14}/></Link></div>
    </section>
  </main>;
}
