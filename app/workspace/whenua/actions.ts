'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';

function clean(value: FormDataEntryValue | null, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}

async function context() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (error || !userId) redirect('/login');
  return { supabase, userId };
}

const allowedStructures = new Set(['unknown','individual','whanau_trust','ahu_whenua','whenua_topu','other']);

export async function createWhenuaRecord(formData: FormData) {
  const { supabase, userId } = await context();
  const caseId = clean(formData.get('case_id'), 80);
  const blockName = clean(formData.get('block_name'), 180);
  const location = clean(formData.get('location_text'), 250);
  const legalDescription = clean(formData.get('legal_description'), 500);
  const courtReference = clean(formData.get('court_reference'), 180);
  const trustName = clean(formData.get('trust_name'), 220);
  const sourceUrl = clean(formData.get('source_url'), 1000);
  const notes = clean(formData.get('notes'), 3000);
  const requestedStructure = clean(formData.get('ownership_structure'), 40);
  const ownershipStructure = allowedStructures.has(requestedStructure) ? requestedStructure : 'unknown';

  if (!caseId || (!blockName && !location && !courtReference && !legalDescription)) return;

  const { error } = await supabase.from('teaohou_whenua').insert({
    case_id: caseId,
    created_by: userId,
    block_name: blockName || null,
    location_text: location || null,
    legal_description: legalDescription || null,
    court_reference: courtReference || null,
    ownership_structure: ownershipStructure,
    trust_name: trustName || null,
    source_url: sourceUrl || null,
    notes: notes || null,
  });
  if (error) throw new Error(`Unable to save whenua record: ${error.message}`);
  revalidatePath('/workspace/whenua');
  revalidatePath(`/workspace/cases/${caseId}`);
}

export async function updateWhenuaRecord(formData: FormData) {
  const { supabase } = await context();
  const id = clean(formData.get('whenua_id'), 80);
  const caseId = clean(formData.get('case_id'), 80);
  if (!id || !caseId) return;

  const requestedStructure = clean(formData.get('ownership_structure'), 40);
  const ownershipStructure = allowedStructures.has(requestedStructure) ? requestedStructure : 'unknown';

  const { error } = await supabase.from('teaohou_whenua').update({
    block_name: clean(formData.get('block_name'), 180) || null,
    location_text: clean(formData.get('location_text'), 250) || null,
    legal_description: clean(formData.get('legal_description'), 500) || null,
    court_reference: clean(formData.get('court_reference'), 180) || null,
    ownership_structure: ownershipStructure,
    trust_name: clean(formData.get('trust_name'), 220) || null,
    source_url: clean(formData.get('source_url'), 1000) || null,
    notes: clean(formData.get('notes'), 3000) || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id).eq('case_id', caseId);

  if (error) throw new Error(`Unable to update whenua record: ${error.message}`);
  revalidatePath('/workspace/whenua');
  revalidatePath(`/workspace/cases/${caseId}`);
}
