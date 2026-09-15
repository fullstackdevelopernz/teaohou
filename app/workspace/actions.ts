'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

async function authenticatedUser() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (error || !userId) redirect('/login');
  return { supabase, userId };
}

function normaliseCaseType(value:string){
  return value
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g,'_')
    .replace(/^_+|_+$/g,'')
    .slice(0,64);
}

export async function createCase(formData: FormData) {
  const { supabase, userId } = await authenticatedUser();
  const title = String(formData.get('title') ?? '').trim().slice(0,120);
  const selectedType = String(formData.get('case_type') ?? '').trim();
  const customType = String(formData.get('custom_case_type') ?? '').trim();
  const caseType = normaliseCaseType(selectedType === 'custom' ? customType : selectedType);
  const summary = String(formData.get('summary') ?? '').trim().slice(0,3000);
  const priority = String(formData.get('priority') ?? 'normal');
  const targetDate = String(formData.get('target_date') ?? '').trim();
  const allowedPriorities = new Set(['low','normal','high','urgent']);

  if (!title || !caseType) redirect('/workspace?case_error=missing_details');
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(caseType)) redirect('/workspace?case_error=invalid_type');

  const { data, error } = await supabase
    .from('teaohou_cases')
    .insert({
      owner_id:userId,
      title,
      case_type:caseType,
      summary:summary||null,
      status:'intake',
      priority:allowedPriorities.has(priority)?priority:'normal',
      target_date:/^\d{4}-\d{2}-\d{2}$/.test(targetDate)?targetDate:null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Te Ao Hou case creation failed', { code:error.code, message:error.message });
    redirect('/workspace?case_error=create_failed');
  }

  try {
    await createPlanForCase(supabase,userId,data.id,caseType);
  } catch (planError) {
    console.error('Te Ao Hou case pathway creation failed', planError);
  }

  revalidatePath('/workspace');
  revalidatePath(`/workspace/cases/${data.id}`);
  if(caseType==='housing') revalidatePath('/workspace/housing');
  redirect(`/workspace/cases/${data.id}?created=1`);
}

export async function addWhenua(formData: FormData) {
  const { supabase, userId } = await authenticatedUser();
  const caseId = String(formData.get('case_id') ?? '');
  if (!caseId) return;
  const { error } = await supabase.from('teaohou_whenua').insert({
    case_id:caseId,created_by:userId,
    block_name:String(formData.get('block_name')??'').trim()||null,
    location_text:String(formData.get('location_text')??'').trim()||null,
    court_reference:String(formData.get('court_reference')??'').trim()||null,
    ownership_structure:String(formData.get('ownership_structure')??'').trim()||null,
    notes:String(formData.get('notes')??'').trim()||null,
  });
  if (error) throw new Error(`Unable to save whenua record: ${error.message}`);
  revalidatePath(`/workspace/cases/${caseId}`);
  revalidatePath('/workspace/housing');
}

