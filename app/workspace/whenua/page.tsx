import { LandPlot, Search, Users, Scale, Route } from 'lucide-react';
import PathwayWorkspace from '../_components/PathwayWorkspace';

export default function WhenuaPage(){
  return <PathwayWorkspace
    eyebrow="UNDERSTAND YOUR WHENUA"
    title="Understand your whenua"
    subtitle="Find your connection"
    description="Build a clear picture of the whenua, the current ownership structure, the people connected to it and the orders that affect it."
    summary="Start with the record before choosing the legal or development pathway. This page helps whānau answer: what land is this, who owns it now, and what should we look at next?"
    icon={LandPlot}
    goals={[
      {title:'Find a land block',description:'Use known names, locations, whānau names and official records to narrow down the whenua.',icon:Search},
      {title:'Understand ownership',description:'Read current ownership interests, trustees and ownership structures before taking action.',icon:Users},
      {title:'Understand existing orders',description:'Identify trust, occupation, partition, access or other orders that may shape what can happen next.',icon:Scale},
      {title:'Map the next step',description:'Once the record is understood, move into succession, trust, access, housing or another relevant pathway.',icon:Route}
    ]}
    stages={[
      {title:'Start with what your whānau knows',description:'Gather block names, place names, owner names, marae or hapū references and any old documents.',checks:['Record spelling variations','Ask whānau for old orders, rates notices or correspondence','Note where the whenua is located']},
      {title:'Search official land records',description:'Use official Māori Land Court services and records to confirm the legal block and ownership information.',tags:['Official records'],checks:['Confirm the block name','Check ownership and trustee information','Save relevant record references']},
      {title:'Read the ownership structure',description:'Work out whether interests are held individually or through an existing trust or other structure.',tags:['Ownership'],checks:['Identify owners and trustees','Identify deceased owners','Check whether succession appears outstanding']},
      {title:'Identify orders and restrictions',description:'Look for existing orders affecting occupation, access, partition, status, trusts or other legal rights.',tags:['Orders'],checks:['List relevant orders','Note dates and Court references','Identify anything that conflicts with the whānau goal']},
      {title:'Choose the next pathway',description:'Use the record to identify whether the next step is succession, governance, housing, access or another formal application.',tags:['Next step'],checks:['Choose the most immediate issue','Identify evidence still missing','Open a case/application when ready']}
    ]}
    prepare={['Approximate location','Known block or farm name','Names of owners or tūpuna','Any Court minute, order or title reference','Marae, hapū or whānau connection']}
    decisions={['Is the correct land block confirmed?','Are there deceased owners still on the title?','Is there an existing trust?','Are there occupation or access orders?','Does the official record match the whānau understanding?']}
    resources={[
      {label:'Māori Land Court — Māori land information',href:'https://www.xn--morilandcourt-wqb.govt.nz/en/maori-land'},
      {label:'Māori Land Court — application forms',href:'https://www.xn--morilandcourt-wqb.govt.nz/en/our-application-process/come-in-apply-to-the-court/application-forms'},
      {label:'My Whenua Plan',href:'/workspace/plan'}
    ]}
    nextHref="/workspace/succession"
    nextLabel="Check succession pathway"
  />;
}
