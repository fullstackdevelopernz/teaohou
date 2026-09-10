'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

export async function createCase(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect('/login');

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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
