import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkEdenAuthority } from '@/lib/eden-authority';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (error || !userId) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body: {
    resourceId?: string;
    domain?: string;
    classifications?: string[];
    authorityHolderIds?: string[];
    action?: 'read' | 'write' | 'share' | 'infer' | 'train' | 'export' | 'execute';
    purpose?: string;
    processorId?: string;
    jurisdiction?: string;
    retention?: 'none' | 'ephemeral' | 'persistent';
    authorityId?: string;
  };

  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  if (!body.resourceId || !body.domain || !body.action || !body.purpose || !body.authorityId || !body.authorityHolderIds?.length) {
    return NextResponse.json({ error: 'missing_authority_request_fields' }, { status: 400 });
  }

  try {
    const result = await checkEdenAuthority({
      actorId: userId,
      resourceId: body.resourceId,
      domain: body.domain,
      classifications: body.classifications?.length ? body.classifications : ['restricted'],
      authorityHolderIds: body.authorityHolderIds,
      action: body.action,
      purpose: body.purpose,
      processorId: body.processorId ?? 'teaohou',
      jurisdiction: body.jurisdiction ?? 'NZ',
      retention: body.retention ?? 'persistent',
      authorityId: body.authorityId,
    });

    return NextResponse.json(result, { status: result.decision === 'DENY' ? 403 : 200 });
  } catch (authorityError) {
    const message = authorityError instanceof Error ? authorityError.message : 'authority_check_failed';
    return NextResponse.json({ error: 'authority_check_failed', decision: 'DENY', reason: message }, { status: 403 });
  }
}
