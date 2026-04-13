export type LibraryCategory =
  | 'economics'
  | 'rights_society'
  | 'government'
  | 'education'
  | 'healthcare'
  | 'foreign_policy'
  | 'environment'
  | 'criminal_justice'

export interface LibraryCategoryMeta {
  id: LibraryCategory
  label: string
  blurb: string
}

export const LIBRARY_CATEGORIES: LibraryCategoryMeta[] = [
  { id: 'economics', label: 'Economics', blurb: 'Money, markets, and the rules of the game.' },
  { id: 'rights_society', label: 'Rights & Society', blurb: 'The questions that define who we are.' },
  { id: 'government', label: 'Government & Democracy', blurb: 'Power, process, and the architecture of the republic.' },
  { id: 'education', label: 'Education', blurb: 'Who decides what kids learn, and how.' },
  { id: 'healthcare', label: 'Healthcare', blurb: 'Cost, access, and control of the American body.' },
  { id: 'foreign_policy', label: 'Foreign Policy', blurb: 'America in the world.' },
  { id: 'environment', label: 'Environment & Energy', blurb: 'What we burn and what we save.' },
  { id: 'criminal_justice', label: 'Criminal Justice', blurb: 'Punishment, order, and accountability.' },
]

export interface SeedQuestion {
  question: string
  category: LibraryCategory
  tier: 1 | 2 | 3
  hook: string
}

export function slugify(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
}

