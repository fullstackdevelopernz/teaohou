export type AuthorityMode = 'off' | 'shadow' | 'enforce';
type Decision = 'ALLOW' | 'DENY' | 'ALLOW_WITH_CONDITIONS';
type DecisionResponse = { decision: Decision; reasons?: string[]; conditions?: string[]; decisionId?: string; requestId?: string; authorityVersion?: number; observedDecision?: string; observedReasons?: string[] };
const VALID_DECISIONS = new Set<Decision>(['ALLOW', 'DENY', 'ALLOW_WITH_CONDITIONS']);

export class AuthorityCheckError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'AuthorityCheckError';
    this.status = status;
    this.code = code;
  }
}

function mode(): AuthorityMode {
  const value = process.env.EDEN_AUTHORITY_MODE;
  if (value === 'shadow' || value === 'enforce') return value;
  return 'off';
}

function shadowAllow(reason: string, observedDecision?: string, observedReasons?: string[]): DecisionResponse {
  return { decision: 'ALLOW', reasons: [reason], observedDecision, observedReasons };
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
    if (currentMode === 'enforce') throw new AuthorityCheckError('Authority enforcement is enabled but the authority service is not configured.', 503, 'AUTHORITY_SERVICE_UNAVAILABLE');
    return shadowAllow('shadow_configuration_missing', 'DENY');
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
      return shadowAllow('shadow_authority_service_unreachable', 'DENY');
    }
    throw new AuthorityCheckError('Authority service could not be reached in time.', 503, 'AUTHORITY_SERVICE_UNREACHABLE');
  }

  let raw: unknown;
  try { raw = await response.json(); }
  catch { raw = null; }
  const result = (raw && typeof raw === 'object' ? raw : {}) as Partial<DecisionResponse>;
  const validDecision = typeof result.decision === 'string' && VALID_DECISIONS.has(result.decision as Decision);

  if (currentMode === 'shadow') {
    console.info('Eden authority shadow observation', { requestId, status: response.status, result });
    return shadowAllow(
      response.ok && validDecision ? 'shadow_observed_authority_decision' : 'shadow_invalid_authority_response',
      validDecision ? result.decision : 'INVALID',
      result.reasons,
    );
  }

  if (!response.ok) {
    const status = response.status === 403 ? 403 : 503;
    throw new AuthorityCheckError(`Authority service rejected protected operation (${response.status}).`, status, status === 403 ? 'AUTHORITY_DENIED' : 'AUTHORITY_SERVICE_INVALID_RESPONSE');
  }
  if (!validDecision) {
    throw new AuthorityCheckError('Authority service returned an invalid decision.', 503, 'AUTHORITY_SERVICE_INVALID_RESPONSE');
  }
  if (result.decision === 'DENY') {
    throw new AuthorityCheckError(`Authority denied protected operation (${result.reasons?.join(', ') || 'policy_denied'}).`, 403, 'AUTHORITY_DENIED');
  }
  if (result.decision === 'ALLOW_WITH_CONDITIONS') {
    if (!Array.isArray(result.conditions) || !result.conditions.length) {
      throw new AuthorityCheckError('Authority service returned conditioned approval without conditions.', 503, 'AUTHORITY_SERVICE_INVALID_RESPONSE');
    }
    throw new AuthorityCheckError(`Authority requires conditions before this operation can proceed (${result.conditions.join(', ')}).`, 409, 'AUTHORITY_CONDITIONS_REQUIRED');
  }

  return result as DecisionResponse;
}
