import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

const housingSteps=[
  'Confirm ownership and legal authority to occupy or develop',
  'Check legal and physical access, services and site constraints',
  'Define the development concept and household need',
  'Confirm council planning and consent requirements',
  'Prepare valuation, budget and funding-ready evidence',
  'Complete approvals, contracts and construction milestones',
];

export async function POST(request:Request){
  const supabase=await createClient();
  const { data:claimsData }=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(!userId) return NextResponse.redirect(new URL('/login',request.url),303);

  const formData=await request.formData();
  const title=String(formData.get('title')??'').trim().slice(0,180);
  const summary=String(formData.get('summary')??'').trim().slice(0,2000);
  if(!title) return NextResponse.redirect(new URL('/workspace/housing?housing_error=missing_title',request.url),303);

  const { data:caseId,error:createError }=await supabase.rpc('teaohou_create_case',{
    p_title:title,
    p_case_type:'housing',
    p_summary:summary||null,
    p_priority:'normal',
    p_target_date:null,
  });

  if(createError||!caseId){
    console.error('Housing project creation failed',{code:createError?.code,message:createError?.message});
    return NextResponse.redirect(new URL('/workspace/housing?housing_error=create_failed',request.url),303);
  }

  const { data:existingPlan }=await supabase.from('teaohou_plans').select('id').eq('case_id',caseId).eq('owner_id',userId).limit(1).maybeSingle();
  if(!existingPlan){
    const { data:plan,error:planError }=await supabase.from('teaohou_plans').insert({
      case_id:caseId,
      owner_id:userId,
      goal_key:'housing',
      goal_title:'Build on whānau whenua',
      status:'active',
      current_stage:1,
    }).select('id').single();

    if(planError||!plan){
      console.error('Housing plan creation failed',{code:planError?.code,message:planError?.message,caseId});
      return NextResponse.redirect(new URL(`/workspace/housing?case=${caseId}&housing_error=plan_failed`,request.url),303);
    }

    const rows=housingSteps.map((step,index)=>({
      plan_id:plan.id,
      sequence:index+1,
      title:step,
      status:index===0?'in_progress':'not_started',
      responsible_party:'whānau',
    }));
    const { error:stepsError }=await supabase.from('teaohou_plan_steps').insert(rows);
    if(stepsError){
      console.error('Housing plan step creation failed',{code:stepsError.code,message:stepsError.message,caseId,planId:plan.id});
      return NextResponse.redirect(new URL(`/workspace/housing?case=${caseId}&housing_error=steps_failed`,request.url),303);
    }
  }

  return NextResponse.redirect(new URL(`/workspace/housing?case=${caseId}&created=1`,request.url),303);
}
