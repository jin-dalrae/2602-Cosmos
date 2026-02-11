import type { CosmosLayout, CosmosPost, Cluster, Gap } from './types'

export const DEMO_URL =
  'https://www.reddit.com/r/technology/comments/demo/should_ai_be_regulated/'

// ═══ Posts ═══

const posts: CosmosPost[] = [
  // ────── Cluster 1: Safety First (pro-regulation) ──────
  {
    id: 'p01',
    content:
      'We regulate pharmaceuticals, aviation, and nuclear power. Why on earth would we NOT regulate AI? The "move fast and break things" philosophy is fine for social media features, not for systems that can determine whether you get a loan or go to prison.',
    author: 'regulatory_realist',
    parent_id: null,
    depth: 0,
    upvotes: 847,
    stance: 'pro-regulation',
    themes: ['safety', 'precedent', 'accountability'],
    emotion: 'passionate',
    post_type: 'argument',
    importance: 0.92,
    core_claim:
      'AI must be regulated because precedent exists for regulating powerful technologies.',
    assumptions: ['Regulation can be effective for technology', 'AI poses comparable risks to pharma/aviation'],
    evidence_cited: ['Pharmaceutical regulation (FDA)', 'Aviation safety (FAA)', 'Nuclear regulation (NRC)'],
    logical_chain: {
      builds_on: [],
      root_assumption: 'gov_can_regulate',
      chain_depth: 0,
    },
    perceived_by: {
      innovation_forward: { relevance: 0.8, framing: 'Oversimplifies the comparison — AI iterates faster than planes' },
      pragmatic_middle: { relevance: 0.9, framing: 'Makes a fair point about precedent, but the details matter' },
    },
    embedding_hint: { opinion_axis: -0.85, abstraction: 0.4, novelty: 0.2 },
    relationships: [
      { target_id: 'p04', type: 'disagrees', strength: 0.8, reason: 'Directly opposed on regulation effectiveness' },
      { target_id: 'p02', type: 'builds_upon', strength: 0.6, reason: 'Both support regulatory framework' },
    ],
    position: [-5.8, 0.4, -0.3],
  },
  {
    id: 'p02',
    content:
      'The EU AI Act is a good start. Tiered risk classification makes sense — not all AI is the same. A chatbot recommending movies is not the same as an AI making parole decisions. We need proportional regulation.',
    author: 'brussels_watcher',
    parent_id: 'p01',
    depth: 1,
    upvotes: 412,
    stance: 'pro-regulation',
    themes: ['EU AI Act', 'risk-tiering', 'proportionality'],
    emotion: 'analytical',
    post_type: 'evidence',
    importance: 0.85,
    core_claim:
      'Risk-based tiered regulation like the EU AI Act is the most sensible approach.',
    assumptions: ['Risk-tiering can be accurately defined', 'EU regulatory model is transferable'],
    evidence_cited: ['EU AI Act (2024)', 'Risk classification framework'],
    logical_chain: {
      builds_on: ['p01'],
      root_assumption: 'gov_can_regulate',
      chain_depth: 1,
    },
    perceived_by: {
      innovation_forward: { relevance: 0.6, framing: 'EU over-regulates everything, this will stifle startups' },
      pragmatic_middle: { relevance: 0.85, framing: 'Tiered approach is reasonable but implementation matters' },
    },
    embedding_hint: { opinion_axis: -0.7, abstraction: 0.6, novelty: 0.4 },
    relationships: [
      { target_id: 'p01', type: 'builds_upon', strength: 0.7, reason: 'Extends the pro-regulation argument with specifics' },
      { target_id: 'p09', type: 'agrees', strength: 0.5, reason: 'Both favor structured frameworks' },
    ],
    position: [-4.2, -0.8, 0.5],
  },
  {
    id: 'p03',
    content:
      'My sister applied for a mortgage and got denied by an AI system. No explanation, no recourse, just "decision: denied." She had to fight for 3 months to get a human review, and guess what — she qualified easily. That black box almost cost her a home.',
    author: 'burned_by_algorithms',
    parent_id: 'p01',
    depth: 1,
    upvotes: 1203,
    stance: 'pro-regulation',
    themes: ['accountability', 'transparency', 'personal experience', 'algorithmic harm'],
    emotion: 'frustrated',
    post_type: 'anecdote',
    importance: 0.88,
    core_claim:
      'AI decision-making without transparency or recourse causes real harm to people.',
    assumptions: ['AI systems lack adequate transparency', 'Human review is more accurate'],
    evidence_cited: ['Personal mortgage denial experience'],
    logical_chain: {
      builds_on: ['p01'],
      root_assumption: 'precaution_principle',
      chain_depth: 1,
    },
    perceived_by: {
      innovation_forward: { relevance: 0.7, framing: 'Anecdotal — the system probably had a bug, not a regulation issue' },
      pragmatic_middle: { relevance: 0.9, framing: 'This is exactly why we need minimum transparency standards' },
    },
    embedding_hint: { opinion_axis: -0.9, abstraction: -0.5, novelty: 0.3 },
    relationships: [
      { target_id: 'p01', type: 'builds_upon', strength: 0.6, reason: 'Provides real-world evidence for regulation need' },
      { target_id: 'p07', type: 'disagrees', strength: 0.5, reason: 'Counters the "market will self-correct" narrative' },
    ],
    position: [-5.5, 1.2, 1.0],
  },
  {
    id: 'p13',
    content:
      'We literally watched social media destroy teen mental health in real time because we waited too long to act. Are we seriously going to make the same mistake with AI? At least with social media the worst case was depression. With AI, the worst case is... significantly worse.',
    author: 'learned_the_hard_way',
    parent_id: null,
    depth: 0,
    upvotes: 589,
    stance: 'pro-regulation',
    themes: ['precaution', 'social media analogy', 'mental health', 'urgency'],
    emotion: 'fearful',
    post_type: 'argument',
    importance: 0.82,
    core_claim:
      'Delaying AI regulation risks repeating the social media mistake at a larger scale.',
    assumptions: ['Social media was under-regulated', 'AI risks are greater than social media risks'],
    evidence_cited: ['Teen mental health crisis linked to social media'],
    logical_chain: {
      builds_on: [],
      root_assumption: 'precaution_principle',
      chain_depth: 0,
    },
    perceived_by: {
      innovation_forward: { relevance: 0.5, framing: 'Fear-mongering comparison — AI and social media are completely different' },
      pragmatic_middle: { relevance: 0.7, framing: 'The analogy has merit even if imperfect' },
    },
    embedding_hint: { opinion_axis: -0.8, abstraction: 0.3, novelty: 0.3 },
    relationships: [
      { target_id: 'p01', type: 'agrees', strength: 0.7, reason: 'Both advocate for proactive regulation' },
      { target_id: 'p06', type: 'disagrees', strength: 0.6, reason: 'Counters the idea that market forces suffice' },
    ],
    position: [-6.1, -1.0, -0.7],
  },
  {
    id: 'p14',
    content:
      'I work in AI safety research. The people building these systems are terrified of what they\'re creating. When the engineers themselves are begging for regulation, maybe we should listen? OpenAI, DeepMind, Anthropic — they\'ve all called for governance frameworks.',
    author: 'safety_researcher_throwaway',
    parent_id: 'p13',
    depth: 1,
    upvotes: 731,
    stance: 'pro-regulation',
    themes: ['insider perspective', 'AI safety', 'industry calls for regulation'],
    emotion: 'passionate',
    post_type: 'evidence',
    importance: 0.9,
    core_claim:
      'AI developers themselves recognize the need for regulation, lending credibility to the cause.',
    assumptions: ['Industry insiders have accurate risk assessments', 'Companies are sincere in their calls for regulation'],
    evidence_cited: ['AI safety research community', 'Public statements from OpenAI, DeepMind, Anthropic'],
    logical_chain: {
      builds_on: ['p13'],
      root_assumption: 'precaution_principle',
      chain_depth: 1,
    },
    perceived_by: {
      innovation_forward: { relevance: 0.6, framing: 'Regulatory capture — big companies want regulation to block competitors' },
      pragmatic_middle: { relevance: 0.85, framing: 'Insider testimony is compelling but watch for corporate motives' },
    },
    embedding_hint: { opinion_axis: -0.75, abstraction: 0.2, novelty: 0.5 },
    relationships: [
      { target_id: 'p13', type: 'builds_upon', strength: 0.8, reason: 'Adds insider evidence to the urgency argument' },
      { target_id: 'p05', type: 'disagrees', strength: 0.6, reason: 'Counters the narrative that regulation kills innovation' },
    ],
    position: [-4.8, -0.3, -1.2],
  },

  // ────── Cluster 2: Innovation Forward (anti-regulation) ──────
  {
    id: 'p04',
    content:
      'Every single time the government tries to regulate technology, they get it wrong. Remember the encryption wars? SOPA/PIPA? The "series of tubes" internet regulation? These are the people you want writing AI policy? Hard pass.',
    author: 'techno_optimist_99',
    parent_id: null,
    depth: 0,
    upvotes: 623,
    stance: 'anti-regulation',
    themes: ['government incompetence', 'historical failures', 'tech exceptionalism'],
    emotion: 'sarcastic',
    post_type: 'argument',
    importance: 0.87,
    core_claim:
      'Government has a track record of failing to regulate technology correctly.',
    assumptions: ['Past regulatory failures predict future failures', 'Technology is too complex for regulators'],
    evidence_cited: ['Crypto wars', 'SOPA/PIPA', 'Ted Stevens "series of tubes"'],
    logical_chain: {
      builds_on: [],
      root_assumption: 'gov_cant_regulate',
      chain_depth: 0,
    },
    perceived_by: {
      safety_first: { relevance: 0.75, framing: 'Cherry-picks failures, ignores FDA/FAA successes' },
      pragmatic_middle: { relevance: 0.7, framing: 'Valid concern about competence, but throwing out all regulation is extreme' },
    },
    embedding_hint: { opinion_axis: 0.8, abstraction: 0.3, novelty: 0.2 },
    relationships: [
      { target_id: 'p01', type: 'rebuts', strength: 0.85, reason: 'Directly challenges the regulatory precedent argument' },
      { target_id: 'p05', type: 'builds_upon', strength: 0.5, reason: 'Both argue against regulation' },
    ],
    position: [5.3, 0.6, -0.4],
  },
  {
    id: 'p05',
    content:
      'The US leads in AI BECAUSE of light regulation. China is catching up fast. If we hamstring our companies with bureaucratic red tape, we hand the future to authoritarian regimes who will develop AI without any ethical considerations whatsoever. Is that what you want?',
    author: 'geopolitical_realist',
    parent_id: 'p04',
    depth: 1,
    upvotes: 445,
    stance: 'anti-regulation',
    themes: ['competition', 'geopolitics', 'China threat', 'national security'],
    emotion: 'aggressive',
    post_type: 'argument',
    importance: 0.84,
    core_claim:
      'Regulation would cede AI leadership to authoritarian competitors.',
    assumptions: ['US AI dominance is due to light regulation', 'China would fill the gap', 'Light regulation means no ethics'],
    evidence_cited: ['US-China AI competition', 'National security implications'],
    logical_chain: {
      builds_on: ['p04'],
      root_assumption: 'market_self_corrects',
      chain_depth: 1,
    },
    perceived_by: {
      safety_first: { relevance: 0.6, framing: 'Uses fear of China to justify zero accountability — false dichotomy' },
      pragmatic_middle: { relevance: 0.75, framing: 'Geopolitical competition is real but not a reason for zero regulation' },
    },
    embedding_hint: { opinion_axis: 0.85, abstraction: 0.5, novelty: 0.3 },
    relationships: [
      { target_id: 'p04', type: 'builds_upon', strength: 0.6, reason: 'Adds geopolitical dimension to anti-regulation stance' },
      { target_id: 'p14', type: 'disagrees', strength: 0.7, reason: 'Counters insider calls for regulation as naive' },
    ],
    position: [5.8, -0.5, 0.8],
  },
  {
    id: 'p06',
    content:
      'The market will self-correct. Companies that deploy harmful AI will lose customers, face lawsuits, and get destroyed in the press. We don\'t need Congress for that. Reputation is the strongest regulator.',
    author: 'invisible_hand_fan',
    parent_id: null,
    depth: 0,
    upvotes: 298,
    stance: 'anti-regulation',
    themes: ['market forces', 'self-regulation', 'reputation'],
    emotion: 'analytical',
    post_type: 'argument',
    importance: 0.72,
    core_claim: 'Market forces and reputational risk are sufficient to govern AI behavior.',
    assumptions: ['Consumers can detect harmful AI', 'Lawsuits are an effective deterrent', 'Market signals are fast enough'],
    evidence_cited: [],
    logical_chain: {
      builds_on: [],
      root_assumption: 'market_self_corrects',
      chain_depth: 0,
    },
    perceived_by: {
      safety_first: { relevance: 0.7, framing: 'Worked great for social media /s — see teen mental health crisis' },
      pragmatic_middle: { relevance: 0.6, framing: 'Market forces work but too slowly for existential risks' },
    },
    embedding_hint: { opinion_axis: 0.7, abstraction: 0.6, novelty: 0.1 },
    relationships: [
      { target_id: 'p03', type: 'disagrees', strength: 0.6, reason: 'Anecdote directly counters self-correction narrative' },
      { target_id: 'p13', type: 'disagrees', strength: 0.5, reason: 'Opposes the precautionary urgency' },
    ],
    position: [4.5, 1.3, -0.6],
  },
  {
    id: 'p07',
    content:
      'lmao imagine thinking the same government that can\'t even update their own websites from the 90s is gonna write good AI law. My local DMV still runs on COBOL. But sure, let\'s let them decide the future of machine learning.',
    author: 'cynical_dev_42',
    parent_id: 'p04',
    depth: 1,
    upvotes: 1876,
    stance: 'anti-regulation',
    themes: ['government incompetence', 'humor', 'tech literacy gap'],
    emotion: 'sarcastic',
    post_type: 'rebuttal',
    importance: 0.68,
    core_claim: 'Government lacks the technical competence to regulate AI.',
    assumptions: ['Technical competence is required for regulation', 'Government IT failures predict policy failures'],
    evidence_cited: ['Government website quality', 'DMV systems running COBOL'],
    logical_chain: {
      builds_on: ['p04'],
      root_assumption: 'gov_cant_regulate',
      chain_depth: 1,
    },
    perceived_by: {
      safety_first: { relevance: 0.4, framing: 'Funny but logically weak — regulators hire experts, they don\'t code themselves' },
      pragmatic_middle: { relevance: 0.5, framing: 'The competence gap is real but solvable with proper advisory structures' },
    },
    embedding_hint: { opinion_axis: 0.6, abstraction: -0.3, novelty: 0.4 },
    relationships: [
      { target_id: 'p04', type: 'builds_upon', strength: 0.7, reason: 'Doubles down on government incompetence angle' },
      { target_id: 'p03', type: 'tangent', strength: 0.3, reason: 'Both highlight institutional failures, but different institutions' },
    ],
    position: [5.0, 0.2, 1.5],
  },
  {
    id: 'p15',
    content:
      'Open source AI is the answer, not regulation. When anyone can inspect the model, audit the weights, and fork the code, you get natural accountability without bureaucracy. Transparency through openness beats transparency through paperwork.',
    author: 'foss_maximalist',
    parent_id: 'p06',
    depth: 1,
    upvotes: 367,
    stance: 'anti-regulation',
    themes: ['open source', 'transparency', 'community governance'],
    emotion: 'hopeful',
    post_type: 'argument',
    importance: 0.76,
    core_claim:
      'Open-source AI provides natural accountability that makes formal regulation unnecessary.',
    assumptions: ['Open source can be applied to all AI', 'Community auditing is effective', 'Companies will open-source willingly'],
    evidence_cited: ['Open source software movement', 'Community auditing models'],
    logical_chain: {
      builds_on: ['p06'],
      root_assumption: 'tech_is_neutral',
      chain_depth: 1,
    },
    perceived_by: {
      safety_first: { relevance: 0.5, framing: 'Not all AI will be open source — largest models are proprietary' },
      pragmatic_middle: { relevance: 0.7, framing: 'Complementary to regulation, not a replacement' },
    },
    embedding_hint: { opinion_axis: 0.5, abstraction: 0.4, novelty: 0.5 },
    relationships: [
      { target_id: 'p06', type: 'builds_upon', strength: 0.5, reason: 'Proposes a specific mechanism for market self-correction' },
      { target_id: 'p02', type: 'disagrees', strength: 0.4, reason: 'Prefers community governance over institutional regulation' },
    ],
    position: [6.0, -1.0, -0.3],
  },

  // ────── Cluster 3: Pragmatic Middle (conditional) ──────
  {
    id: 'p08',
    content:
      'Hot take: both sides are arguing past each other. The "regulate everything" crowd ignores implementation complexity. The "regulate nothing" crowd ignores real harms. We need narrow, targeted rules for high-stakes AI (healthcare, criminal justice, finance) and a lighter touch for everything else.',
    author: 'nuance_enjoyer',
    parent_id: null,
    depth: 0,
    upvotes: 956,
    stance: 'conditional-regulation',
    themes: ['nuance', 'targeted regulation', 'high-stakes domains'],
    emotion: 'analytical',
    post_type: 'argument',
    importance: 0.93,
    core_claim:
      'We need targeted regulation for high-stakes AI domains, not blanket rules.',
    assumptions: ['High-stakes and low-stakes AI can be distinguished', 'Targeted regulation is feasible'],
    evidence_cited: [],
    logical_chain: {
      builds_on: [],
      root_assumption: 'targeted_approach',
      chain_depth: 0,
    },
    perceived_by: {
      safety_first: { relevance: 0.8, framing: 'Reasonable but might leave gaps — who decides what\'s high-stakes?' },
      innovation_forward: { relevance: 0.7, framing: 'Better than blanket regulation but still a slippery slope' },
    },
    embedding_hint: { opinion_axis: 0.0, abstraction: 0.7, novelty: 0.5 },
    relationships: [
      { target_id: 'p01', type: 'builds_upon', strength: 0.4, reason: 'Accepts the regulation premise but narrows the scope' },
      { target_id: 'p04', type: 'builds_upon', strength: 0.3, reason: 'Acknowledges the competence concern' },
    ],
    position: [0.3, 3.5, 2.2],
  },
  {
    id: 'p09',
    content:
      'I keep seeing people compare AI regulation to other industries, but there\'s a key difference nobody\'s talking about: AI is a general-purpose technology. Regulating "AI" is like trying to regulate "electricity" or "mathematics." You have to regulate specific applications, not the technology itself.',
    author: 'cs_prof_emeritus',
    parent_id: 'p08',
    depth: 1,
    upvotes: 678,
    stance: 'conditional-regulation',
    themes: ['general purpose technology', 'application-specific regulation', 'definitional challenge'],
    emotion: 'analytical',
    post_type: 'argument',
    importance: 0.88,
    core_claim:
      'AI is a general-purpose technology and must be regulated at the application level, not the technology level.',
    assumptions: ['GPTs cannot be regulated as a whole', 'Application-level regulation is feasible'],
    evidence_cited: ['Comparison to electricity regulation', 'General-purpose technology theory'],
    logical_chain: {
      builds_on: ['p08'],
      root_assumption: 'targeted_approach',
      chain_depth: 1,
    },
    perceived_by: {
      safety_first: { relevance: 0.7, framing: 'Fair distinction, but some foundation-model-level rules are still needed' },
      innovation_forward: { relevance: 0.8, framing: 'Good framing — shows why blanket regulation fails' },
    },
    embedding_hint: { opinion_axis: 0.1, abstraction: 0.8, novelty: 0.6 },
    relationships: [
      { target_id: 'p08', type: 'builds_upon', strength: 0.8, reason: 'Provides theoretical framework for targeted regulation' },
      { target_id: 'p02', type: 'agrees', strength: 0.5, reason: 'Both favor structured, categorized approaches' },
    ],
    position: [-0.4, 2.8, 1.6],
  },
  {
    id: 'p10',
    content:
      'What if instead of traditional regulation, we created an "AI FDA" — an independent technical agency with actual ML engineers, not just lawyers? Fund it properly, give it teeth, but staff it with people who understand the technology. Best of both worlds?',
    author: 'pragmatic_policy_nerd',
    parent_id: 'p08',
    depth: 1,
    upvotes: 534,
    stance: 'conditional-regulation',
    themes: ['institutional design', 'technical expertise', 'AI agency'],
    emotion: 'hopeful',
    post_type: 'argument',
    importance: 0.86,
    core_claim:
      'A dedicated AI regulatory agency staffed with technical experts could bridge the competence gap.',
    assumptions: ['Technical experts would agree to work for government', 'Dedicated agency would be better than existing bodies'],
    evidence_cited: ['FDA model', 'Specialized regulatory agencies'],
    logical_chain: {
      builds_on: ['p08', 'p04'],
      root_assumption: 'gov_can_regulate',
      chain_depth: 2,
    },
    perceived_by: {
      safety_first: { relevance: 0.9, framing: 'Great idea — an FDA for AI would be transformative' },
      innovation_forward: { relevance: 0.6, framing: 'Would inevitably get captured by big tech or become another bloated agency' },
    },
    embedding_hint: { opinion_axis: -0.15, abstraction: 0.5, novelty: 0.7 },
    relationships: [
      { target_id: 'p08', type: 'builds_upon', strength: 0.7, reason: 'Proposes a concrete implementation of targeted regulation' },
      { target_id: 'p07', type: 'rebuts', strength: 0.6, reason: 'Addresses the technical competence criticism directly' },
    ],
    position: [0.8, 3.8, 2.8],
  },

  // ────── Bridge posts (between clusters) ──────
  {
    id: 'p11',
    content:
      'I work at a mid-size AI startup. Honestly? I\'d welcome *some* regulation. Right now the big players (Google, Microsoft, OpenAI) set the de facto standards. Clear rules would actually level the playing field — we\'d know what to build toward instead of guessing what\'s acceptable. The uncertainty is the real innovation killer, not regulation itself.',
    author: 'startup_founder_anon',
    parent_id: 'p05',
    depth: 2,
    upvotes: 423,
    stance: 'conditional-regulation',
    themes: ['startup perspective', 'level playing field', 'regulatory certainty', 'competition'],
    emotion: 'empathetic',
    post_type: 'anecdote',
    importance: 0.89,
    core_claim:
      'Regulatory certainty helps startups more than a wild west, where big companies set de facto rules.',
    assumptions: ['Startups are currently disadvantaged by uncertainty', 'Clear rules create fair competition'],
    evidence_cited: ['Personal startup experience', 'Big tech de facto standard-setting'],
    logical_chain: {
      builds_on: ['p05', 'p08'],
      root_assumption: 'targeted_approach',
      chain_depth: 2,
    },
    perceived_by: {
      safety_first: { relevance: 0.8, framing: 'Great point — even industry wants clarity' },
      innovation_forward: { relevance: 0.85, framing: 'Interesting counterpoint from inside the industry' },
    },
    embedding_hint: { opinion_axis: -0.1, abstraction: 0.1, novelty: 0.65 },
    relationships: [
      { target_id: 'p05', type: 'rebuts', strength: 0.7, reason: 'Challenges the assumption that regulation kills startups' },
      { target_id: 'p08', type: 'agrees', strength: 0.6, reason: 'Supports the targeted regulation middle ground' },
      { target_id: 'p04', type: 'disagrees', strength: 0.4, reason: 'Pushes back on blanket anti-regulation stance' },
    ],
    position: [2.5, 2.0, 1.5],
  },
  {
    id: 'p12',
    content:
      'Reading this whole thread and I think everyone\'s missing something: the real question isn\'t "should we regulate AI" — it\'s "CAN we regulate AI fast enough to matter?" The technology moves in months, legislation moves in years. Maybe we need adaptive regulation that evolves with the tech, like how cybersecurity standards work.',
    author: 'meta_commenter',
    parent_id: null,
    depth: 0,
    upvotes: 389,
    stance: 'conditional-regulation',
    themes: ['pace of change', 'adaptive regulation', 'meta-discussion', 'cybersecurity analogy'],
    emotion: 'analytical',
    post_type: 'meta',
    importance: 0.91,
    core_claim:
      'Traditional regulation is too slow for AI; we need adaptive regulatory mechanisms.',
    assumptions: ['AI development pace outstrips legislation', 'Adaptive frameworks are possible'],
    evidence_cited: ['Cybersecurity standards evolution', 'NIST framework model'],
    logical_chain: {
      builds_on: ['p04', 'p01'],
      root_assumption: 'targeted_approach',
      chain_depth: 1,
    },
    perceived_by: {
      safety_first: { relevance: 0.8, framing: 'Agrees regulation is needed but raises valid speed concern' },
      innovation_forward: { relevance: 0.75, framing: 'Good framing — at least acknowledges the speed mismatch' },
    },
    embedding_hint: { opinion_axis: 0.05, abstraction: 0.85, novelty: 0.8 },
    relationships: [
      { target_id: 'p01', type: 'builds_upon', strength: 0.4, reason: 'Accepts the regulation premise' },
      { target_id: 'p04', type: 'builds_upon', strength: 0.4, reason: 'Acknowledges the speed/competence problem' },
      { target_id: 'p09', type: 'agrees', strength: 0.6, reason: 'Both advocate for nuanced, targeted approaches' },
    ],
    position: [-1.5, 2.5, 1.0],
  },
  {
    id: 'p16',
    content:
      'Has anyone here actually read a proposed AI regulation bill? I went through the AIDA text line by line. 80% of it is reasonable stuff — disclosure requirements, impact assessments for high-risk uses, anti-discrimination audits. The remaining 20% is vague, sure, but that\'s true of every first draft. We can iterate.',
    author: 'actually_read_the_bill',
    parent_id: 'p12',
    depth: 1,
    upvotes: 287,
    stance: 'conditional-regulation',
    themes: ['specifics', 'bill analysis', 'iterative policy'],
    emotion: 'frustrated',
    post_type: 'evidence',
    importance: 0.78,
    core_claim:
      'Proposed AI regulations are mostly reasonable when you actually read them.',
    assumptions: ['People criticize regulation without reading proposals', 'Legislation can be iteratively improved'],
    evidence_cited: ['AIDA bill text', 'Specific provisions: disclosure, impact assessments, audits'],
    logical_chain: {
      builds_on: ['p12', 'p02'],
      root_assumption: 'gov_can_regulate',
      chain_depth: 2,
    },
    perceived_by: {
      safety_first: { relevance: 0.85, framing: 'Thank you — finally someone who reads before opining' },
      innovation_forward: { relevance: 0.6, framing: 'The 20% vague part is where all the damage happens' },
    },
    embedding_hint: { opinion_axis: -0.2, abstraction: 0.2, novelty: 0.5 },
    relationships: [
      { target_id: 'p12', type: 'builds_upon', strength: 0.6, reason: 'Adds concrete specifics to the adaptive regulation idea' },
      { target_id: 'p04', type: 'rebuts', strength: 0.5, reason: 'Counters the blanket incompetence claim with specifics' },
      { target_id: 'p02', type: 'agrees', strength: 0.6, reason: 'Both support structured regulatory frameworks' },
    ],
    position: [-0.8, 3.2, 3.0],
  },
]

