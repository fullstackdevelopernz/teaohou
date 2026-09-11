import { HeartHandshake, Users, Landmark, UserCheck, ListChecks } from 'lucide-react';
import PathwayWorkspace from '../_components/PathwayWorkspace';

export default function TrustsPage(){
  return <PathwayWorkspace
    eyebrow="TRUSTS & GOVERNANCE"
    title="Trusts & governance"
    subtitle="Working together for the generations"
    description="Build or maintain a Māori land trust with a clear purpose, owner participation, accountable trustees and reliable governance records."
    summary="This workspace separates establishing or changing a trust from the ongoing job of governing it well."
    icon={HeartHandshake}
    goals={[
      {title:'Create a whānau trust',description:'Understand when interests may be aggregated and what owner and trustee information is needed.',icon:Users},
      {title:'Create an ahu whenua or whenua tōpū trust',description:'Prepare purpose, ownership, trustee and governance material for a collective land-management structure.',icon:Landmark},
      {title:'Change trustees',description:'Record resignations, deaths, replacements, appointments and supporting owner decisions.',icon:UserCheck},
      {title:'Run the trust well',description:'Maintain meetings, resolutions, conflicts, reports, registers and follow-up actions.',icon:ListChecks}
    ]}
    stages={[
      {title:'Confirm the existing legal position',description:'Start with the current ownership schedule, trust order, trustee list and later variation or appointment orders.',tags:['Records'],checks:['Obtain the current trust order','Confirm all current trustees','Check vacancies or outdated contacts','Identify land and interests vested in the trust']},
      {title:'Define the purpose and trust type',description:'Clarify why the trust is being proposed or changed and which structure matches that purpose.',tags:['Structure'],checks:['Write objectives in plain language','Identify intended beneficiaries','Compare trust options using current Court guidance','Escalate unclear structures for legal advice']},
      {title:'Prepare owner engagement',description:'Plan the hui or consultation process so affected owners understand the proposal and can participate meaningfully.',tags:['Owners','Hui'],checks:['Prepare notice and agenda','Record attendance and voting information','Capture questions and objections','Keep signed minutes and resolutions']},
      {title:'Confirm trustee suitability and consent',description:'Record who is proposed, why they are suitable, whether they consent and what responsibilities they will hold.',tags:['Trustees'],checks:['Obtain trustee consents','Record conflicts of interest','Capture contact and eligibility information','Define governance responsibilities']},
      {title:'Prepare and submit the Court application',description:'Use the current official application process and attach the evidence required for the specific trust matter.',tags:['Application'],checks:['Use current form and guidance','Attach ownership schedules and existing orders','Attach minutes, resolutions and trustee consents','Keep a complete submitted copy']},
      {title:'Operate and review the trust',description:'After an order is made, move into ongoing governance rather than treating the case as finished.',tags:['Governance'],checks:['Maintain trustee and beneficiary registers','Record meetings and resolutions','Track actions and due dates','Store annual reports and key decisions']}
    ]}
    prepare={['Current trust order or ownership schedule','Names and contacts of owners','Proposed/current trustee details','Trust objectives','Hui notices, minutes and resolutions','Relevant financial or land-management records']}
    decisions={['Is a new trust actually required?','What trust structure best fits the whenua and purpose?','Do owners understand and support the proposal?','Are proposed trustees suitable and willing?','Are there disputes or conflicts requiring specialist advice?']}
    resources={[
      {label:'Māori Land Court — application forms',href:'https://www.xn--morilandcourt-wqb.govt.nz/en/our-application-process/come-in-apply-to-the-court/application-forms'},
      {label:'Māori Land Court — application guides',href:'https://www.xn--morilandcourt-wqb.govt.nz/en/our-application-process/application-guides'},
      {label:'Upload governance documents',href:'/workspace/documents'}
    ]}
    warning="Trust establishment and trustee decisions can have long-term legal and governance consequences. Disputed ownership, trustee conflicts or unclear authority should be escalated for qualified legal advice."
    nextHref="/workspace/applications"
    nextLabel="Prepare trust application"
  />;
}
