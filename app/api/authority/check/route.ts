import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthorityCheckError, checkEdenAuthority } from '@/lib/eden-authority';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (error || !userId) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body: {
    subjectId?: string;
    resourceId?: string;
    domain?: string;
    classifications?: string[];
    action?: 'read' | 'write' | 'share' | 'infer' | 'train' | 'export' | 'execute';
    purpose?: string;
    retention?: 'none' | 'ephemeral' | 'persistent';
    authorityId?: string;
  };

  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  if (!body.subjectId || !body.resourceId || !body.domain || !body.action || !body.purpose || !body.authorityId) {
    return NextResponse.json({ error: 'missing_authority_request_fields' }, { status: 400 });
  }

  // This generic endpoint is deliberately personal-subject only. Collective,
  // trust, whānau and whenua authority must be derived by a server-side domain
  // workflow rather than asserted by a browser caller.
  if (body.subjectId !== userId) {
    return NextResponse.json({ error: 'subject_mismatch' }, { status: 403 });
  }

  try {
    const result = await checkEdenAuthority({
      subjectId: userId,
      actorId: userId,
      resourceId: body.resourceId,
      domain: body.domain,
      classifications: body.classifications?.length ? body.classifications : ['restricted'],
      authorityHolderIds: [userId],
      action: body.action,
      purpose: body.purpose,
      processorId: 'teaohou',
      jurisdiction: 'NZ',
      retention: body.retention ?? 'persistent',
      authorityId: body.authorityId,
    });

    // Shadow mode is observe-only; checkEdenAuthority always returns ALLOW in shadow.
    return NextResponse.json(result, { status: 200 });
  } catch (authorityError) {
    const status = authorityError instanceof AuthorityCheckError ? authorityError.status : 503;
    const code = authorityError instanceof AuthorityCheckError ? authorityError.code : 'AUTHORITY_CHECK_FAILED';
    const message = authorityError instanceof Error ? authorityError.message : 'authority_check_failed';
    return NextResponse.json({ error: code, decision: 'DENY', reason: message }, { status });
  }
}