// ═══ Clusters ═══

const clusters: Cluster[] = [
  {
    id: 'safety_first',
    label: 'Safety First',
    center: [-5, 0, 0],
    summary:
      'Advocates for proactive regulation, citing precedent from other industries (FDA, FAA) and real-world algorithmic harms. Emphasizes transparency, accountability, and the precautionary principle. Argues that waiting for harm is irresponsible.',
    post_ids: ['p01', 'p02', 'p03', 'p13', 'p14'],
    root_assumptions: ['gov_can_regulate', 'precaution_principle'],
    perceived_as: {
      innovation_forward: 'Fear-driven overreaction that will stifle progress',
      pragmatic_middle: 'Well-intentioned but sometimes over-broad in scope',
    },
  },
  {
    id: 'innovation_forward',
    label: 'Innovation Forward',
    center: [5, 0, 0],
    summary:
      'Opposes regulation on grounds of government incompetence, geopolitical competition, and faith in market forces. Believes open source and reputational pressure are better governance mechanisms than legislation.',
    post_ids: ['p04', 'p05', 'p06', 'p07', 'p15'],
    root_assumptions: ['gov_cant_regulate', 'market_self_corrects', 'tech_is_neutral'],
    perceived_as: {
      safety_first: 'Reckless techno-utopianism that ignores real harms',
      pragmatic_middle: 'Raises valid competence concerns but too absolutist',
    },
  },
  {
    id: 'pragmatic_middle',
    label: 'Pragmatic Middle',
    center: [0, 3, 2],
    summary:
      'Seeks targeted, application-specific regulation with technical expertise. Proposes adaptive frameworks, dedicated agencies, and acknowledges valid points from both sides. Emphasizes that regulatory certainty can actually benefit innovation.',
    post_ids: ['p08', 'p09', 'p10', 'p12', 'p16'],
    root_assumptions: ['targeted_approach', 'gov_can_regulate'],
    perceived_as: {
      safety_first: 'Reasonable but might not go far enough for urgent risks',
      innovation_forward: 'Better than blanket regulation but still a gateway to overreach',
    },
  },
]

