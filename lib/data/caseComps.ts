// Case-Comp & B-Fest circuit data for the UPESphere Case Comp Calendar.
// Event facts (host, dates, prize pools, sub-events, registration windows) track
// real, publicly-run Indian college fests. Dates shift year-to-year — always
// verify on Unstop + the host's Instagram a few weeks out.

export type Track =
  | 'Consulting'
  | 'Entrepreneurship'
  | 'Finance'
  | 'Tech-Mgmt'
  | 'Management'
  | 'Economics'
  | 'Cultural'
  | 'Academic'

export type Institution = 'IIM' | 'IIT' | 'DU' | 'Other'

export interface CaseComp {
  id: string
  name: string
  host: string
  institution: Institution
  month: number // 1-12, primary calendar slot
  dateLabel: string
  prize?: string
  mustDo?: boolean
  watch: string
  regOpens: string
  tracks: Track[]
}

export const TRACKS: Track[] = [
  'Consulting',
  'Entrepreneurship',
  'Finance',
  'Tech-Mgmt',
  'Management',
  'Economics',
  'Cultural',
  'Academic',
]

export const INSTITUTIONS: Institution[] = ['IIM', 'IIT', 'DU', 'Other']

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Per-track accent colours, tuned to the UPESphere palette.
export const TRACK_STYLE: Record<Track, { text: string; bg: string; border: string; dot: string }> = {
  Consulting:       { text: 'text-indigo-300',  bg: 'bg-indigo-500/12',  border: 'border-indigo-500/25',  dot: 'bg-indigo-400' },
  Entrepreneurship: { text: 'text-fuchsia-300', bg: 'bg-fuchsia-500/12', border: 'border-fuchsia-500/25', dot: 'bg-fuchsia-400' },
  Finance:          { text: 'text-emerald-300', bg: 'bg-emerald-500/12', border: 'border-emerald-500/25', dot: 'bg-emerald-400' },
  'Tech-Mgmt':      { text: 'text-cyan-300',    bg: 'bg-cyan-500/12',    border: 'border-cyan-500/25',    dot: 'bg-cyan-400' },
  Management:       { text: 'text-violet-300',  bg: 'bg-violet-500/12',  border: 'border-violet-500/25',  dot: 'bg-violet-400' },
  Economics:       { text: 'text-amber-300',   bg: 'bg-amber-500/12',   border: 'border-amber-500/25',   dot: 'bg-amber-400' },
  Cultural:         { text: 'text-rose-300',    bg: 'bg-rose-500/12',    border: 'border-rose-500/25',    dot: 'bg-rose-400' },
  Academic:         { text: 'text-sky-300',     bg: 'bg-sky-500/12',     border: 'border-sky-500/25',     dot: 'bg-sky-400' },
}

