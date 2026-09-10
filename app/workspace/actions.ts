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

  const { data, error } = await supabase.from('teaohou_cases').insert({
    owner_id: userId,
    title,
    case_type: caseType,
    summary: summary || null,
    status: 'intake',
  }).select('id').single();

  if (error) throw new Error(`Unable to create case: ${error.message}`);
  revalidatePath('/workspace');
  redirect(`/workspace/cases/${data.id}`);
}

export async function addWhenua(formData: FormData) {
  const { supabase, userId } = await authenticatedUser();
  const caseId = String(formData.get('case_id') ?? '');
  if (!caseId) return;

  const { error } = await supabase.from('teaohou_whenua').insert({
    case_id: caseId,
    created_by: userId,
    block_name: String(formData.get('block_name') ?? '').trim() || null,
    location_text: String(formData.get('location_text') ?? '').trim() || null,
    court_reference: String(formData.get('court_reference') ?? '').trim() || null,
    ownership_structure: String(formData.get('ownership_structure') ?? '').trim() || null,
    notes: String(formData.get('notes') ?? '').trim() || null,
  });
  if (error) throw new Error(`Unable to save whenua record: ${error.message}`);
  revalidatePath(`/workspace/cases/${caseId}`);
}

const planTemplates:Record<string,{title:string;steps:string[]}> = {
  succession:{title:'Succession pathway',steps:['Confirm the deceased owner and relevant whenua interests','Build the whakapapa and identify all potential successors','Collect supporting evidence and existing orders','Decide how the interests are proposed to be held','Prepare the current official application','Track Court requests, hearing and final orders']},
  trust:{title:'Trust and governance pathway',steps:['Confirm ownership and any existing trust orders','Define the trust purpose and proposed structure','Engage owners and proposed trustees','Prepare consents, minutes and governance documents','Follow the appropriate Court process','Maintain governance records after the order']},
  housing:{title:'Build on whānau whenua',steps:['Confirm ownership and legal authority to occupy or develop','Check legal and physical access, services and site constraints','Define the development concept and household need','Confirm council planning and consent requirements','Prepare valuation, budget and funding-ready evidence','Complete approvals, contracts and construction milestones']},
  whenua:{title:'Understand our whenua',steps:['Record what the whānau already knows','Confirm the block using official land records','Review owners, trustees and deceased interests','Identify existing orders and restrictions','Choose the next succession, trust, access or development pathway']},
  application:{title:'Application preparation pathway',steps:['Define the order or outcome being sought','Confirm the correct current application process','Identify all affected owners and trustees','Collect evidence, consents and supporting records','Complete quality review before submission','Track submission, requests, hearing and outcome']},
  other:{title:'Whenua matter pathway',steps:['Define the desired outcome','Confirm the whenua and people involved','Identify the legal and practical pathway','Collect evidence and required support','Progress authorised decisions and approvals']},
};

export async function createDefaultPlan(formData: FormData) {
  const { supabase, userId } = await authenticatedUser();
  const caseId = String(formData.get('case_id') ?? '');
  const caseType = String(formData.get('case_type') ?? 'other');
  const template = planTemplates[caseType] ?? planTemplates.other;
  if (!caseId) return;

  const { data: existing } = await supabase.from('teaohou_plans').select('id').eq('case_id',caseId).limit(1).maybeSingle();
  if (existing) { revalidatePath(`/workspace/cases/${caseId}`); return; }

  const { data: plan, error: planError } = await supabase.from('teaohou_plans').insert({
    case_id: caseId,
    owner_id: userId,
    goal_key: caseType,
    goal_title: template.title,
    status: 'active',
    current_stage: 1,
  }).select('id').single();
  if (planError) throw new Error(`Unable to create pathway: ${planError.message}`);

  const rows = template.steps.map((title,index)=>({
    plan_id: plan.id,
    sequence: index + 1,
    title,
    status: index === 0 ? 'in_progress' : 'not_started',
    responsible_party: 'whānau',
  }));
  const { error: stepsError } = await supabase.from('teaohou_plan_steps').insert(rows);
  if (stepsError) throw new Error(`Pathway created but steps could not be saved: ${stepsError.message}`);
  revalidatePath(`/workspace/cases/${caseId}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