// ═══ Gaps ═══

const gaps: Gap[] = [
  {
    position: [3, -3, -2],
    description: 'International coordination mechanisms',
    why_it_matters:
      'Nobody in this thread is discussing how different national regulations would interact. AI is global — a patchwork of national rules creates arbitrage opportunities and enforcement gaps. International treaties or harmonization frameworks are completely absent from this debate.',
  },
  {
    position: [-3, -3, 3],
    description: 'Voices of affected communities',
    why_it_matters:
      'The discussion is dominated by tech workers, policy wonks, and armchair analysts. Where are the communities most affected by AI decisions — low-income populations, minorities disproportionately impacted by algorithmic bias, workers displaced by automation? Their perspectives are almost entirely missing.',
  },
]

// ═══ Full Layout ═══

export const DEMO_LAYOUT: CosmosLayout = {
  topic: 'Should AI be regulated?',
  source: DEMO_URL,
  clusters,
  gaps,
  posts,
  bridge_posts: ['p11', 'p12'],
  spatial_summary:
    'The discussion forms three distinct constellations. The "Safety First" cluster (left) anchors around regulatory precedent and real-world harms. The "Innovation Forward" cluster (right) rallies around market forces and government incompetence. The "Pragmatic Middle" cluster (above) bridges the two with targeted, adaptive frameworks. Two bridge posts connect the camps — a startup founder who challenges the innovation-vs-regulation false dichotomy, and a meta-commentator who reframes the debate around regulatory speed. Notable gaps exist around international coordination and affected community voices.',
  metadata: {
    total_posts: 16,
    processing_time_ms: 4823,
    stance_labels: ['pro-regulation', 'anti-regulation', 'conditional-regulation'],
    theme_labels: [
      'safety',
      'precedent',
      'accountability',
      'EU AI Act',
      'risk-tiering',
      'proportionality',
      'transparency',
      'algorithmic harm',
      'government incompetence',
      'historical failures',
      'competition',
      'geopolitics',
      'market forces',
      'self-regulation',
      'humor',
      'open source',
      'nuance',
      'targeted regulation',
      'general purpose technology',
      'institutional design',
      'startup perspective',
      'adaptive regulation',
      'specifics',
      'precaution',
      'AI safety',
      'insider perspective',
    ],
    root_assumption_labels: [
      'gov_can_regulate',
      'gov_cant_regulate',
      'market_self_corrects',
      'tech_is_neutral',
      'precaution_principle',
      'targeted_approach',
    ],
  },
}