export const INSTITUTION_STYLE: Record<Institution, { text: string; bg: string; border: string }> = {
  IIM:   { text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
  IIT:   { text: 'text-cyan-300',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/25' },
  DU:    { text: 'text-violet-300',  bg: 'bg-violet-500/10',  border: 'border-violet-500/25' },
  Other: { text: 'text-slate-300',   bg: 'bg-slate-500/10',   border: 'border-slate-500/25' },
}

export const CASE_COMPS: CaseComp[] = [
  // ── January ──────────────────────────────────────────────────────────────
  { id: 'shaastra', name: 'Shaastra', host: 'IIT Madras', institution: 'IIT', month: 1, dateLabel: 'Jan 2–6, 2026', regOpens: 'Mid-November', tracks: ['Tech-Mgmt', 'Entrepreneurship'],
    watch: 'Shaastra Summit (Digital Governance), IndustriAI Conference, NeuroHack, E-Contest, Robowars, Quantified Dilemma' },
  { id: 'elan-nvision', name: 'Elan & nVision', host: 'IIT Hyderabad', institution: 'IIT', month: 1, dateLabel: 'Jan 9–11, 2026', regOpens: 'Mid-November', tracks: ['Entrepreneurship', 'Tech-Mgmt', 'Cultural'],
    watch: 'Under 25 Summit (entrepreneurship), tech competitions, pro-nights. Moved from Feb to Jan for 2026.' },
  { id: 'dhruva', name: 'Dhruva', host: 'IIM Tiruchirappalli', institution: 'IIM', month: 1, dateLabel: 'Late Jan – early Feb', regOpens: 'Mid-December', tracks: ['Management', 'Cultural'],
    watch: 'Business + cultural events. Historically October, shifted to Jan–Feb in recent editions.' },
  { id: 'iima-esummit', name: 'IIMA Entrepreneurship Summit', host: 'IIM Ahmedabad', institution: 'IIM', month: 1, dateLabel: 'Mid-January', regOpens: 'Early December', tracks: ['Entrepreneurship'],
    watch: 'Pitch sessions, founder panels' },
  { id: 'unmaad', name: 'Unmaad', host: 'IIM Bangalore', institution: 'IIM', month: 1, dateLabel: 'Late Jan – early Feb', regOpens: 'Mid-December', tracks: ['Cultural'],
    watch: "IIM-B's flagship cultural fest — music, dance, drama, lit & quizzing. Strong management cross-overs (branding, marketing sub-events)." },

  // ── February ─────────────────────────────────────────────────────────────
  { id: 'ges', name: 'GES — Global Entrepreneurship Summit', host: 'IIT Kharagpur', institution: 'IIT', month: 2, dateLabel: 'Feb 7–9, 2025', prize: 'Empresario ₹1.2 Cr+', mustDo: true, regOpens: 'Early December', tracks: ['Entrepreneurship', 'Finance'],
    watch: 'Empresario (B-model comp), Global Trading League, R&D Symposium, Intern Carnival, Investor-Startup Connect' },
  { id: 'manfest-varchasva', name: 'Manfest-Varchasva', host: 'IIM Lucknow', institution: 'IIM', month: 2, dateLabel: 'Feb 7–9, 2025', mustDo: true, regOpens: 'Mid-December', tracks: ['Consulting', 'Finance', 'Management'],
    watch: "Young Leader's Programme, Leaders Express, ICICI Lombard / Pizza Hut / NPCI / StockGro case competitions" },
  { id: 'iris', name: 'IRIS', host: 'IIM Indore', institution: 'IIM', month: 2, dateLabel: 'Feb 14–16, 2025', regOpens: 'Mid-December', tracks: ['Management'],
    watch: 'Vivitsa (sustainability), Qmanji (quiz), Hackwise, Drona (mentorship), Pratibimb' },
  { id: 'esummit-iitk', name: 'E-Summit IIT Kanpur', host: 'IIT Kanpur', institution: 'IIT', month: 2, dateLabel: 'February', regOpens: 'Mid-December', tracks: ['Entrepreneurship', 'Finance'],
    watch: 'Pitch Premier, Beat the Market, Strategy Sprint, Blockchain & VC events' },
  { id: 'echoes', name: 'Echoes', host: 'IIM Kozhikode', institution: 'IIM', month: 2, dateLabel: 'Feb 7–9, 2025', regOpens: 'Mid-December', tracks: ['Cultural'],
    watch: 'Cultural pro-nights + management cross-overs' },
  { id: 'audacity', name: 'Audacity', host: 'IIM Udaipur', institution: 'IIM', month: 2, dateLabel: 'Feb 8–9, 2025', regOpens: 'Mid-December', tracks: ['Cultural', 'Management'],
    watch: 'Cultural + management events' },
  { id: 'advitiya', name: 'Advitiya', host: 'IIT Ropar', institution: 'IIT', month: 2, dateLabel: 'Feb 6–8, 2025', regOpens: 'Late December', tracks: ['Tech-Mgmt'],
    watch: 'Tech competitions, Robowars, hackathons' },
  { id: 'anwesha', name: 'Anwesha', host: 'IIT Patna', institution: 'IIT', month: 2, dateLabel: 'Feb 7–9, 2025', regOpens: 'Mid-December', tracks: ['Cultural', 'Tech-Mgmt'],
    watch: 'Techno-cultural events, dance/music + B-quizzes' },
  { id: 'arbitrage', name: 'Arbitrage', host: 'Ramjas College, DU', institution: 'DU', month: 2, dateLabel: 'Feb 17–18, 2026', regOpens: 'Mid-January', tracks: ['Consulting', 'Finance', 'Entrepreneurship'],
    watch: 'Caselympics 2.0, Vision à Valeur (B-Plan), Vertex (B&F Quiz), Business Revival' },
  { id: 'leconomiste', name: "L'Economiste", host: 'Hindu College, DU', institution: 'DU', month: 2, dateLabel: 'February', regOpens: 'Mid-January', tracks: ['Economics'],
    watch: 'Economics-society events; case discussions' },
  { id: 'convergence', name: 'Convergence', host: 'SRCC, DU', institution: 'DU', month: 2, dateLabel: 'February (varies)', regOpens: 'Mid-January', tracks: ['Consulting', 'Management'],
    watch: "SRCC Marketing Society's flagship — brand strategy, ad-making, marketing case challenges. Strong undergrad-accessible track." },

  // ── March ────────────────────────────────────────────────────────────────
  { id: 'techkriti', name: 'Techkriti', host: 'IIT Kanpur', institution: 'IIT', month: 3, dateLabel: 'Mar 27–30, 2025', prize: '₹1 Cr+ pool', mustDo: true, regOpens: 'Mid-February', tracks: ['Entrepreneurship', 'Finance', 'Tech-Mgmt'],
    watch: 'Pitch Premier, Beat the Market, Strategy Sprint, ML Hackathon (₹6L), Hack IITK (₹30L), Robowars, MUN, Rakshakriti' },
  { id: 'cognizance', name: 'Cognizance', host: 'IIT Roorkee', institution: 'IIT', month: 3, dateLabel: 'Mar 20–23, 2025', prize: '₹50L+ (2026)', regOpens: 'Late January', tracks: ['Tech-Mgmt'],
    watch: "Robowars, Codecode, hackathons, aerospace contests. Asia's 2nd largest student-run tech fest." },
  { id: 'tryst', name: 'Tryst', host: 'IIT Delhi', institution: 'IIT', month: 3, dateLabel: 'Feb 27 – Mar 1, 2026', regOpens: 'Mid-January', tracks: ['Tech-Mgmt', 'Management'],
    watch: '75+ events spanning science / tech / management; large-scale case comps; ~60,000 participants' },
  { id: 'technex', name: 'Technex', host: 'IIT (BHU) Varanasi', institution: 'IIT', month: 3, dateLabel: 'Mar 13–15, 2026', regOpens: 'Mid-January', tracks: ['Tech-Mgmt'],
    watch: "Robowars, Drone Tech, Hack It Out, Eco Hackathon, Corporate Conclave. 87th edition. Asia's oldest techno-mgmt fest." },
  { id: 'zeitgeist', name: 'Zeitgeist', host: 'IIT Ropar', institution: 'IIT', month: 3, dateLabel: 'Mar 13–15, 2025', regOpens: 'Mid-February', tracks: ['Cultural', 'Finance'],
    watch: 'Cultural pro-nights + finance / marketing sub-events' },
  { id: 'tarang', name: 'Tarang', host: 'Lady Shri Ram College, DU', institution: 'DU', month: 3, dateLabel: 'Mar 28–30, 2026', regOpens: 'Mid-February', tracks: ['Cultural'],
    watch: 'Cultural fest with departmental management events' },
  { id: 'confluence', name: 'Confluence', host: 'Hansraj College, DU', institution: 'DU', month: 3, dateLabel: 'Mar 28–30, 2025', regOpens: 'Mid-February', tracks: ['Cultural'],
    watch: 'LitFest, Rachnotsav, Allure' },
  { id: 'srcc-conclave', name: 'SRCC Business Conclave', host: 'SRCC, DU', institution: 'DU', month: 3, dateLabel: 'Mar 7–8, 2025', regOpens: 'Mid-February', tracks: ['Consulting', 'Finance'],
    watch: 'The Shri Ram Case Competition, The Big Sho(r)t' },
  { id: 'moksha-innovision', name: 'Moksha-Innovision', host: 'NSUT, Delhi', institution: 'Other', month: 3, dateLabel: 'March', regOpens: 'Mid-February', tracks: ['Cultural', 'Tech-Mgmt'],
    watch: 'Cultural + tech competitions, E-Summit-style verticals. 4-day fest.' },
  { id: 'business-leadership-summit', name: 'Business Leadership Summit', host: 'IIM Shillong', institution: 'IIM', month: 3, dateLabel: 'March', regOpens: 'Late February', tracks: ['Consulting', 'Management'],
    watch: 'Leadership panels, case comps' },
  { id: 'crossroads', name: 'Crossroads', host: 'SRCC, DU', institution: 'DU', month: 3, dateLabel: 'Mar 18–20, 2026', regOpens: 'Late January', tracks: ['Cultural'],
    watch: 'Cultural fest with department sub-events. Date has drifted Feb → Apr → Mar.' },

  // ── April ────────────────────────────────────────────────────────────────
  { id: 'shri-ram-eco-summit', name: 'Shri Ram Economics Summit', host: 'SRCC, DU', institution: 'DU', month: 4, dateLabel: 'Apr 7–8, 2025', regOpens: 'Mid-March', tracks: ['Economics', 'Consulting'],
    watch: 'Shri Ram Case Conundrum, National Economics Olympiad' },
  { id: 'renaissance', name: 'Renaissance', host: 'Kirori Mal College, DU', institution: 'DU', month: 4, dateLabel: 'Apr 17–18, 2025', regOpens: 'Mid-March', tracks: ['Cultural'],
    watch: 'Cultural pro-nights + commerce society events' },
  { id: 'exodia', name: 'Exodia', host: 'IIT Mandi', institution: 'IIT', month: 4, dateLabel: 'Apr 18–20, 2025', regOpens: 'Mid-March', tracks: ['Cultural'],
    watch: 'Cultural + tech sub-events' },
  { id: 'tempest', name: 'Tempest', host: 'Miranda House, DU', institution: 'DU', month: 4, dateLabel: 'Mar–Apr', regOpens: 'Mid-March', tracks: ['Cultural'],
    watch: 'Cultural fest with society-level competitions' },
  { id: 'ignus', name: 'Ignus', host: 'IIT Jodhpur', institution: 'IIT', month: 4, dateLabel: 'March–April', regOpens: 'Mid-March', tracks: ['Cultural'],
    watch: 'Socio-cultural events' },

  // ── August ───────────────────────────────────────────────────────────────
  { id: 'venix', name: 'Venix', host: 'IIM Bangalore', institution: 'IIM', month: 8, dateLabel: 'Aug 1–3, 2025', prize: '₹12.5L+ pool', mustDo: true, regOpens: 'Mid-June', tracks: ['Consulting', 'Entrepreneurship', 'Finance'],
    watch: 'The Fifth Move, C-Suite, Data Analytics Challenge, Young Entrepreneurs Summit, Young Leaders Summit. Theme: Vision. Venture. Victory.' },
  { id: 'i5-summit', name: 'i5 Summit', host: 'IIT + IIM Indore (joint)', institution: 'IIT', month: 8, dateLabel: 'Late August onwards', regOpens: 'Mid-July', tracks: ['Entrepreneurship'],
    watch: "Pitch competitions, B-plan, ideathons. Central India's largest E-summit." },

  // ── September ────────────────────────────────────────────────────────────
  { id: 'techniche', name: 'Techniche', host: 'IIT Guwahati', institution: 'IIT', month: 9, dateLabel: 'Sep 20–22, 2025', regOpens: 'Late June', tracks: ['Tech-Mgmt'],
    watch: 'Robowars, Aqua Wars, Nexus & Lecture Series, Legacy (esports), industrial conclaves' },
  { id: 'emerge', name: 'Emerge', host: 'IIM Shillong', institution: 'IIM', month: 9, dateLabel: 'Mid-September', regOpens: 'Early August', tracks: ['Entrepreneurship'],
    watch: 'Entrepreneurship Summit pitching, startup panels' },
  { id: 'utkarsh', name: 'Utkarsh', host: 'IIT Mandi', institution: 'IIT', month: 9, dateLabel: 'September', regOpens: 'Early August', tracks: ['Tech-Mgmt'],
    watch: 'Tech competitions, hackathons (some editions in November)' },
  { id: 'ignite-180', name: 'Ignite 180', host: 'Kirori Mal College, DU', institution: 'DU', month: 9, dateLabel: 'September–October', mustDo: true, regOpens: 'Mid-August', tracks: ['Consulting'],
    watch: 'Consulting case competition — the earliest national-scale consulting comp accessible to DU undergrads.' },

  // ── October ──────────────────────────────────────────────────────────────
  { id: 'red-brick-summit', name: 'The Red Brick Summit', host: 'IIM Ahmedabad', institution: 'IIM', month: 10, dateLabel: 'Oct 3–5, 2025', mustDo: true, regOpens: 'Late August', tracks: ['Consulting', 'Management'],
    watch: "Parivartan (CSR/case), TRBS Quiz, Can You Sell This?, BCG 'Unboxing Consulting', policy & geopolitics panels. 20,000+ Unstop regs." },
  { id: 'horizons', name: 'Horizons', host: 'IIM Kozhikode', institution: 'IIM', month: 10, dateLabel: 'Oct 19–20, 2024', regOpens: 'Mid-September', tracks: ['Management'],
    watch: 'Management conclave, sectoral discussions' },
  { id: 'khlurthma', name: 'Khlurthma', host: 'IIM Shillong', institution: 'IIM', month: 10, dateLabel: 'Mid-October', regOpens: 'Early September', tracks: ['Management', 'Consulting'],
    watch: 'Business case competitions' },
  { id: 'advaita', name: 'Advaita', host: 'ISB Hyderabad + Mohali', institution: 'Other', month: 10, dateLabel: 'October', regOpens: 'Late August', tracks: ['Consulting', 'Management'],
    watch: 'Consilium (consulting), Mercado (retail), C-Suite (best CEO), Beat the Clock (B-quiz)' },
  { id: 'econvista', name: 'Econvista 2.0', host: 'LSR, DU', institution: 'DU', month: 10, dateLabel: 'Oct 14–15, 2025', regOpens: 'Mid-September', tracks: ['Economics', 'Academic'],
    watch: 'Academic-economics conference' },
  { id: 'atharv-ranbhoomi', name: 'Atharv Ranbhoomi', host: 'IIM Indore (IPM)', institution: 'IIM', month: 10, dateLabel: 'Oct 31 – Nov 2, 2025', mustDo: true, regOpens: 'Mid-September', tracks: ['Entrepreneurship', 'Finance', 'Consulting'],
    watch: 'The only UG-driven flagship across IIMs — B-plan, marketing, finance comps' },

  // ── November ─────────────────────────────────────────────────────────────
  { id: 'ensemble-valhalla', name: 'Ensemble-Valhalla', host: 'XLRI Jamshedpur', institution: 'Other', month: 11, dateLabel: 'Nov 15–17, 2025', mustDo: true, regOpens: 'Late September', tracks: ['Consulting', 'Management'],
    watch: 'The Next Gen Leader, Circus Maximus, Strategikon, War of Wits, Helios, Tech Tack, Societas. 60+ events, 30,000+ footfall.' },
  { id: '7-lakes-fest', name: '7 Lakes Fest', host: 'IIM Calcutta', institution: 'IIM', month: 11, dateLabel: 'Nov 15–17, 2024', mustDo: true, regOpens: 'Late September', tracks: ['Consulting', 'Management', 'Finance'],
    watch: 'Olympus, Marketplace, Lord of Sales, Bizworth, Consulting Knights, Empires of the Mind, Launchpad, Sociopreneur' },
  { id: 'amalthea', name: 'Amalthea', host: 'IIT Gandhinagar', institution: 'IIT', month: 11, dateLabel: 'Nov 9–10, 2024', regOpens: 'Mid-September', tracks: ['Tech-Mgmt'],
    watch: 'Conclave, Symposium, Tech Expo (ISRO / Indian Army / Dronelab), Networking Dinner' },
  { id: 'backwaters', name: 'Backwaters', host: 'IIM Kozhikode', institution: 'IIM', month: 11, dateLabel: 'Nov 15–17, 2024', mustDo: true, regOpens: 'Mid-September', tracks: ['Consulting', 'Entrepreneurship', 'Management'],
    watch: 'InQuizzitive (quiz), Kotler Sutra (marketing), White Knight (national B-plan), Avatar: The Ultimate CEO, MUN, Healthcare Summit' },

  // ── December ─────────────────────────────────────────────────────────────
  { id: 'esummit-eureka', name: 'E-Summit (Eureka!)', host: 'IIT Bombay', institution: 'IIT', month: 12, dateLabel: 'Dec 11–12, 2025', prize: 'Eureka! ₹2 Cr', mustDo: true, regOpens: 'Mid-October', tracks: ['Entrepreneurship'],
    watch: "Eureka! — Asia's largest business model competition; 28th edition; 25,000+ entries last year; access to 50+ leading VC firms. Plus Entre-MUN, Summit Chapters." },
  { id: 'techfest', name: 'Techfest', host: 'IIT Bombay', institution: 'IIT', month: 12, dateLabel: 'Dec 21–24, 2025', regOpens: 'Mid-October', tracks: ['Tech-Mgmt'],
    watch: "Asia's largest sci-tech festival; Robowars, International Humanoid Summit (debut 2025), Techfest World MUN, AI/ML/IoT workshops" },
  { id: 'imrc', name: 'IMRC — India Mgmt Research Conf.', host: 'IIM Ahmedabad', institution: 'IIM', month: 12, dateLabel: 'Dec 5–7, 2025', regOpens: 'Late August', tracks: ['Academic'],
    watch: 'Research-paper presentations. Academic flagship — not a student case comp.' },
]

// ── Big picture: seasonal clusters ────────────────────────────────────────
export interface Cluster {
  tag: string
  window: string
  tone: 'peak' | 'quiet'
  body: string
}

export const CLUSTERS: Cluster[] = [
  { tag: 'Cluster 1', window: 'Jan–Apr', tone: 'peak',
    body: 'IRIS, Manfest-Varchasva, GES, Technex, Techkriti, Cognizance, Shaastra and nearly every DU society fest land here. The densest, highest-stakes stretch of the year.' },
  { tag: 'The Drought', window: 'May–Jul', tone: 'quiet',
    body: 'End-sem exams and the summer break stall the flagship physical fests. Use it for solo Unstop comps, internships, and prepping submissions for the August restart.' },
  { tag: 'Cluster 2', window: 'Aug–Dec', tone: 'peak',
    body: "Venix, Techniche, Red Brick Summit, Atharv Ranbhoomi, Ensemble-Valhalla, 7 Lakes Fest and Eureka! (₹2 Cr) at IIT-B's E-Summit. The B-school and start-up heavy half." },
]

export type HeatLevel = 'peak' | 'busy' | 'builds' | 'quiet'

export const HEAT_MAP: { month: string; level: HeatLevel }[] = [
  { month: 'JAN', level: 'peak' },
  { month: 'FEB', level: 'peak' },
  { month: 'MAR', level: 'peak' },
  { month: 'APR', level: 'busy' },
  { month: 'MAY', level: 'quiet' },
  { month: 'JUN', level: 'quiet' },
  { month: 'JUL', level: 'quiet' },
  { month: 'AUG', level: 'builds' },
  { month: 'SEP', level: 'builds' },
  { month: 'OCT', level: 'peak' },
  { month: 'NOV', level: 'peak' },
  { month: 'DEC', level: 'peak' },
]

// Single-hue intensity ramp: hotter month = more saturated / more solid.
// Peak is a solid gradient with white text so it dominates in light *and* dark.
export const HEAT_STYLE: Record<HeatLevel, { label: string; cell: string; text: string; sub: string }> = {
  peak:   { label: 'Peak — register early', cell: 'bg-gradient-to-br from-indigo-500 to-violet-600 border-transparent shadow-lg shadow-indigo-500/30 ring-1 ring-inset ring-white/15', text: 'text-white', sub: 'text-white/80' },
  busy:   { label: 'Busy / building up',    cell: 'bg-indigo-500/30 border-indigo-400/45',                                                                                        text: 'text-indigo-700 dark:text-indigo-100', sub: 'text-indigo-600/80 dark:text-indigo-200/70' },
  builds: { label: 'Building up',           cell: 'bg-cyan-500/25 border-cyan-400/50',                                                                                            text: 'text-cyan-700 dark:text-cyan-200', sub: 'text-cyan-600/80 dark:text-cyan-200/70' },
  quiet:  { label: 'Quiet — off-season',    cell: 'bg-black/[0.03] border-black/10 dark:bg-white/[0.04] dark:border-white/10',                                                     text: 'text-slate-500 dark:text-muted-foreground', sub: 'text-slate-400 dark:text-muted-foreground/70' },
}

// ── Lead time: when to hit register ───────────────────────────────────────
export interface LeadTime {
  format: string
  examples: string
  timing: string
}

export const LEAD_TIMES: LeadTime[] = [
  { format: 'Multi-round national case comps', examples: 'Eureka!, Empresario, Strategikon, The Fifth Move, Pitch Premier, Olympus',
    timing: 'Listings go live 6–8 weeks before. Round-1 PPT deadlines fall 3–4 weeks before the main event.' },
  { format: 'B-plan / start-up pitching', examples: 'Eureka! (IITB), Empresario (KGP), Pitch Premier (IITK), Boardroom (IIT Indore)',
    timing: 'Round-1 deck submissions open 8–10 weeks ahead — mentorship rounds are layered in early.' },
  { format: 'Online quiz + on-campus final', examples: 'Bizzathlon, Kotler Sutra, Marketplace, Beat the Market',
    timing: 'Registration opens 3–5 weeks before. Round-1 quiz fires 2–3 weeks before finals.' },
  { format: 'DU society case comps', examples: 'Shri Ram Case Competition, Ramjas Caselympics, KMC Ignite 180',
    timing: "Posted 3–4 weeks before and close fast. Set Unstop alerts on each society's page." },
]

// ── Watchlist: 16 must-monitor events, chronological ──────────────────────
export const WATCHLIST: { name: string; when: string }[] = [
  { name: 'E-Summit IIT-B', when: 'Dec 11–12' },
  { name: 'IMRC IIM-A', when: 'Dec 5–7' },
  { name: 'Techfest IIT-B', when: 'Dec 21–24' },
  { name: 'Shaastra IIT-M', when: 'Jan 2–6' },
  { name: 'Elan & nVision IIT-H', when: 'Jan 9–11' },
  { name: 'Manfest-Varchasva IIM-L', when: 'Early Feb' },
  { name: 'GES IIT-KGP', when: 'Early Feb' },
  { name: 'IRIS IIM-I', when: 'Mid-Feb' },
  { name: 'Anwesha IIT-P', when: 'Feb 7–9' },
  { name: 'Advitiya IIT-Ropar', when: 'Feb 6–8' },
  { name: 'Arbitrage Ramjas', when: 'Feb 17–18' },
  { name: 'Tryst IIT-D', when: 'Feb 27–Mar 1' },
  { name: 'Technex IIT-BHU', when: 'Mar 13–15' },
  { name: 'Cognizance IIT-R', when: 'Late Mar' },
  { name: 'Techkriti IITK', when: 'Mar 27–30' },
  { name: 'Venix IIM-B', when: 'Aug 1–3' },
]

// ── Tracks: the circuit, by ambition ──────────────────────────────────────
export interface AmbitionLane {
  icon: string
  title: string
  picks: string[]
}

export const AMBITION_LANES: AmbitionLane[] = [
  { icon: '🧠', title: 'Consulting aspirant', picks: [
    'Venix — The Fifth Move (IIM-B, Aug)',
    'Ignite 180 — KMC (Sep–Oct)',
    'Advaita — Consilium, ISB (Oct)',
    'Red Brick Summit — IIM-A (Oct)',
    'Ensemble-Valhalla — Strategikon, XLRI (Nov)',
    'Backwaters — Kotler Sutra, IIM-K (Nov)',
    'SRCC Business Conclave + Economics Summit (Mar–Apr)',
  ] },
  { icon: '🚀', title: 'Entrepreneurship / B-plan', picks: [
    'Eureka! — IIT Bombay, ₹2 Cr pool (Dec)',
    'Empresario — IIT-KGP, ₹1.2 Cr+ (Feb)',
    'Pitch Premier — Techkriti, IITK (Mar)',
    'Venix YES — IIM Bangalore (Aug)',
    'Atharv Ranbhoomi — IIM Indore (Oct–Nov)',
    'White Knight — Backwaters, IIM-K (Nov)',
    'i5 Summit — IIT + IIM Indore (Aug–Sep)',
  ] },
  { icon: '📈', title: 'Finance / quant', picks: [
    'Manfest-Varchasva — StockGro & ICICI tracks (Feb)',
    'Global Trading League — GES, IIT-KGP (Feb)',
    'Vertex — Ramjas Arbitrage (Feb)',
    'Beat the Market — Techkriti, IITK (Mar)',
    'Atharv Ranbhoomi finance events (Oct–Nov)',
  ] },
  { icon: '🏫', title: 'DU undergrad (low travel)', picks: [
    'Mar–Apr Delhi cluster — SRCC, KMC, Ramjas, LSR, Hansraj, Hindu, NSUT',
    'Shri Ram Economics Summit (Apr)',
    'Ignite 180 — KMC consulting (Sep–Oct)',
    'Econvista — LSR Economics (Oct)',
    'Arbitrage — Ramjas Commerce (Feb)',
  ] },
]

// ── Caveats: read the fine print ──────────────────────────────────────────
export const CAVEATS: string[] = [
  "Dates shift 2–6 weeks year-to-year. Recent moves: SRCC Crossroads (Feb '24 → Apr '25 → Mar '26), IIT-H Elan & nVision (Feb '25 → Jan '26), IIM Trichy Dhruva (Oct → Jan/Feb). Use the month here, then verify on Unstop and the host's Instagram 6–8 weeks out.",
  'Mergers reduced the fest count. Vista + Eximius = Venix (IIM-B, Aug). Intaglio + Carpe Diem + 7 Lakes Run = 7 Lakes Fest (IIM-C, Nov). The old names persist colloquially but are not separately registrable.',
  'Prize-pool figures are organiser-published and may bundle in-kind sponsorship value — net cash prizes are usually a fraction. Treat ₹2 Cr / ₹1.2 Cr headlines as marketing-adjusted.',
  'DU society events outside the named flagships are fluid — a single college\'s Marketing or Finance society may run comps every semester with no fixed brand. Follow each society, not just the college.',
  'Mecca (Hindu College) 2025 was reportedly cancelled; the 2026 edition is expected back in a Feb–Mar slot but is not yet confirmed.',
]
