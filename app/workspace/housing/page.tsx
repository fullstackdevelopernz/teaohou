import { House, Scale, MapPinned, Building2, WalletCards } from 'lucide-react';
import PathwayWorkspace from '../_components/PathwayWorkspace';

export default function HousingPage(){
  return <PathwayWorkspace
    eyebrow="HOUSING & DEVELOPMENT"
    title="Housing & development"
    subtitle="A place to call home"
    description="Turn a housing goal into a staged whenua-development pathway covering authority, site feasibility, council requirements, funding and construction readiness."
    summary="The sequence matters. Confirm the legal right to use the whenua and whether the site can support the proposed development before spending heavily on plans or construction."
    icon={House}
    goals={[
      {title:'Confirm authority to build',description:'Understand who owns or administers the whenua and what authority is required to occupy or develop it.',icon:Scale},
      {title:'Check the site',description:'Review access, services, wastewater, water, power, natural hazards and practical constraints.',icon:MapPinned},
      {title:'Understand consents',description:'Identify district plan, resource consent and building consent requirements with the relevant council.',icon:Building2},
      {title:'Prepare for funding',description:'Organise ownership, authority, valuation, plans, costs and borrower information before seeking finance.',icon:WalletCards}
    ]}
    stages={[
      {title:'Confirm land interests and authority',description:'Begin with the legal status of the whenua and the authority to occupy, licence, lease or otherwise develop.',tags:['Authority'],checks:['Confirm block and ownership','Identify trustees or administrators','Identify occupation, licence or lease requirements']},
      {title:'Complete early site feasibility',description:'Establish whether access, services and physical conditions support the intended build.',tags:['Site'],checks:['Legal and physical access','Water and wastewater options','Power and telecommunications','Flood, slope and other hazard checks']},
      {title:'Define the development concept',description:'Set the number of homes, intended occupants, approximate footprint, servicing approach and staged budget.',tags:['Concept'],checks:['Define who will live there','Set indicative build scope','Identify professionals needed']},
      {title:'Confirm planning and consent pathway',description:'Check the relevant local authority requirements for the specific site and development.',tags:['Council'],checks:['District plan or zoning review','Resource consent assessment','Building consent requirements','Engineering or specialist reports if required']},
      {title:'Build a finance-ready pack',description:'Bring together authority, site information, plans, budget, valuation and borrower information for the funding pathway.',tags:['Funding'],checks:['Project budget','Evidence of authority','Plans and specifications','Borrower affordability and deposit information where applicable']},
      {title:'Procure and build',description:'Only after legal, consent and funding gates are satisfied should the project move into contracted construction and completion.',tags:['Delivery'],checks:['Signed contracts','Approved consents','Confirmed funding','Insurance and completion documentation']}
    ]}
    prepare={['Land block and ownership record','Existing occupation, licence or lease orders','Site address or map reference','Known access and utility information','Approximate build goal and household','Indicative budget']}
    decisions={['Who has authority to approve occupation or development?','Is separate title or security required by a lender?','Can the site be serviced?','What council approvals apply?','Is the project financially feasible?']}
    resources={[
      {label:'Start with your whenua record',href:'/workspace/whenua'},
      {label:'Te Ao Hou resource library',href:'/resources'},
      {label:'Upload site and funding documents',href:'/workspace/documents'}
    ]}
    warning="Planning, building, engineering and lending requirements depend on the particular whenua, council, ownership structure and funding provider. Record verified requirements for the specific case rather than assuming one national pathway."
    nextHref="/workspace/applications"
    nextLabel="Prepare development case"
  />;
}