const planTemplates:Record<string,{title:string;steps:string[]}> = {
  succession:{title:'Succession pathway',steps:['Confirm the deceased owner and relevant whenua interests','Build the whakapapa and identify all potential successors','Collect supporting evidence and existing orders','Decide how the interests are proposed to be held','Prepare the current official application','Track Court requests, hearing and final orders']},
  trust:{title:'Trust and governance pathway',steps:['Confirm ownership and any existing trust orders','Define the trust purpose and proposed structure','Engage owners and proposed trustees','Prepare consents, minutes and governance documents','Follow the appropriate Court process','Maintain governance records after the order']},
  housing:{title:'Build on whānau whenua',steps:['Confirm ownership and legal authority to occupy or develop','Check legal and physical access, services and site constraints','Define the development concept and household need','Confirm council planning and consent requirements','Prepare valuation, budget and funding-ready evidence','Complete approvals, contracts and construction milestones']},
  whenua:{title:'Understand our whenua',steps:['Record what the whānau already knows','Confirm the block using official land records','Review owners, trustees and deceased interests','Identify existing orders and restrictions','Choose the next succession, trust, access or development pathway']},
  access:{title:'Access pathway',steps:['Confirm the whenua and current access position','Review titles, orders, easements and existing agreements','Identify affected owners, trustees and adjoining interests','Get survey, legal or technical input where required','Record the preferred access solution and authority','Progress the required agreement, application or registration']},
  occupation_order:{title:'Occupation order pathway',steps:['Confirm the applicant and whenua interests','Identify the proposed occupation area and intended use','Check owner, trustee and governance requirements','Collect site plans, consents and supporting evidence','Prepare the appropriate Māori Land Court application','Track hearing requirements and final order']},
  licence_to_occupy:{title:'Licence to occupy pathway',steps:['Confirm the landowner or trust authority','Define the occupier, area, purpose and term','Agree conditions, services, costs and responsibilities','Prepare the licence and supporting resolutions','Complete approvals and execution','Maintain the licence and review dates']},
  partition:{title:'Partition pathway',steps:['Confirm the block and ownership interests','Define the proposed partition outcome','Identify all affected owners and access implications','Obtain survey, valuation and technical evidence where required','Prepare owner engagement and application evidence','Track Court process, survey plan and final orders']},
  amalgamation:{title:'Amalgamation pathway',steps:['Identify the blocks proposed to be brought together','Confirm ownership and governance across each block','Define the purpose and practical benefit','Assess title, access, valuation and survey implications','Prepare affected-owner evidence and application','Track approval and resulting title or order changes']},
  easement:{title:'Easement pathway',steps:['Define the access or service right required','Confirm the affected land and ownership','Check any existing easements or orders','Agree route, terms, maintenance and responsibilities','Prepare survey/legal documentation and approvals','Complete registration or Court process']},
  status_order:{title:'Status order pathway',steps:['Confirm the land and current legal status','Define the status outcome being sought','Collect title, historical and ownership evidence','Identify affected owners and statutory requirements','Prepare the appropriate application and submissions','Track hearing and final status order']},
  governance:{title:'Governance matter pathway',steps:['Define the governance issue and decision required','Confirm current trust, entity or owner authority','Collect governing documents, orders and prior resolutions','Identify who must be consulted or vote','Record a compliant decision and evidence trail','Implement and monitor the decision']},
  finance:{title:'Finance readiness pathway',steps:['Define the funding purpose and amount required','Confirm authority over the whenua or project','Build the project budget and affordability position','Collect valuation, security and supporting evidence','Compare appropriate funding pathways and conditions','Complete approvals and maintain the finance record']},
  rates:{title:'Rates matter pathway',steps:['Confirm the land and rating account','Identify the rates issue, balance or relief sought','Collect ownership, occupation and supporting evidence','Check council policy and available statutory pathways','Submit the required request or application','Track decision, payment arrangement or review']},
  dispute:{title:'Dispute resolution pathway',steps:['Define the issue, parties and outcome sought','Preserve the relevant evidence and decision history','Confirm authority, rights and any governing process','Identify negotiation, mediation, Court or other pathways','Record communications and agreed actions','Track resolution, orders or follow-up obligations']},
  sale_transfer:{title:'Sale or transfer pathway',steps:['Confirm the interests proposed to be transferred','Identify owners, beneficiaries and required authority','Check restrictions, valuation and statutory requirements','Collect consents and supporting evidence','Complete professional and formal transfer steps','Record settlement and resulting ownership changes']},
  survey_boundary:{title:'Survey or boundary pathway',steps:['Confirm the land records and issue requiring survey work','Collect plans, titles, orders and existing survey information','Identify affected owners and adjoining interests','Engage an appropriate survey professional','Review proposed plan and authority requirements','Complete the required filing, approval or record update']},
  infrastructure_services:{title:'Infrastructure and services pathway',steps:['Define the service or infrastructure outcome','Confirm land authority, route and affected interests','Assess access, engineering and site constraints','Identify council, utility and consent requirements','Build budget, agreements and funding evidence','Complete approvals, works and ongoing responsibilities']},
  application:{title:'Application preparation pathway',steps:['Define the order or outcome being sought','Confirm the correct current application process','Identify all affected owners and trustees','Collect evidence, consents and supporting records','Complete quality review before submission','Track submission, requests, hearing and outcome']},
  other:{title:'Whenua matter pathway',steps:['Define the desired outcome','Confirm the whenua and people involved','Identify the legal and practical pathway','Collect evidence and required support','Record decisions, responsibilities and next actions','Progress authorised decisions and approvals']},
};

