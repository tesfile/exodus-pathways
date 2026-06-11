export type ImmigrationProgramSlug =
  | "express-entry"
  | "federal-skilled-worker"
  | "pnp"
  | "study-permit"
  | "work-permit"
  | "visitor-visa"
  | "family-sponsorship"
  | "refugee-sponsorship"
  | "business-immigration"
  | "start-up-visa"
  | "self-employed-program";

export type ImmigrationProgram = {
  slug: ImmigrationProgramSlug;
  titleKey: string;
  overviewKey: string;
  whoKey: string;
  requirements: string[];
  documents: string[];
  steps: string[];
  faqs: Array<{ questionKey: string; answerKey: string }>;
};

const baseSteps = ["assessment", "documents", "review", "prepare", "submit", "respond", "decision"];

export const immigrationPrograms: ImmigrationProgram[] = [
  {
    slug: "express-entry",
    titleKey: "imm.program.expressEntry.title",
    overviewKey: "imm.program.expressEntry.overview",
    whoKey: "imm.program.expressEntry.who",
    requirements: ["profile", "language", "education", "work", "funds"],
    documents: ["passport", "languageTest", "eca", "workLetters", "proofFunds", "police", "medical"],
    steps: ["assessment", "profile", "ita", "documents", "submit", "respond", "decision"],
    faqs: [
      { questionKey: "imm.faq.expressEntry.crs.q", answerKey: "imm.faq.expressEntry.crs.a" },
      { questionKey: "imm.faq.expressEntry.job.q", answerKey: "imm.faq.expressEntry.job.a" }
    ]
  },
  {
    slug: "federal-skilled-worker",
    titleKey: "imm.program.fsw.title",
    overviewKey: "imm.program.fsw.overview",
    whoKey: "imm.program.fsw.who",
    requirements: ["language", "education", "work", "points", "funds"],
    documents: ["passport", "languageTest", "eca", "workLetters", "proofFunds", "police", "medical"],
    steps: baseSteps,
    faqs: [
      { questionKey: "imm.faq.fsw.points.q", answerKey: "imm.faq.fsw.points.a" },
      { questionKey: "imm.faq.fsw.express.q", answerKey: "imm.faq.fsw.express.a" }
    ]
  },
  {
    slug: "pnp",
    titleKey: "imm.program.pnp.title",
    overviewKey: "imm.program.pnp.overview",
    whoKey: "imm.program.pnp.who",
    requirements: ["province", "work", "settlement", "admissibility"],
    documents: ["passport", "jobOffer", "workLetters", "settlementPlan", "proofFunds", "police"],
    steps: ["assessment", "province", "nomination", "federal", "submit", "respond", "decision"],
    faqs: [
      { questionKey: "imm.faq.pnp.province.q", answerKey: "imm.faq.pnp.province.a" },
      { questionKey: "imm.faq.pnp.job.q", answerKey: "imm.faq.pnp.job.a" }
    ]
  },
  {
    slug: "study-permit",
    titleKey: "imm.program.studyPermit.title",
    overviewKey: "imm.program.studyPermit.overview",
    whoKey: "imm.program.studyPermit.who",
    requirements: ["school", "funds", "purpose", "admissibility"],
    documents: ["passport", "loa", "pal", "proofFunds", "studyPlan", "photos", "forms"],
    steps: ["assessment", "school", "documents", "prepare", "submit", "biometrics", "decision"],
    faqs: [
      { questionKey: "imm.faq.study.funds.q", answerKey: "imm.faq.study.funds.a" },
      { questionKey: "imm.faq.study.work.q", answerKey: "imm.faq.study.work.a" }
    ]
  },
  {
    slug: "work-permit",
    titleKey: "imm.program.workPermit.title",
    overviewKey: "imm.program.workPermit.overview",
    whoKey: "imm.program.workPermit.who",
    requirements: ["jobOffer", "lmia", "experience", "admissibility"],
    documents: ["passport", "jobOffer", "lmia", "workLetters", "forms", "photos", "police"],
    steps: ["assessment", "employer", "documents", "prepare", "submit", "biometrics", "decision"],
    faqs: [
      { questionKey: "imm.faq.work.lmia.q", answerKey: "imm.faq.work.lmia.a" },
      { questionKey: "imm.faq.work.family.q", answerKey: "imm.faq.work.family.a" }
    ]
  },
  {
    slug: "visitor-visa",
    titleKey: "imm.program.visitorVisa.title",
    overviewKey: "imm.program.visitorVisa.overview",
    whoKey: "imm.program.visitorVisa.who",
    requirements: ["purpose", "ties", "funds", "admissibility"],
    documents: ["passport", "invitation", "proofFunds", "ties", "travelHistory", "forms", "photos"],
    steps: ["assessment", "documents", "prepare", "submit", "biometrics", "respond", "decision"],
    faqs: [
      { questionKey: "imm.faq.visitor.invitation.q", answerKey: "imm.faq.visitor.invitation.a" },
      { questionKey: "imm.faq.visitor.refusal.q", answerKey: "imm.faq.visitor.refusal.a" }
    ]
  },
  {
    slug: "family-sponsorship",
    titleKey: "imm.program.familySponsorship.title",
    overviewKey: "imm.program.familySponsorship.overview",
    whoKey: "imm.program.familySponsorship.who",
    requirements: ["sponsor", "relationship", "income", "admissibility"],
    documents: ["passport", "relationshipProof", "statusCanada", "incomeProof", "police", "medical", "forms"],
    steps: ["assessment", "sponsor", "documents", "prepare", "submit", "respond", "decision"],
    faqs: [
      { questionKey: "imm.faq.family.sponsor.q", answerKey: "imm.faq.family.sponsor.a" },
      { questionKey: "imm.faq.family.processing.q", answerKey: "imm.faq.family.processing.a" }
    ]
  },
  {
    slug: "refugee-sponsorship",
    titleKey: "imm.program.refugeeSponsorship.title",
    overviewKey: "imm.program.refugeeSponsorship.overview",
    whoKey: "imm.program.refugeeSponsorship.who",
    requirements: ["sponsorGroup", "refugeeStatus", "settlement", "admissibility"],
    documents: ["identity", "refugeeProof", "sponsorForms", "settlementPlan", "photos", "forms"],
    steps: ["assessment", "sponsor", "documents", "prepare", "submit", "interview", "decision"],
    faqs: [
      { questionKey: "imm.faq.refugee.group.q", answerKey: "imm.faq.refugee.group.a" },
      { questionKey: "imm.faq.refugee.support.q", answerKey: "imm.faq.refugee.support.a" }
    ]
  },
  {
    slug: "business-immigration",
    titleKey: "imm.program.businessImmigration.title",
    overviewKey: "imm.program.businessImmigration.overview",
    whoKey: "imm.program.businessImmigration.who",
    requirements: ["business", "netWorth", "investment", "experience"],
    documents: ["passport", "businessPlan", "netWorthProof", "taxRecords", "bankStatements", "forms"],
    steps: ["assessment", "businessPlan", "documents", "review", "submit", "respond", "decision"],
    faqs: [
      { questionKey: "imm.faq.business.investment.q", answerKey: "imm.faq.business.investment.a" },
      { questionKey: "imm.faq.business.plan.q", answerKey: "imm.faq.business.plan.a" }
    ]
  },
  {
    slug: "start-up-visa",
    titleKey: "imm.program.startUpVisa.title",
    overviewKey: "imm.program.startUpVisa.overview",
    whoKey: "imm.program.startUpVisa.who",
    requirements: ["innovation", "supportLetter", "language", "funds"],
    documents: ["passport", "supportLetter", "businessPlan", "pitchDeck", "proofFunds", "languageTest", "forms"],
    steps: ["assessment", "designatedOrg", "documents", "prepare", "submit", "respond", "decision"],
    faqs: [
      { questionKey: "imm.faq.startup.support.q", answerKey: "imm.faq.startup.support.a" },
      { questionKey: "imm.faq.startup.team.q", answerKey: "imm.faq.startup.team.a" }
    ]
  },
  {
    slug: "self-employed-program",
    titleKey: "imm.program.selfEmployed.title",
    overviewKey: "imm.program.selfEmployed.overview",
    whoKey: "imm.program.selfEmployed.who",
    requirements: ["experience", "culturalAthletic", "intent", "admissibility"],
    documents: ["passport", "experienceProof", "portfolio", "financialRecords", "police", "medical", "forms"],
    steps: baseSteps,
    faqs: [
      { questionKey: "imm.faq.self.experience.q", answerKey: "imm.faq.self.experience.a" },
      { questionKey: "imm.faq.self.proof.q", answerKey: "imm.faq.self.proof.a" }
    ]
  }
];

export const peopleInvolvedKeys = [
  "imm.people.applicant",
  "imm.people.sponsor",
  "imm.people.inviter",
  "imm.people.spouse",
  "imm.people.children",
  "imm.people.employer",
  "imm.people.school",
  "imm.people.businessPartner",
  "imm.people.otherFamily"
];

export const documentStatuses = [
  "imm.status.missing",
  "imm.status.requested",
  "imm.status.uploaded",
  "imm.status.approved",
  "imm.status.rejected"
];

export const caseTimelineKeys = [
  "imm.timeline.accountCreated",
  "imm.timeline.assessmentSubmitted",
  "imm.timeline.documentsRequested",
  "imm.timeline.documentsUploaded",
  "imm.timeline.underReview",
  "imm.timeline.applicationPreparation",
  "imm.timeline.submitted",
  "imm.timeline.irccRequested",
  "imm.timeline.clientResponded",
  "imm.timeline.decisionReceived",
  "imm.timeline.closed"
];

export function findImmigrationProgram(slug: string) {
  return immigrationPrograms.find((program) => program.slug === slug);
}