export const LIBRARY_QUESTIONS: SeedQuestion[] = [
  // ---------- Economics (25) ----------
  { question: 'Should the federal minimum wage be raised to $15 per hour?', category: 'economics', tier: 1, hook: 'Does a higher floor lift workers or price them out?' },
  { question: 'Should the United States impose a wealth tax on the ultra-rich?', category: 'economics', tier: 1, hook: 'Fair share or capital flight trigger?' },
  { question: 'Is free trade a net benefit to the American worker?', category: 'economics', tier: 2, hook: 'Cheap goods or hollowed-out towns?' },
  { question: 'Does trickle-down economics actually work?', category: 'economics', tier: 2, hook: 'The theory behind every tax cut fight.' },
  { question: 'What is the real cause of inflation in America?', category: 'economics', tier: 1, hook: 'Print too much money or profit too hard?' },
  { question: 'Is federal deficit spending sustainable?', category: 'economics', tier: 2, hook: 'Stimulus or slow-motion crisis?' },
  { question: 'Should Social Security be partially privatized?', category: 'economics', tier: 2, hook: 'Market returns vs. guaranteed safety net.' },
  { question: 'Should capital gains be taxed at the same rate as wages?', category: 'economics', tier: 2, hook: 'Reward for risk or loophole for the rich?' },
  { question: 'Should the United States adopt a universal basic income?', category: 'economics', tier: 1, hook: 'Freedom floor or work disincentive?' },
  { question: 'Do tariffs help or hurt the American economy?', category: 'economics', tier: 1, hook: 'Protection for workers or tax on consumers?' },
  { question: 'Should the estate tax be expanded or abolished?', category: 'economics', tier: 2, hook: 'Dynastic wealth or double taxation?' },
  { question: 'Should the corporate tax rate be increased?', category: 'economics', tier: 2, hook: 'Revenue vs. competitiveness.' },
  { question: 'Should gig economy workers be classified as employees?', category: 'economics', tier: 2, hook: 'Benefits vs. flexibility.' },
  { question: 'Should antitrust law break up Big Tech?', category: 'economics', tier: 1, hook: 'Monopoly threat or free-market success?' },
  { question: 'Should the Federal Reserve remain independent of the president?', category: 'economics', tier: 2, hook: 'Technocracy vs. accountability.' },
  { question: 'How heavily should cryptocurrency be regulated?', category: 'economics', tier: 2, hook: 'Scam vector or financial freedom?' },
  { question: 'What is the real solution to the housing affordability crisis?', category: 'economics', tier: 1, hook: 'Build more or regulate harder?' },
  { question: 'Does rent control help or hurt tenants over time?', category: 'economics', tier: 2, hook: 'Cheaper now, scarcer later?' },
  { question: 'Should federal law make it easier for workers to unionize?', category: 'economics', tier: 2, hook: 'Bargaining power or economic drag?' },
  { question: 'Has outsourcing hurt the American middle class?', category: 'economics', tier: 2, hook: 'Efficiency gains vs. displaced towns.' },
  { question: 'Are persistent trade deficits a real problem?', category: 'economics', tier: 3, hook: 'A ledger warning or a false alarm?' },
  { question: 'Should student loan debt be forgiven?', category: 'economics', tier: 1, hook: 'Relief for a generation or gift to the college-educated?' },
  { question: 'Is federal regulation killing American small business?', category: 'economics', tier: 2, hook: 'Safety net or strangled entrepreneurs?' },
  { question: 'Should occupational licensing requirements be reduced?', category: 'economics', tier: 3, hook: 'Gatekeeping or consumer protection?' },
  { question: 'Should the US commit to a massive federal infrastructure program?', category: 'economics', tier: 2, hook: 'Investment boom or pork barrel?' },

  // ---------- Rights & Society (30) ----------
  { question: 'Should abortion be legal nationwide?', category: 'rights_society', tier: 1, hook: 'Bodily autonomy vs. unborn life.' },
  { question: 'Should voter ID laws be required for all elections?', category: 'rights_society', tier: 1, hook: 'Fraud prevention or voter suppression?' },
  { question: 'Should affirmative action in college admissions be preserved?', category: 'rights_society', tier: 1, hook: 'Remedy for history or discrimination today?' },
  { question: 'Should the United States enact stricter federal gun control laws?', category: 'rights_society', tier: 1, hook: 'Public safety vs. constitutional right.' },
  { question: 'Should the death penalty be abolished?', category: 'rights_society', tier: 2, hook: 'Justice for the worst crimes or state-sanctioned killing?' },
  { question: 'Should recreational drugs be legalized?', category: 'rights_society', tier: 2, hook: 'Freedom and safer use or social collapse?' },
  { question: 'Should sex work be decriminalized?', category: 'rights_society', tier: 2, hook: 'Worker safety or moral line?' },
  { question: 'Should transgender athletes compete in women\'s sports?', category: 'rights_society', tier: 1, hook: 'Inclusion vs. competitive fairness.' },
  { question: 'Should religious business owners have exemptions from anti-discrimination law?', category: 'rights_society', tier: 2, hook: 'Conscience vs. equal treatment.' },
  { question: 'Should universities restrict offensive speech on campus?', category: 'rights_society', tier: 2, hook: 'Open inquiry or managed harm?' },
  { question: 'Should hate speech be illegal in the United States?', category: 'rights_society', tier: 2, hook: 'First Amendment vs. protection of minorities.' },
  { question: 'Should the federal government pay reparations for slavery?', category: 'rights_society', tier: 2, hook: 'Accounting for history or a bill that never ends?' },
  { question: 'Should Confederate monuments be removed from public spaces?', category: 'rights_society', tier: 2, hook: 'Heritage or propaganda?' },
  { question: 'Should undocumented immigrants be given a path to citizenship?', category: 'rights_society', tier: 1, hook: 'Pragmatism vs. rule of law.' },
  { question: 'Should birthright citizenship be ended?', category: 'rights_society', tier: 2, hook: '14th Amendment or a magnet for migration?' },
  { question: 'Should police department budgets be cut and reallocated?', category: 'rights_society', tier: 2, hook: 'Reform or retreat from order?' },
  { question: 'Should qualified immunity for police be eliminated?', category: 'rights_society', tier: 2, hook: 'Accountability vs. paralyzing liability.' },
  { question: 'Should mandatory minimum sentencing laws be abolished?', category: 'rights_society', tier: 2, hook: 'Judge discretion or equal punishment?' },
  { question: 'Should three-strikes laws be repealed?', category: 'rights_society', tier: 3, hook: 'Deterrence or disproportionate punishment?' },
  { question: 'Should civil asset forfeiture be abolished?', category: 'rights_society', tier: 3, hook: 'Crime-fighting tool or legalized theft?' },
  { question: 'Should eminent domain be restricted for private development?', category: 'rights_society', tier: 3, hook: 'Public good vs. private taking.' },
  { question: 'Is government surveillance for national security worth the privacy cost?', category: 'rights_society', tier: 2, hook: 'Security vs. the Fourth Amendment.' },
  { question: 'Should the NSA\'s bulk surveillance programs continue?', category: 'rights_society', tier: 2, hook: 'Terror prevention or mass spying?' },
  { question: 'Should social media platforms be required to host all legal speech?', category: 'rights_society', tier: 1, hook: 'Public square or private property?' },
  { question: 'Should flag burning be legally protected?', category: 'rights_society', tier: 3, hook: 'Speech or desecration?' },
  { question: 'Is kneeling during the national anthem appropriate protest?', category: 'rights_society', tier: 3, hook: 'Free expression vs. shared ritual.' },
  { question: 'Should critical race theory be taught in public schools?', category: 'rights_society', tier: 1, hook: 'Honest history or divisive ideology?' },
  { question: 'Should comprehensive sex education be required in schools?', category: 'rights_society', tier: 2, hook: 'Health information vs. parental control.' },
  { question: 'Should school districts remove books parents find objectionable?', category: 'rights_society', tier: 2, hook: 'Parental rights or censorship?' },
  { question: 'Should public schools allow organized prayer?', category: 'rights_society', tier: 2, hook: 'Free exercise or establishment?' },

  // ---------- Government & Democracy (20) ----------
  { question: 'Should the Electoral College be abolished?', category: 'government', tier: 1, hook: 'Federalism vs. one person, one vote.' },
  { question: 'Should Supreme Court justices have term limits?', category: 'government', tier: 1, hook: 'Independence vs. accountability.' },
  { question: 'Should the Senate filibuster be eliminated?', category: 'government', tier: 1, hook: 'Majority rule or minority protection?' },
  { question: 'Should the United States adopt ranked choice voting?', category: 'government', tier: 2, hook: 'Better winners or confused voters?' },
  { question: 'Should campaign finance be more strictly limited?', category: 'government', tier: 1, hook: 'Clean elections or chilled speech?' },
  { question: 'Should partisan gerrymandering be banned?', category: 'government', tier: 2, hook: 'Fair maps or political reality?' },
  { question: 'Should Washington DC become the 51st state?', category: 'government', tier: 2, hook: 'Representation or partisan power grab?' },
  { question: 'Should Puerto Rico become the 51st state?', category: 'government', tier: 2, hook: 'Citizens with no vote — by choice or neglect?' },
  { question: 'Should Congress have term limits?', category: 'government', tier: 2, hook: 'Citizen legislators or experienced lawmakers?' },
  { question: 'Should the United States adopt automatic voter registration?', category: 'government', tier: 2, hook: 'Turnout boost or integrity risk?' },
  { question: 'Should universal mail-in voting be the national standard?', category: 'government', tier: 1, hook: 'Access vs. verification.' },
  { question: 'Should Election Day be a federal holiday?', category: 'government', tier: 3, hook: 'More voters or more costs?' },
  { question: 'Should Citizens United be overturned?', category: 'government', tier: 2, hook: 'Free speech or bought government?' },
  { question: 'Should lobbying be more strictly regulated?', category: 'government', tier: 2, hook: 'Petition right or purchased influence?' },
  { question: 'Should the presidential pardon power be limited?', category: 'government', tier: 2, hook: 'Mercy or monarchy?' },
  { question: 'Have presidents relied too heavily on executive orders?', category: 'government', tier: 2, hook: 'Gridlock workaround or end run around Congress?' },
  { question: 'Should the Supreme Court\'s power of judicial review be curtailed?', category: 'government', tier: 3, hook: 'Unchecked court or constitutional backstop?' },
  { question: 'Should power be returned to the states on most domestic issues?', category: 'government', tier: 2, hook: 'Laboratories of democracy or patchwork of rights?' },
  { question: 'Should a balanced budget amendment be added to the Constitution?', category: 'government', tier: 2, hook: 'Fiscal discipline or economic straitjacket?' },
  { question: 'Should the federal government\'s domestic surveillance powers be reduced?', category: 'government', tier: 2, hook: 'Liberty vs. threat detection.' },

  // ---------- Education (15) ----------
  { question: 'Should public funding follow students to private schools through vouchers?', category: 'education', tier: 1, hook: 'Parent choice or public school drain?' },
  { question: 'Are charter schools good for American education?', category: 'education', tier: 2, hook: 'Innovation lab or privatization wedge?' },
  { question: 'Do teachers unions help or hurt student outcomes?', category: 'education', tier: 2, hook: 'Worker protection or bad teacher shield?' },
  { question: 'Should public college be tuition-free?', category: 'education', tier: 1, hook: 'Great equalizer or regressive subsidy?' },
  { question: 'Should existing federal student loans be forgiven?', category: 'education', tier: 1, hook: 'Mass relief or moral hazard?' },
  { question: 'Was Common Core a good idea?', category: 'education', tier: 3, hook: 'National standards or federal overreach?' },
  { question: 'Should standardized testing be the basis of school accountability?', category: 'education', tier: 2, hook: 'Measurable outcomes or narrow metrics?' },
  { question: 'Should homeschooling be more strictly regulated?', category: 'education', tier: 3, hook: 'Child welfare vs. parental authority.' },
  { question: 'What belongs in public school sex education?', category: 'education', tier: 2, hook: 'Comprehensive or abstinence-only?' },
  { question: 'Should schools teach the role of race in American history?', category: 'education', tier: 1, hook: 'Honest account or political agenda?' },
  { question: 'Should school-led prayer be allowed in public schools?', category: 'education', tier: 2, hook: 'Tradition or Establishment Clause?' },
  { question: 'Should students be required to recite the Pledge of Allegiance?', category: 'education', tier: 3, hook: 'Civic ritual or coerced speech?' },
  { question: 'Should colleges use race-conscious admissions criteria?', category: 'education', tier: 2, hook: 'Equal opportunity or equal treatment?' },
  { question: 'Should for-profit colleges be more strictly regulated?', category: 'education', tier: 3, hook: 'Student protection or market interference?' },
  { question: 'Should academic tenure be abolished?', category: 'education', tier: 3, hook: 'Academic freedom or unfireable deadwood?' },

  // ---------- Healthcare (20) ----------
  { question: 'Should the United States adopt a universal healthcare system?', category: 'healthcare', tier: 1, hook: 'Right or commodity?' },
  { question: 'Should the United States implement Medicare for All?', category: 'healthcare', tier: 1, hook: 'Single-payer savings or rationed care?' },
  { question: 'Has the Affordable Care Act been a success?', category: 'healthcare', tier: 2, hook: 'Coverage gains vs. cost hikes.' },
  { question: 'Should the government negotiate prescription drug prices?', category: 'healthcare', tier: 1, hook: 'Affordable medicine or lost innovation?' },
  { question: 'Are pharmaceutical patents too long?', category: 'healthcare', tier: 2, hook: 'Innovation incentive or monopoly rent?' },
  { question: 'Should employers and schools require COVID and other vaccinations?', category: 'healthcare', tier: 1, hook: 'Public health or bodily autonomy?' },
  { question: 'Should abortion access be protected by federal law?', category: 'healthcare', tier: 1, hook: 'Rights floor or state authority?' },
  { question: 'Should mental health care have full parity with physical care?', category: 'healthcare', tier: 2, hook: 'Treat the whole patient or bust the budget?' },
  { question: 'Should prescription opioids be more tightly regulated?', category: 'healthcare', tier: 2, hook: 'Overdose prevention or undertreated pain?' },
  { question: 'Should terminally ill patients have a right to physician-assisted death?', category: 'healthcare', tier: 2, hook: 'Dignity in dying or slippery slope?' },
  { question: 'Is hospital consolidation hurting patients?', category: 'healthcare', tier: 3, hook: 'Efficiency or monopoly pricing?' },
  { question: 'Should health insurance be mandatory?', category: 'healthcare', tier: 2, hook: 'Shared risk or forced purchase?' },
  { question: 'Should Medicaid be expanded in every state?', category: 'healthcare', tier: 2, hook: 'Coverage for the poor or federal strings?' },
  { question: 'Is the FDA too cautious in approving new treatments?', category: 'healthcare', tier: 2, hook: 'Patient safety vs. access to hope.' },
  { question: 'Should medical malpractice awards be capped?', category: 'healthcare', tier: 3, hook: 'Defensive medicine or victim justice?' },
  { question: 'Should telehealth be permanently deregulated across state lines?', category: 'healthcare', tier: 2, hook: 'Access vs. state oversight.' },
  { question: 'Should the United States adopt a tax on sugary drinks?', category: 'healthcare', tier: 3, hook: 'Health nudge or nanny state?' },
  { question: 'Should cigarettes and flavored tobacco be more strictly restricted?', category: 'healthcare', tier: 3, hook: 'Public health vs. personal liberty.' },
  { question: 'Should marijuana be legal for medical use nationwide?', category: 'healthcare', tier: 1, hook: 'Medicine or gateway?' },
  { question: 'Should genetic information be protected as a constitutional right?', category: 'healthcare', tier: 3, hook: 'New privacy frontier or overregulation?' },

  // ---------- Foreign Policy (20) ----------
  { question: 'Should the United States remain in NATO?', category: 'foreign_policy', tier: 1, hook: 'Alliance leadership or free-rider problem?' },
  { question: 'Should the United States continue large-scale military aid to Ukraine?', category: 'foreign_policy', tier: 1, hook: 'Defending democracy or forever war?' },
  { question: 'What should US policy be toward the Israeli-Palestinian conflict?', category: 'foreign_policy', tier: 1, hook: 'Ally defense vs. two-state realism.' },
  { question: 'Should the United States continue the trade war with China?', category: 'foreign_policy', tier: 1, hook: 'Strategic decoupling or self-inflicted pain?' },
  { question: 'Should the United States rejoin the Iran nuclear deal?', category: 'foreign_policy', tier: 2, hook: 'Diplomacy or appeasement?' },
  { question: 'Should the US embargo against Cuba end?', category: 'foreign_policy', tier: 3, hook: 'Cold War relic or principled pressure?' },
  { question: 'Should foreign aid spending be increased or cut?', category: 'foreign_policy', tier: 2, hook: 'Soft power or wasted money?' },
  { question: 'Is the US drone warfare program justified?', category: 'foreign_policy', tier: 2, hook: 'Surgical strikes or civilian toll?' },
  { question: 'Is torture ever justified in counterterrorism?', category: 'foreign_policy', tier: 2, hook: 'Ticking bomb or moral line?' },
  { question: 'Should the Guantanamo Bay detention facility be closed?', category: 'foreign_policy', tier: 2, hook: 'Legal black hole or necessary evil?' },
  { question: 'Should the United States pursue regime change abroad?', category: 'foreign_policy', tier: 2, hook: 'Freedom agenda or endless war?' },
  { question: 'Is US military spending too high?', category: 'foreign_policy', tier: 1, hook: 'Global security or bloated budget?' },
  { question: 'Should the United States reduce its nuclear arsenal?', category: 'foreign_policy', tier: 2, hook: 'Disarmament or deterrence?' },
  { question: 'Should the United States recommit to global climate agreements?', category: 'foreign_policy', tier: 2, hook: 'Global leadership or economic self-harm?' },
  { question: 'Should the US defer more to the United Nations?', category: 'foreign_policy', tier: 3, hook: 'Multilateralism or sovereignty?' },
  { question: 'Should the United States restrict immigration from specific countries?', category: 'foreign_policy', tier: 2, hook: 'Security screen or bias in policy?' },
  { question: 'Should US asylum law be tightened?', category: 'foreign_policy', tier: 2, hook: 'Humanitarian duty or open door?' },
  { question: 'Should the United States accept more refugees annually?', category: 'foreign_policy', tier: 2, hook: 'Moral obligation or capacity limit?' },
  { question: 'Should the United States build a physical wall along the southern border?', category: 'foreign_policy', tier: 1, hook: 'Security investment or political symbol?' },
  { question: 'Should the US military be used against Mexican drug cartels?', category: 'foreign_policy', tier: 2, hook: 'Existential threat or sovereignty breach?' },

  // ---------- Environment & Energy (20) ----------
  { question: 'Should the United States enact a Green New Deal?', category: 'environment', tier: 1, hook: 'Climate moonshot or economic overreach?' },
  { question: 'Should the US adopt a federal carbon tax?', category: 'environment', tier: 1, hook: 'Market-based climate fix or regressive levy?' },
  { question: 'Should nuclear power be expanded to fight climate change?', category: 'environment', tier: 2, hook: 'Clean baseload or waste legacy?' },
  { question: 'Should hydraulic fracturing (fracking) be banned?', category: 'environment', tier: 2, hook: 'Energy independence or contaminated water?' },
  { question: 'Should new offshore oil drilling be permitted?', category: 'environment', tier: 2, hook: 'Domestic energy or ecological risk?' },
  { question: 'Should the Keystone XL pipeline have been built?', category: 'environment', tier: 3, hook: 'Jobs and supply or climate and tribal rights?' },
  { question: 'Should the United States commit to the Paris Climate Agreement?', category: 'environment', tier: 2, hook: 'Binding goals or voluntary theater?' },
  { question: 'Does the EPA have too much regulatory authority?', category: 'environment', tier: 2, hook: 'Public health guardian or agency overreach?' },
  { question: 'Should Endangered Species Act protections be strengthened?', category: 'environment', tier: 3, hook: 'Biodiversity or economic brake?' },
  { question: 'Should single-use plastics be banned?', category: 'environment', tier: 3, hook: 'Pollution cut or convenience tax?' },
  { question: 'Should gasoline cars be phased out for electric vehicles?', category: 'environment', tier: 1, hook: 'Clean future or forced transition?' },
  { question: 'Should clean energy receive major federal subsidies?', category: 'environment', tier: 2, hook: 'Investment in the future or picking winners?' },
  { question: 'Should coal plants be shut down on an aggressive timeline?', category: 'environment', tier: 2, hook: 'Climate urgency or stranded communities?' },
  { question: 'Is natural gas a bridge fuel or a climate problem?', category: 'environment', tier: 2, hook: 'Lower emissions today vs. lock-in tomorrow.' },
  { question: 'Should Western water rights be overhauled?', category: 'environment', tier: 3, hook: 'Antique law vs. drought reality.' },
  { question: 'Should more public lands be designated as national parks?', category: 'environment', tier: 3, hook: 'Conservation or economic lockup?' },
  { question: 'Should GMO foods require explicit labels?', category: 'environment', tier: 3, hook: 'Consumer info or fear-mongering?' },
  { question: 'Should common agricultural pesticides be more tightly restricted?', category: 'environment', tier: 3, hook: 'Ecosystem protection vs. food prices.' },
  { question: 'Should industrial animal agriculture be more heavily regulated?', category: 'environment', tier: 2, hook: 'Climate and welfare vs. affordable food.' },
  { question: 'Is aggressive federal climate policy justified given the economic costs?', category: 'environment', tier: 1, hook: 'Existential threat or overcorrection?' },

  // ---------- Criminal Justice (20) ----------
  { question: 'Should the death penalty be ended in the United States?', category: 'criminal_justice', tier: 1, hook: 'Ultimate justice or fatal error?' },
  { question: 'Should federal mandatory minimum sentences be repealed?', category: 'criminal_justice', tier: 2, hook: 'Judicial discretion or consistent punishment?' },
  { question: 'Should three-strikes sentencing laws be abolished?', category: 'criminal_justice', tier: 3, hook: 'Repeat offender control or disproportionate harm?' },
  { question: 'Should cash bail be eliminated?', category: 'criminal_justice', tier: 1, hook: 'Innocent until indigent or public safety tool?' },
  { question: 'Should private prisons be banned?', category: 'criminal_justice', tier: 2, hook: 'Profit motive or practical capacity?' },
  { question: 'Should long-term solitary confinement be banned?', category: 'criminal_justice', tier: 2, hook: 'Torture or security tool?' },
  { question: 'Should juveniles ever receive life sentences without parole?', category: 'criminal_justice', tier: 3, hook: 'Developmental mercy or grave-crime response?' },
  { question: 'Should recreational marijuana be legalized nationwide?', category: 'criminal_justice', tier: 1, hook: 'Personal freedom or public health risk?' },
  { question: 'Should all currently illegal drugs be decriminalized?', category: 'criminal_justice', tier: 2, hook: 'Harm reduction or surrender?' },
  { question: 'Should all police officers be required to wear body cameras?', category: 'criminal_justice', tier: 2, hook: 'Accountability or theater?' },
  { question: 'Should qualified immunity for law enforcement be eliminated?', category: 'criminal_justice', tier: 2, hook: 'Accountability or paralysis?' },
  { question: 'Should civil asset forfeiture be abolished?', category: 'criminal_justice', tier: 2, hook: 'Crime disruption or legal theft?' },
  { question: 'Should the US invest more in restorative justice programs?', category: 'criminal_justice', tier: 3, hook: 'Healing communities or soft on crime?' },
  { question: 'Should public sex offender registries be reformed?', category: 'criminal_justice', tier: 3, hook: 'Community safety or lifetime scarlet letter?' },
  { question: 'Should universal background checks be required for all gun purchases?', category: 'criminal_justice', tier: 1, hook: 'Common-sense screen or gun-owner registry?' },
  { question: 'Should stand-your-ground self-defense laws be repealed?', category: 'criminal_justice', tier: 2, hook: 'Duty to retreat or duty to fight back?' },
  { question: 'Are state self-defense laws too permissive?', category: 'criminal_justice', tier: 3, hook: 'Empowered citizens or license to kill?' },
  { question: 'Should hate crime laws carry enhanced federal penalties?', category: 'criminal_justice', tier: 2, hook: 'Protected classes or thought policing?' },
  { question: 'Should crime victims receive government-funded compensation?', category: 'criminal_justice', tier: 3, hook: 'Moral duty or unbounded budget?' },
  { question: 'Should federal money fund community-based recidivism programs?', category: 'criminal_justice', tier: 3, hook: 'Prevention investment or pass on the problem?' },
]
