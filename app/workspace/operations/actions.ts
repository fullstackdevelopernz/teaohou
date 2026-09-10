'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';

async function userContext() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect('/login');
  const { data: profile } = await supabase.from('teaohou_profiles').select('role').eq('user_id', userId).maybeSingle();
  return { supabase, userId, role: profile?.role || 'whanau' };
}

function clean(value: FormDataEntryValue | null) {
  return String(value ?? '').trim();
}

export async function createApplication(formData: FormData) {
  const { supabase, userId } = await userContext();
  const caseId = clean(formData.get('case_id'));
  const applicationType = clean(formData.get('application_type'));
  const officialFormUrl = clean(formData.get('official_form_url'));
  if (!caseId || !applicationType) return;
  const { error } = await supabase.from('teaohou_applications').insert({
    case_id: caseId,
    owner_id: userId,
    application_type: applicationType,
    official_form_url: officialFormUrl || null,
    status: 'preparing',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/workspace/applications');
  revalidatePath(`/workspace/cases/${caseId}`);
}

export async function createAppointment(formData: FormData) {
  const { supabase, userId } = await userContext();
  const caseId = clean(formData.get('case_id'));
  const title = clean(formData.get('title'));
  const startsAt = clean(formData.get('starts_at'));
  const location = clean(formData.get('location'));
  const notes = clean(formData.get('notes'));
  if (!caseId || !title || !startsAt) return;
  const { error } = await supabase.from('teaohou_appointments').insert({
    case_id: caseId,
    owner_id: userId,
    title,
    starts_at: new Date(startsAt).toISOString(),
    location: location || null,
    notes: notes || null,
    status: 'scheduled',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/workspace/appointments');
  revalidatePath(`/workspace/cases/${caseId}`);
}

export async function sendMessage(formData: FormData) {
  const { supabase, userId, role } = await userContext();
  const caseId = clean(formData.get('case_id'));
  const body = clean(formData.get('body'));
  const requestedVisibility = clean(formData.get('visibility'));
  const visibility = requestedVisibility === 'staff' && ['case_worker','admin','professional'].includes(role) ? 'staff' : 'case';
  if (!caseId || !body) return;
  const { error } = await supabase.from('teaohou_messages').insert({ case_id: caseId, sender_id: userId, body, visibility });
  if (error) throw new Error(error.message);
  revalidatePath('/workspace/messages');
  revalidatePath(`/workspace/cases/${caseId}`);
}

export async function createTask(formData: FormData) {
  const { supabase, userId } = await userContext();
  const caseId = clean(formData.get('case_id'));
  const title = clean(formData.get('title'));
  const description = clean(formData.get('description'));
  const dueDate = clean(formData.get('due_date'));
  if (!caseId || !title) return;
  const { error } = await supabase.from('teaohou_case_tasks').insert({
    case_id: caseId,
    owner_id: userId,
    title,
    description: description || null,
    due_date: dueDate || null,
    status: 'not_started',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/workspace/operations');
  revalidatePath(`/workspace/cases/${caseId}`);
}

export async function updateTaskStatus(formData: FormData) {
  const { supabase } = await userContext();
  const taskId = clean(formData.get('task_id'));
  const caseId = clean(formData.get('case_id'));
  const status = clean(formData.get('status'));
  if (!taskId || !['not_started','in_progress','blocked','completed','cancelled'].includes(status)) return;
  const { error } = await supabase.from('teaohou_case_tasks').update({ status }).eq('id', taskId);
  if (error) throw new Error(error.message);
  revalidatePath('/workspace/operations');
  if (caseId) revalidatePath(`/workspace/cases/${caseId}`);
}

export async function updateCaseStatus(formData: FormData) {
  const { supabase, role } = await userContext();
  if (!['case_worker','admin','professional'].includes(role)) throw new Error('Staff access required.');
  const caseId = clean(formData.get('case_id'));
  const status = clean(formData.get('status'));
  const allowed = ['draft','intake','triage','active','waiting','ready_to_file','filed','hearing','completed','closed'];
  if (!caseId || !allowed.includes(status)) return;
  const { error } = await supabase.from('teaohou_cases').update({ status }).eq('id', caseId);
  if (error) throw new Error(error.message);
  revalidatePath('/workspace/operations');
  revalidatePath(`/workspace/cases/${caseId}`);
}

export async function assignCaseToSelf(formData: FormData) {
  const { supabase, userId, role } = await userContext();
  if (!['case_worker','admin','professional'].includes(role)) throw new Error('Staff access required.');
  const caseId = clean(formData.get('case_id'));
  if (!caseId) return;
  const { error } = await supabase.from('teaohou_cases').update({ assigned_to: userId, status: 'active' }).eq('id', caseId);
  if (error) throw new Error(error.message);
  revalidatePath('/workspace/operations');
  revalidatePath(`/workspace/cases/${caseId}`);
}
