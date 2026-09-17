export type AuthorityMode = 'off' | 'shadow' | 'enforce';

export type TeWakaminengaAuthorityRecord = {
  authority_id: string;
  status: 'active' | 'suspended' | 'revoked' | 'expired';
  issuer: { type: string; id: string; name: string };
  subject: { type: string; id: string };
  scope: {
    actions: string[];
    purposes: string[];
    processors?: string[];
    jurisdictions?: string[];
    ai_training?: boolean;
    external_sharing?: boolean;
    human_review_required?: boolean;
  };
  expires_at?: string | null;
};

type Decision = 'ALLOW' | 'DENY' | 'ALLOW_WITH_CONDITIONS';

type DecisionResponse = {
  decision: Decision;
  reasons?: string[];
  conditions?: string[];
  decisionId?: string;
  requestId?: string;
};

function mode(): AuthorityMode {
  const value = process.env.EDEN_AUTHORITY_MODE;
  if (value === 'shadow' || value === 'enforce') return value;
  return 'off';
}

export async function checkEdenAuthority(input: {
  actorId: string;
  resourceId: string;
  domain: string;
  classifications: string[];
  action: 'read' | 'write' | 'share' | 'infer' | 'train' | 'export' | 'execute';
  purpose: string;
  processorId?: string;
  jurisdiction?: string;
  retention?: 'none' | 'ephemeral' | 'persistent';
  authority: TeWakaminengaAuthorityRecord;
}): Promise<DecisionResponse> {
  const currentMode = mode();
  if (currentMode === 'off') {
    return { decision: 'ALLOW', reasons: ['authority_enforcement_off'] };
  }

  const baseUrl = process.env.EDEN_AUTHORITY_URL;
  const apiKey = process.env.EDEN_AUTHORITY_API_KEY;

  if (!baseUrl || !apiKey) {
    if (currentMode === 'enforce') {
      throw new Error('Authority enforcement is enabled but the authority service is not configured.');
    }
    console.warn('Eden authority shadow check skipped: service configuration missing');
    return { decision: 'ALLOW', reasons: ['shadow_configuration_missing'] };
  }

  const requestId = crypto.randomUUID();
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/decisions`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      requestId,
      actor: {
        id: input.actorId,
        type: 'person',
        relationships: [
          `authority_subject:${input.authority.subject.type}:${input.authority.subject.id}`,
          `authority_issuer:${input.authority.issuer.type}:${input.authority.issuer.id}`,
        ],
      },
      resource: {
        id: input.resourceId,
        domain: input.domain,
        classifications: input.classifications,
        authorityHolderIds: [input.authority.issuer.id],
      },
      action: input.action,
      purpose: input.purpose,
      processor: {
        id: input.processorId ?? 'teaohou',
        type: 'application',
        jurisdiction: input.jurisdiction ?? 'NZ',
        retention: input.retention ?? 'persistent',
      },
      authority: {
        authorityId: input.authority.authority_id,
        status: input.authority.status,
        permittedActions: input.authority.scope.actions,
        permittedPurposes: input.authority.scope.purposes,
        approvedProcessorIds: input.authority.scope.processors ?? [],
        approvedJurisdictions: input.authority.scope.jurisdictions ?? [],
        humanReviewRequired: input.authority.scope.human_review_required ?? false,
        trainingAllowed: input.authority.scope.ai_training ?? false,
        externalSharingAllowed: input.authority.scope.external_sharing ?? false,
        expiresAt: input.authority.expires_at ?? null,
      },
    }),
  });

  let result: DecisionResponse;
  try {
    result = (await response.json()) as DecisionResponse;
  } catch {
    result = { decision: 'DENY', reasons: ['invalid_authority_service_response'] };
  }

  if (!response.ok || result.decision === 'DENY') {
    if (currentMode === 'shadow') {
      console.warn('Eden authority shadow denial', {
        requestId,
        status: response.status,
        result,
      });
      return result;
    }
    throw new Error(`Authority denied protected operation (${result.reasons?.join(', ') || response.status}).`);
  }

  if (currentMode === 'shadow') {
    console.info('Eden authority shadow decision', { requestId, result });
  }

  return result;
}

export function parseAuthorityRecord(value: FormDataEntryValue | null): TeWakaminengaAuthorityRecord | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const record = JSON.parse(value) as TeWakaminengaAuthorityRecord;
    if (!record.authority_id || !record.issuer?.id || !record.subject?.id || !record.scope?.actions || !record.scope?.purposes) {
      return null;
    }
    return record;
  } catch {
    return null;
  }
}