async function createPlanForCase(supabase:any,userId:string,caseId:string,caseType:string){
  const template=planTemplates[caseType]??{
    title:`${caseType.replaceAll('_',' ').replace(/\b\w/g,(c:string)=>c.toUpperCase())} pathway`,
    steps:planTemplates.other.steps,
  };
  const { data:existing }=await supabase.from('teaohou_plans').select('id').eq('case_id',caseId).limit(1).maybeSingle();
  if(existing) return existing.id;
  const { data:plan,error:planError }=await supabase.from('teaohou_plans').insert({case_id:caseId,owner_id:userId,goal_key:caseType,goal_title:template.title,status:'active',current_stage:1}).select('id').single();
  if(planError) throw new Error(`Unable to create pathway: ${planError.message}`);
  const rows=template.steps.map((title,index)=>({plan_id:plan.id,sequence:index+1,title,status:index===0?'in_progress':'not_started',responsible_party:'whānau'}));
  const { error:stepsError }=await supabase.from('teaohou_plan_steps').insert(rows);
  if(stepsError) throw new Error(`Pathway created but steps could not be saved: ${stepsError.message}`);
  return plan.id;
}

export async function createDefaultPlan(formData: FormData) {
  const { supabase, userId } = await authenticatedUser();
  const caseId = String(formData.get('case_id') ?? '');
  const caseType = normaliseCaseType(String(formData.get('case_type') ?? 'other')) || 'other';
  if (!caseId) return;
  await createPlanForCase(supabase,userId,caseId,caseType);
  revalidatePath(`/workspace/cases/${caseId}`);
  revalidatePath('/workspace/housing');
}

export async function createHousingProject(formData:FormData){
  const { supabase,userId }=await authenticatedUser();
  const title=String(formData.get('title')??'').trim();
  const summary=String(formData.get('summary')??'').trim();
  if(!title) return;
  const { data:caseRow,error }=await supabase.from('teaohou_cases').insert({owner_id:userId,title,case_type:'housing',summary:summary||null,status:'intake'}).select('id').single();
  if(error) throw new Error(`Unable to create housing project: ${error.message}`);
  await createPlanForCase(supabase,userId,caseRow.id,'housing');
  revalidatePath('/workspace');
  revalidatePath('/workspace/housing');
  redirect(`/workspace/housing?case=${caseRow.id}`);
}

export async function setHousingStepStatus(formData:FormData){
  const { supabase,userId }=await authenticatedUser();
  const stepId=String(formData.get('step_id')??'');
  const caseId=String(formData.get('case_id')??'');
  const nextStatus=String(formData.get('status')??'');
  if(!stepId||!caseId||!['not_started','in_progress','complete'].includes(nextStatus)) return;

  const { data:step }=await supabase.from('teaohou_plan_steps').select('id,plan_id,sequence').eq('id',stepId).maybeSingle();
  if(!step) return;
  const { data:plan }=await supabase.from('teaohou_plans').select('id,case_id,owner_id').eq('id',step.plan_id).eq('case_id',caseId).eq('owner_id',userId).maybeSingle();
  if(!plan) return;

  const { error }=await supabase.from('teaohou_plan_steps').update({status:nextStatus}).eq('id',stepId);
  if(error) throw new Error(`Unable to update housing readiness: ${error.message}`);

  const { data:steps }=await supabase.from('teaohou_plan_steps').select('sequence,status').eq('plan_id',plan.id).order('sequence',{ascending:true});
  const firstOpen=(steps??[]).find((item:any)=>item.status!=='complete');
  const allComplete=Boolean(steps?.length)&&!firstOpen;
  await supabase.from('teaohou_plans').update({current_stage:allComplete?(steps?.length??1):(firstOpen?.sequence??1),status:allComplete?'complete':'active'}).eq('id',plan.id).eq('owner_id',userId);

  revalidatePath('/workspace/housing');
  revalidatePath(`/workspace/cases/${caseId}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
