'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight, Check, ChevronRight, Compass, FileText, HeartHandshake,
  House, LandPlot, Route, Scale, ShieldCheck, Sparkles, Users
} from 'lucide-react';
import styles from './plan.module.css';

type GoalKey='housing'|'succession'|'whenua'|'trust';

type Goal={
  key:GoalKey;
  title:string;
  short:string;
  description:string;
  icon:typeof House;
  href:string;
  outcome:string;
  needs:string[];
  stages:{title:string;description:string;label:string}[];
};

const goals:Goal[]=[
  {
    key:'housing',title:'Build a home on whānau land',short:'Build on whenua',
    description:'Work through ownership, authority, site feasibility, consents, funding and build readiness.',
    icon:House,href:'/workspace/housing',outcome:'A clear, evidence-backed pathway from whenua to a build-ready project.',
    needs:['Land block or location','Current ownership / trust details','Who will live there','Known access and services','Indicative budget'],
    stages:[
      {label:'01',title:'Confirm the whenua',description:'Identify the block, current ownership and any existing trust or orders.'},
      {label:'02',title:'Confirm authority',description:'Work out who can approve occupation or development and what order or agreement is required.'},
      {label:'03',title:'Test the site',description:'Check physical access, water, wastewater, power, hazards and practical constraints.'},
      {label:'04',title:'Map consents',description:'Identify the relevant council planning, resource and building consent requirements.'},
      {label:'05',title:'Prepare funding',description:'Bring together authority, plans, costs, valuation and borrower information.'},
      {label:'06',title:'Move to delivery',description:'Only progress construction once legal, consent and funding gates are satisfied.'}
    ]
  },
  {
    key:'succession',title:'Succeed to Māori land interests',short:'Succession',
    description:'Understand the deceased owner, whakapapa, successors, evidence and Court pathway.',
    icon:Users,href:'/workspace/succession',outcome:'A complete succession preparation pathway with the right people and evidence identified.',
    needs:['Deceased owner’s full name','Death certificate','Will, if one exists','Whakapapa','Known land interests'],
    stages:[
      {label:'01',title:'Confirm the owner',description:'Identify the deceased owner and the Māori land interests affected.'},
      {label:'02',title:'Map whakapapa',description:'Record all people who may be entitled to succeed and any relevant whāngai or partner circumstances.'},
      {label:'03',title:'Gather evidence',description:'Collect death, will, whakapapa, trust and other supporting documents.'},
      {label:'04',title:'Decide how interests are held',description:'Consider direct succession or whether a trust pathway should also be explored.'},
      {label:'05',title:'Prepare the application',description:'Match the circumstances to current Māori Land Court guidance and submission requirements.'},
      {label:'06',title:'Track the outcome',description:'Record Court correspondence, hearings, orders and any post-order work.'}
    ]
  },
  {
    key:'whenua',title:'Understand what whenua we own',short:'Understand whenua',
    description:'Find the block, ownership structure, people connected to it and the orders that affect it.',
    icon:LandPlot,href:'/workspace/whenua',outcome:'A verified picture of the whenua and the most likely next pathway.',
    needs:['Approximate location','Block or farm name','Names of owners or tūpuna','Any Court reference','Marae / hapū connection'],
    stages:[
      {label:'01',title:'Start with whānau knowledge',description:'Record names, places, old documents and every spelling variation you know.'},
      {label:'02',title:'Search official records',description:'Confirm the legal block, owner and trustee information.'},
      {label:'03',title:'Read the structure',description:'Identify individual ownership, trusts and any deceased owners still recorded.'},
      {label:'04',title:'Check existing orders',description:'Look for occupation, access, partition, trust or other orders affecting the whenua.'},
      {label:'05',title:'Resolve gaps',description:'Compare the official record with whānau understanding and identify what is missing.'},
      {label:'06',title:'Choose the next pathway',description:'Move into succession, governance, access, housing or another relevant process.'}
    ]
  },
  {
    key:'trust',title:'Set up or change a trust',short:'Trust & governance',
    description:'Clarify trust purpose, owner participation, trustee roles, governance and Court requirements.',
    icon:HeartHandshake,href:'/workspace/trusts',outcome:'A clear trust or governance pathway with owners, trustees and evidence properly organised.',
    needs:['Current trust order or ownership schedule','Owner contacts','Trustee details','Trust objectives','Hui records'],
    stages:[
      {label:'01',title:'Confirm the current position',description:'Obtain the current ownership schedule, trust order and trustee list.'},
      {label:'02',title:'Define the purpose',description:'Clarify why the trust is needed or what governance change is being proposed.'},
      {label:'03',title:'Engage owners',description:'Prepare notices, hui material, attendance, voting and resolutions.'},
      {label:'04',title:'Confirm trustees',description:'Record suitability, consent, conflicts and practical governance roles.'},
      {label:'05',title:'Prepare the Court matter',description:'Use current official guidance and attach the evidence for the specific trust matter.'},
      {label:'06',title:'Operate the trust',description:'Maintain meetings, registers, accounts, actions and governance records after the order.'}
    ]
  }
];

