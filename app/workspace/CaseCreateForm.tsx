'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { createCase } from './actions';

const caseTypes=[
  ['whenua','Understand whenua'],
  ['succession','Succession'],
  ['trust','Trust / governance'],
  ['housing','Housing / development'],
  ['access','Access to whenua'],
  ['occupation_order','Occupation order'],
  ['licence_to_occupy','Licence to occupy'],
  ['partition','Partition'],
  ['amalgamation','Amalgamation'],
  ['easement','Easement'],
  ['status_order','Status order'],
  ['governance','Governance matter'],
  ['finance','Finance / funding'],
  ['rates','Rates matter'],
  ['survey_boundary','Survey / boundary'],
  ['infrastructure_services','Infrastructure / services'],
  ['sale_transfer','Sale / transfer'],
  ['dispute','Dispute / resolution'],
  ['application','Court / formal application'],
  ['custom','Another matter type'],
];

export default function CaseCreateForm(){
  const [caseType,setCaseType]=useState('succession');

  return <form action={createCase} className="create-case-form">
    <input name="title" required maxLength={120} placeholder="e.g. Succession for Nanny Mere's interests" />
    <select name="case_type" required value={caseType} onChange={e=>setCaseType(e.target.value)}>
      {caseTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </select>
    {caseType==='custom'&&<input name="custom_case_type" required maxLength={64} placeholder="Name the matter type, e.g. boundary adjustment" />}
    <select name="priority" defaultValue="normal" aria-label="Priority">
      <option value="low">Low priority</option>
      <option value="normal">Normal priority</option>
      <option value="high">High priority</option>
      <option value="urgent">Urgent</option>
    </select>
    <input name="target_date" type="date" aria-label="Target date" />
    <textarea name="summary" maxLength={3000} placeholder="What are you trying to achieve, what is happening now, and what outcome do you need?" />
    <button className="button button-primary" type="submit"><Plus size={16}/> Create case & pathway</button>
  </form>;
}
