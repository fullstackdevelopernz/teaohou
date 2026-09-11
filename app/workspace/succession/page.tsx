import { Users, Search, FolderOpen, ClipboardCheck } from 'lucide-react';
import PathwayWorkspace from '../_components/PathwayWorkspace';

export default function SuccessionPage(){
  return <PathwayWorkspace
    eyebrow="SUCCESSION PATHWAY"
    title="Succession"
    subtitle="Your connection through generations"
    description="Work through the practical steps involved when Māori land interests need to pass from a deceased owner to the people entitled to succeed."
    summary="Succession is about confirming the deceased owner, the affected interests, the whakapapa, the rightful successors and the evidence needed before a Court application is ready."
    icon={Users}
    goals={[
      {title:'Identify the deceased owner',description:'Confirm the person, their land interests and whether previous succession has already occurred.',icon:Search},
      {title:'Build the whakapapa record',description:'Record the family line and all people who may be entitled to succeed.',icon:Users},
      {title:'Prepare the evidence pack',description:'Gather death, will, whakapapa, whāngai, partner and trust material where relevant.',icon:FolderOpen},
      {title:'Prepare for application',description:'Match the circumstances to the current official succession process before submission.',icon:ClipboardCheck}
    ]}
    stages={[
      {title:'Confirm the deceased owner and interests',description:'Establish which owner has died and which Māori land interests are affected.',tags:['Owner','Interests'],checks:['Confirm full legal name and aliases','Find relevant land blocks','Check whether any interests were already succeeded']},
      {title:'Identify all rightful successors',description:'Build the whakapapa carefully so the application does not omit people who may be entitled.',tags:['Whakapapa'],checks:['Record children and descendants','Record relevant whāngai circumstances','Check whether a surviving partner may have rights']},
      {title:'Collect supporting evidence',description:'Gather the current official evidence required for the circumstances of the succession.',tags:['Evidence'],checks:['Death certificate','Will if one exists','Whakapapa and family contact information','Partner, whāngai or trust documents where relevant']},
      {title:'Decide how interests should be held',description:'Consider whether successors will take interests directly or whether a trust application is also proposed.',tags:['Decision'],checks:['Discuss options with affected people','Record trustee consents if relevant','Prepare hui minutes where needed']},
      {title:'Prepare and submit the application',description:'Use current Māori Land Court guidance and an accepted submission channel.',tags:['Application'],checks:['Use the current process','Check all supporting documents','Keep a complete submitted copy']},
      {title:'Track hearing, decision and post-order work',description:'Respond to Court requests, attend any required hearing and retain final orders.',tags:['Court','Completion'],checks:['Track correspondence','Record hearing dates','Store final orders and update whānau records']}
    ]}
    prepare={['Deceased owner’s full name','Death certificate','Will, if one exists','Whakapapa showing possible successors','Known Māori land interests','Relevant trust or whāngai information']}
    decisions={['Has succession already been completed for some interests?','Who are all rightful successors?','Does a surviving partner hold relevant rights?','Are whāngai circumstances involved?','Should a whānau trust be considered?']}
    resources={[
      {label:'Māori Land Court — succession',href:'https://www.xn--morilandcourt-wqb.govt.nz/en/maori-land/becoming-a-landowner/succession'},
      {label:'Māori Land Court — application guides',href:'https://www.xn--morilandcourt-wqb.govt.nz/en/our-application-process/application-guides'},
      {label:'Understand your whenua first',href:'/workspace/whenua'}
    ]}
    warning="Contested whakapapa, wills, competing claims, capacity issues or complex estates should be escalated for qualified legal advice. Te Ao Hou supports preparation and case management; it does not make legal determinations."
    nextHref="/workspace/applications"
    nextLabel="Prepare application"
  />;
}
