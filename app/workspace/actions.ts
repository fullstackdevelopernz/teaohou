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

export async function createCase(formData: FormData) {
  const { supabase, userId } = await authenticatedUser();
  const title = String(formData.get('title') ?? '').trim();
  const caseType = String(formData.get('case_type') ?? '').trim();
  const summary = String(formData.get('summary') ?? '').trim();
  const allowed = new Set(['whenua','succession','trust','housing','application','other']);
  if (!title || !allowed.has(caseType)) return;

  const { data, error } = await supabase.from('teaohou_cases').insert({ owner_id:userId,title,case_type:caseType,summary:summary||null,status:'intake' }).select('id').single();
  if (error) throw new Error(`Unable to create case: ${error.message}`);
  revalidatePath('/workspace');
  redirect(`/workspace/cases/${data.id}`);
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
  application:{title:'Application preparation pathway',steps:['Define the order or outcome being sought','Confirm the correct current application process','Identify all affected owners and trustees','Collect evidence, consents and supporting records','Complete quality review before submission','Track submission, requests, hearing and outcome']},
  other:{title:'Whenua matter pathway',steps:['Define the desired outcome','Confirm the whenua and people involved','Identify the legal and practical pathway','Collect evidence and required support','Progress authorised decisions and approvals']},
};

async function createPlanForCase(supabase:any,userId:string,caseId:string,caseType:string){
  const template=planTemplates[caseType]??planTemplates.other;
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
  const caseType = String(formData.get('case_type') ?? 'other');
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
