'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';

async function authenticatedUser(){
  const supabase=await createClient();
  const { data:claimsData,error }=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(error||!userId) redirect('/login');
  return {supabase,userId};
}

async function ensureHousingPlan(supabase:any,userId:string,caseId:string){
  const { data:existing }=await supabase.from('teaohou_plans').select('id').eq('case_id',caseId).eq('owner_id',userId).limit(1).maybeSingle();
  if(existing) return existing.id;

  const { data:plan,error:planError }=await supabase.from('teaohou_plans').insert({
    case_id:caseId,
    owner_id:userId,
    goal_key:'housing',
    goal_title:'Build on whānau whenua',
    status:'active',
    current_stage:1,
  }).select('id').single();
  if(planError) throw new Error(`Unable to create housing pathway: ${planError.message}`);

  const steps=[
    'Confirm ownership and legal authority to occupy or develop',
    'Check legal and physical access, services and site constraints',
    'Define the development concept and household need',
    'Confirm council planning and consent requirements',
    'Prepare valuation, budget and funding-ready evidence',
    'Complete approvals, contracts and construction milestones',
  ];
  const rows=steps.map((title,index)=>({
    plan_id:plan.id,
    sequence:index+1,
    title,
    status:index===0?'in_progress':'not_started',
    responsible_party:'whānau',
  }));
  const { error:stepsError }=await supabase.from('teaohou_plan_steps').insert(rows);
  if(stepsError) throw new Error(`Housing case created but pathway steps could not be saved: ${stepsError.message}`);
  return plan.id;
}

export async function createHousingProject(formData:FormData){
  const {supabase,userId}=await authenticatedUser();
  const title=String(formData.get('title')??'').trim().slice(0,120);
  const summary=String(formData.get('summary')??'').trim().slice(0,3000);
  if(!title) redirect('/workspace/housing?create_error=missing_title');

  const { data:caseId,error }=await supabase.rpc('teaohou_create_case',{
    p_title:title,
    p_case_type:'housing',
    p_summary:summary||null,
    p_priority:'normal',
    p_target_date:null,
  });

  if(error||!caseId){
    console.error('Te Ao Hou housing creation failed',{code:error?.code,message:error?.message});
    redirect('/workspace/housing?create_error=create_failed');
  }

  try{
    await ensureHousingPlan(supabase,userId,String(caseId));
  }catch(planError){
    console.error('Te Ao Hou housing pathway creation failed',planError);
  }

  revalidatePath('/workspace');
  revalidatePath('/workspace/housing');
  revalidatePath(`/workspace/cases/${caseId}`);
  redirect(`/workspace/housing?case=${caseId}&created=1`);
}
