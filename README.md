# Te Ao Hou

Independent whānau whenua services platform for Jackson Tutahi. The application is a royal-purple Next.js development preview inspired by authorised 360 Degrees workspace patterns. No source production data or credentials are copied or modified.

## Run

Requires Node.js 20 or later. Run `npm install`, then `npm run dev`. Run `npm run build` for the production build. Vercel uses the repository root and the Next.js framework.

## Release scope

The public landing page, resource library, workspace navigation and general guidance pathways are implemented. `/api/health` reports the release state. Private case endpoints return 503 intentionally. There is no production client intake, database, authentication, court submission, finance, or legal approval integration yet. Do not enter personal data into this preview.

## Next release gates

Provision a dedicated Te Ao Hou database and secure authentication; implement server-side tenant and case permissions, MFA for privileged users, private object storage, audit records, evidence workflows and migration tests. Verify current official forms and service integrations before enabling submission or financial operations. Never use another application’s database or credentials.
