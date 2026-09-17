export type AuthorityMode = 'off' | 'shadow' | 'enforce';
type Decision = 'ALLOW' | 'DENY' | 'ALLOW_WITH_CONDITIONS';
type DecisionResponse = { decision: Decision; reasons?: string[]; conditions?: string[]; decisionId?: string; requestId?: string; authorityVersion?: number };

function mode(): AuthorityMode {
  const value = process.env.EDEN_AUTHORITY_MODE;
  if (value === 'shadow' || value === 'enforce') return value;
  return 'off';
}

export async function checkEdenAuthority(input: {
  subjectId: string;
  actorId: string;
  resourceId: string;
  domain: string;
  classifications: string[];
  authorityHolderIds: string[];
  action: 'read' | 'write' | 'share' | 'infer' | 'train' | 'export' | 'execute';
  purpose: string;
  authorityId: string;
  processorId?: string;
  jurisdiction?: string;
  retention?: 'none' | 'ephemeral' | 'persistent';
}): Promise<DecisionResponse> {
  const currentMode = mode();
  if (currentMode === 'off') return { decision: 'ALLOW', reasons: ['authority_enforcement_off'] };

  const baseUrl = process.env.EDEN_AUTHORITY_URL;
  const apiKey = process.env.EDEN_AUTHORITY_API_KEY;
  if (!baseUrl || !apiKey) {
    if (currentMode === 'enforce') throw new Error('Authority enforcement is enabled but the authority service is not configured.');
    return { decision: 'ALLOW', reasons: ['shadow_configuration_missing'] };
  }

  const requestId = crypto.randomUUID();
  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/decisions`, {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(5000),
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        requestId,
        subjectId: input.subjectId,
        actor: { id: input.actorId, type: 'person', relationships: [] },
        resource: {
          id: input.resourceId,
          domain: input.domain,
          classifications: input.classifications,
          authorityHolderIds: input.authorityHolderIds,
        },
        action: input.action,
        purpose: input.purpose,
        processor: {
          id: input.processorId ?? 'teaohou',
          type: 'application',
          jurisdiction: input.jurisdiction ?? 'NZ',
          retention: input.retention ?? 'persistent',
        },
        authorityId: input.authorityId,
      }),
    });
  } catch (error) {
    if (currentMode === 'shadow') {
      console.warn('Eden authority shadow request failed', { requestId, error });
      return { decision: 'DENY', reasons: ['authority_service_unreachable'] };
    }
    throw new Error('Authority service could not be reached in time.');
  }

  let result: DecisionResponse;
  try { result = (await response.json()) as DecisionResponse; }
  catch { result = { decision: 'DENY', reasons: ['invalid_authority_service_response'] }; }

  if (!response.ok || result.decision === 'DENY') {
    if (currentMode === 'shadow') {
      console.warn('Eden authority shadow denial', { requestId, status: response.status, result });
      return result;
    }
    throw new Error(`Authority denied protected operation (${result.reasons?.join(', ') || response.status}).`);
  }

  if (currentMode === 'shadow') console.info('Eden authority shadow decision', { requestId, result });
  return result;
}