export default function MyWhenuaPlanPage(){
  const [selected,setSelected]=useState<GoalKey>('housing');
  const goal=useMemo(()=>goals.find(g=>g.key===selected)!,[selected]);

  return <main className={styles.page}>
    <section className={styles.topbar}>
      <div>
        <span className={styles.eyebrow}><Compass size={14}/> MY WHENUA PLAN</span>
        <h1>Start with the outcome.<br/><em>We’ll map the path back.</em></h1>
        <p>Choose what you want to achieve. Te Ao Hou will show the stages, information and decisions that usually sit between where you are now and that outcome.</p>
      </div>
      <div className={styles.trustPill}><ShieldCheck size={16}/><span>Private whānau workspace</span></div>
    </section>

    <section className={styles.goalSection}>
      <div className={styles.sectionLabel}><span>01</span><div><strong>Choose your goal</strong><small>You can change this at any time.</small></div></div>
      <div className={styles.goalGrid}>
        {goals.map(item=>{
          const Icon=item.icon;
          const active=item.key===selected;
          return <button key={item.key} onClick={()=>setSelected(item.key)} className={`${styles.goalCard} ${active?styles.activeGoal:''}`} aria-pressed={active}>
            <span className={styles.goalIcon}><Icon size={23}/></span>
            <span className={styles.goalCopy}><strong>{item.title}</strong><small>{item.description}</small></span>
            <span className={styles.selectMark}>{active?<Check size={16}/>:<ChevronRight size={17}/>}</span>
          </button>;
        })}
      </div>
    </section>

    <section className={styles.planShell}>
      <div className={styles.planMain}>
        <div className={styles.planHeading}>
          <div>
            <span className={styles.eyebrow}><Sparkles size={14}/> YOUR PATHWAY</span>
            <h2>{goal.short}</h2>
            <p>{goal.outcome}</p>
          </div>
          <Link href={goal.href} className={styles.primaryAction}>Open full pathway <ArrowRight size={16}/></Link>
        </div>

        <div className={styles.timeline}>
          {goal.stages.map((stage,index)=><article key={stage.title} className={styles.stage}>
            <div className={styles.stageRail}>
              <span>{stage.label}</span>
              {index<goal.stages.length-1&&<i/>}
            </div>
            <div className={styles.stageBody}>
              <div className={styles.stageTop}><h3>{stage.title}</h3><span>{index===0?'START HERE':index===goal.stages.length-1?'OUTCOME':'NEXT'}</span></div>
              <p>{stage.description}</p>
            </div>
          </article>)}
        </div>
      </div>

      <aside className={styles.planAside}>
        <div className={styles.asideCard}>
          <span className={styles.eyebrow}><FileText size={14}/> WHAT TO HAVE READY</span>
          <h3>Start with what you know.</h3>
          <p>You do not need everything before you begin. These details will make the pathway clearer.</p>
          <ul>{goal.needs.map(item=><li key={item}><span></span>{item}</li>)}</ul>
        </div>

        <div className={styles.decisionCard}>
          <Route size={21}/>
          <div><strong>Your plan can branch.</strong><p>If ownership, succession, authority or a dispute changes the route, move into the relevant pathway rather than forcing one sequence.</p></div>
        </div>

        <div className={styles.quickLinks}>
          <span className={styles.eyebrow}>QUICK LINKS</span>
          <Link href="/workspace/whenua"><LandPlot size={16}/> My whenua <ChevronRight size={15}/></Link>
          <Link href="/workspace/applications"><Scale size={16}/> Applications <ChevronRight size={15}/></Link>
          <Link href="/workspace/documents"><FileText size={16}/> My documents <ChevronRight size={15}/></Link>
        </div>
      </aside>
    </section>

    <section className={styles.footerCta}>
      <div><span>READY TO MOVE?</span><h2>Take the first practical step.</h2><p>Open the detailed pathway for your selected goal, or start by checking the whenua record.</p></div>
      <div className={styles.footerActions}><Link href={goal.href}>Continue with {goal.short} <ArrowRight size={16}/></Link><Link href="/workspace/whenua" className={styles.secondary}>Check my whenua first</Link></div>
    </section>
  </main>;
}
