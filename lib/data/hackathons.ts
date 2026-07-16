// Hackathon database, generated from the source Excel (section 4).

export interface Hackathon {
  id: string
  name: string
  sponsor: string
  format: string
  months: number[]
  flexible: boolean
  windowLabel: string
  prize: string
  category: string
}

export const HACKATHON_CATEGORIES: string[] = [
  "Global Tech Hackathons",
  "Fintech & Blockchain Hackathons",
  "Healthcare & Life Sciences Hackathons",
  "Sustainability & Social Impact Hackathons",
  "Industry-Specific Hackathons",
  "India-Specific Hackathons",
]

export const HACKATHONS: Hackathon[] = [
  { id: "google-code-jam", name: "Google Code Jam", sponsor: "Google", format: "Online coding + finals", months: [3, 4, 5, 6, 7, 8], flexible: false, windowLabel: "Mar–Aug", prize: "$15,000", category: "Global Tech Hackathons" },
  { id: "facebook-hacker-cup", name: "Facebook Hacker Cup", sponsor: "Meta", format: "Online coding", months: [6, 7, 8, 9, 10], flexible: false, windowLabel: "Jun–Oct", prize: "$20,000", category: "Global Tech Hackathons" },
  { id: "microsoft-imagine-cup", name: "Microsoft Imagine Cup", sponsor: "Microsoft", format: "Innovation + tech", months: [11, 12, 1, 2, 3, 4], flexible: false, windowLabel: "Nov–Apr", prize: "$100,000", category: "Global Tech Hackathons" },
  { id: "intel-ai-global-impact-festival", name: "Intel AI Global Impact Festival", sponsor: "Intel", format: "AI innovation", months: [8, 9, 10, 11], flexible: false, windowLabel: "Aug–Nov", prize: "$10,000", category: "Global Tech Hackathons" },
  { id: "ibm-call-for-code", name: "IBM Call for Code", sponsor: "IBM", format: "Social impact + tech", months: [1, 2, 3, 4, 5, 6, 7], flexible: false, windowLabel: "Jan–Jul", prize: "$200,000", category: "Global Tech Hackathons" },
  { id: "aws-hackathon", name: "AWS Hackathon", sponsor: "Amazon", format: "Cloud innovation", months: [], flexible: true, windowLabel: "Varies", prize: "$50,000", category: "Global Tech Hackathons" },
  { id: "salesforce-hackathon", name: "Salesforce Hackathon", sponsor: "Salesforce", format: "CRM innovation", months: [9, 10, 11], flexible: false, windowLabel: "Sep–Nov", prize: "$10,000", category: "Global Tech Hackathons" },
  { id: "sap-innojam", name: "SAP InnoJam", sponsor: "SAP", format: "Enterprise software", months: [], flexible: true, windowLabel: "Varies", prize: "Recognition", category: "Global Tech Hackathons" },
  { id: "oracle-cloud-hackathon", name: "Oracle Cloud Hackathon", sponsor: "Oracle", format: "Cloud innovation", months: [9, 10, 11], flexible: false, windowLabel: "Sep–Nov", prize: "$10,000", category: "Global Tech Hackathons" },
  { id: "adobe-creative-jam", name: "Adobe Creative Jam", sponsor: "Adobe", format: "Design + creativity", months: [], flexible: true, windowLabel: "Varies", prize: "Recognition", category: "Global Tech Hackathons" },
  { id: "ethereum-global-hackathon", name: "Ethereum Global Hackathon", sponsor: "Ethereum Foundation", format: "Blockchain", months: [], flexible: true, windowLabel: "Varies", prize: "$100,000+", category: "Fintech & Blockchain Hackathons" },
  { id: "solana-hackathon", name: "Solana Hackathon", sponsor: "Solana Foundation", format: "Blockchain", months: [], flexible: true, windowLabel: "Varies", prize: "$50,000", category: "Fintech & Blockchain Hackathons" },
  { id: "chainlink-hackathon", name: "Chainlink Hackathon", sponsor: "Chainlink", format: "Smart contracts", months: [], flexible: true, windowLabel: "Varies", prize: "$50,000", category: "Fintech & Blockchain Hackathons" },
  { id: "polygon-buidl-it", name: "Polygon BUIDL IT", sponsor: "Polygon", format: "Web3", months: [], flexible: true, windowLabel: "Varies", prize: "$50,000", category: "Fintech & Blockchain Hackathons" },
  { id: "visa-hackathon", name: "Visa Hackathon", sponsor: "Visa", format: "Payments innovation", months: [9, 10, 11], flexible: false, windowLabel: "Sep–Nov", prize: "$25,000", category: "Fintech & Blockchain Hackathons" },
  { id: "mastercard-innovation-challenge", name: "Mastercard Innovation Challenge", sponsor: "Mastercard", format: "Payments", months: [9, 10, 11], flexible: false, windowLabel: "Sep–Nov", prize: "$25,000", category: "Fintech & Blockchain Hackathons" },
  { id: "paypal-opportunity-hack", name: "PayPal Opportunity Hack", sponsor: "PayPal", format: "Social impact", months: [9, 10], flexible: false, windowLabel: "Sep–Oct", prize: "$10,000", category: "Fintech & Blockchain Hackathons" },
  { id: "stripe-build-a-business", name: "Stripe Build a Business", sponsor: "Stripe", format: "Payments", months: [], flexible: true, windowLabel: "Varies", prize: "$50,000", category: "Fintech & Blockchain Hackathons" },
  { id: "square-developer-hackathon", name: "Square Developer Hackathon", sponsor: "Square", format: "Payments", months: [], flexible: true, windowLabel: "Varies", prize: "$10,000", category: "Fintech & Blockchain Hackathons" },
  { id: "plaid-hackathon", name: "Plaid Hackathon", sponsor: "Plaid", format: "Open banking", months: [], flexible: true, windowLabel: "Varies", prize: "$10,000", category: "Fintech & Blockchain Hackathons" },
  { id: "mit-hacking-medicine", name: "MIT Hacking Medicine", sponsor: "MIT", format: "Healthcare innovation", months: [], flexible: true, windowLabel: "Various", prize: "Recognition", category: "Healthcare & Life Sciences Hackathons" },
  { id: "stanford-medtech-innovation", name: "Stanford MedTech Innovation", sponsor: "Stanford", format: "Medical devices", months: [3, 4], flexible: false, windowLabel: "Mar–Apr", prize: "$10,000", category: "Healthcare & Life Sciences Hackathons" },
  { id: "health-2-0-hackathon", name: "Health 2.0 Hackathon", sponsor: "Health 2.0", format: "Digital health", months: [9, 10], flexible: false, windowLabel: "Sep–Oct", prize: "$10,000", category: "Healthcare & Life Sciences Hackathons" },
  { id: "pfizer-digital-health-hackathon", name: "Pfizer Digital Health Hackathon", sponsor: "Pfizer", format: "Pharma + digital", months: [10, 11], flexible: false, windowLabel: "Oct–Nov", prize: "$15,000", category: "Healthcare & Life Sciences Hackathons" },
  { id: "johnson-johnson-innovation-challenge", name: "Johnson & Johnson Innovation Challenge", sponsor: "J&J", format: "Healthcare innovation", months: [9, 10, 11], flexible: false, windowLabel: "Sep–Nov", prize: "$25,000", category: "Healthcare & Life Sciences Hackathons" },
  { id: "novartis-biohack", name: "Novartis Biohack", sponsor: "Novartis", format: "Biotech", months: [10, 11], flexible: false, windowLabel: "Oct–Nov", prize: "$20,000", category: "Healthcare & Life Sciences Hackathons" },
  { id: "roche-health-hackathon", name: "Roche Health Hackathon", sponsor: "Roche", format: "Diagnostics", months: [9, 10], flexible: false, windowLabel: "Sep–Oct", prize: "$15,000", category: "Healthcare & Life Sciences Hackathons" },
  { id: "merck-innovation-cup", name: "Merck Innovation Cup", sponsor: "Merck", format: "Life sciences", months: [10, 11, 12], flexible: false, windowLabel: "Oct–Dec", prize: "$10,000", category: "Healthcare & Life Sciences Hackathons" },
  { id: "bayer-g4a-digital-health", name: "Bayer G4A Digital Health", sponsor: "Bayer", format: "Digital health", months: [], flexible: true, windowLabel: "Rolling", prize: "Acceleration", category: "Healthcare & Life Sciences Hackathons" },
  { id: "sanofi-innovation-hackathon", name: "Sanofi Innovation Hackathon", sponsor: "Sanofi", format: "Pharma + tech", months: [9, 10, 11], flexible: false, windowLabel: "Sep–Nov", prize: "$15,000", category: "Healthcare & Life Sciences Hackathons" },
  { id: "nasa-space-apps-challenge", name: "NASA Space Apps Challenge", sponsor: "NASA", format: "Space + Earth", months: [10], flexible: false, windowLabel: "Oct", prize: "Recognition", category: "Sustainability & Social Impact Hackathons" },
  { id: "climate-hack", name: "Climate Hack", sponsor: "Various", format: "Climate solutions", months: [9, 10, 11], flexible: false, windowLabel: "Sep–Nov", prize: "$50,000", category: "Sustainability & Social Impact Hackathons" },
  { id: "hack-for-good", name: "Hack for Good", sponsor: "Various", format: "Social impact", months: [], flexible: true, windowLabel: "Varies", prize: "Varies", category: "Sustainability & Social Impact Hackathons" },
  { id: "un-sdg-hackathon", name: "UN SDG Hackathon", sponsor: "UN", format: "Sustainable development", months: [9, 10], flexible: false, windowLabel: "Sep–Oct", prize: "Recognition", category: "Sustainability & Social Impact Hackathons" },
  { id: "world-bank-climate-tech-sprint", name: "World Bank Climate Tech Sprint", sponsor: "World Bank", format: "Climate finance", months: [10, 11], flexible: false, windowLabel: "Oct–Nov", prize: "$25,000", category: "Sustainability & Social Impact Hackathons" },
  { id: "bloomberg-green-hackathon", name: "Bloomberg Green Hackathon", sponsor: "Bloomberg", format: "Climate data", months: [9, 10], flexible: false, windowLabel: "Sep–Oct", prize: "$10,000", category: "Sustainability & Social Impact Hackathons" },
  { id: "c40-cities-climate-hackathon", name: "C40 Cities Climate Hackathon", sponsor: "C40", format: "Urban sustainability", months: [10, 11], flexible: false, windowLabel: "Oct–Nov", prize: "Recognition", category: "Sustainability & Social Impact Hackathons" },
  { id: "ellen-macarthur-circular-economy-challenge", name: "Ellen MacArthur Circular Economy Challenge", sponsor: "Ellen MacArthur Foundation", format: "Circular economy", months: [], flexible: true, windowLabel: "Rolling", prize: "Recognition", category: "Sustainability & Social Impact Hackathons" },
  { id: "climathon", name: "Climathon", sponsor: "EIT Climate-KIC", format: "Climate innovation", months: [10], flexible: false, windowLabel: "Oct", prize: "10000", category: "Sustainability & Social Impact Hackathons" },
  { id: "ocean-hackathon", name: "Ocean Hackathon", sponsor: "Various", format: "Ocean conservation", months: [9, 10], flexible: false, windowLabel: "Sep–Oct", prize: "10000", category: "Sustainability & Social Impact Hackathons" },
  { id: "angelhack", name: "AngelHack", sponsor: "General tech", format: "AngelHack", months: [], flexible: true, windowLabel: "Varies", prize: "Acceleration", category: "Industry-Specific Hackathons" },
  { id: "techcrunch-disrupt-hackathon", name: "TechCrunch Disrupt Hackathon", sponsor: "Startups", format: "TechCrunch", months: [9], flexible: false, windowLabel: "Sep", prize: "Recognition", category: "Industry-Specific Hackathons" },
  { id: "junction", name: "Junction", sponsor: "General tech", format: "Junction", months: [11], flexible: false, windowLabel: "Nov", prize: "10000", category: "Industry-Specific Hackathons" },
  { id: "hackzurich", name: "HackZurich", sponsor: "General tech", format: "ETH Zurich", months: [9], flexible: false, windowLabel: "Sep", prize: "CHF 20,000", category: "Industry-Specific Hackathons" },
  { id: "hackmit", name: "HackMIT", sponsor: "General tech", format: "MIT", months: [9], flexible: false, windowLabel: "Sep", prize: "Recognition", category: "Industry-Specific Hackathons" },
  { id: "pennapps", name: "PennApps", sponsor: "General tech", format: "U Penn", months: [9], flexible: false, windowLabel: "Sep", prize: "$10,000", category: "Industry-Specific Hackathons" },
  { id: "treehacks", name: "TreeHacks", sponsor: "General tech", format: "Stanford", months: [2], flexible: false, windowLabel: "Feb", prize: "$10,000", category: "Industry-Specific Hackathons" },
  { id: "calhacks", name: "CalHacks", sponsor: "General tech", format: "UC Berkeley", months: [10], flexible: false, windowLabel: "Oct", prize: "$10,000", category: "Industry-Specific Hackathons" },
  { id: "hackgt", name: "HackGT", sponsor: "General tech", format: "Georgia Tech", months: [10], flexible: false, windowLabel: "Oct", prize: "$10,000", category: "Industry-Specific Hackathons" },
  { id: "hackny", name: "HackNY", sponsor: "General tech", format: "NYC", months: [9], flexible: false, windowLabel: "Sep", prize: "$10,000", category: "Industry-Specific Hackathons" },
  { id: "smart-india-hackathon", name: "Smart India Hackathon", sponsor: "Government of India", format: "36 hrs, problem statements", months: [3, 4], flexible: false, windowLabel: "Mar–Apr", prize: "₹1,00,000+", category: "India-Specific Hackathons" },
  { id: "flipkart-grid", name: "Flipkart GRiD", sponsor: "Flipkart", format: "E-commerce tech", months: [8, 9], flexible: false, windowLabel: "Aug–Sep", prize: "PPI offers", category: "India-Specific Hackathons" },
  { id: "amazon-ml-challenge", name: "Amazon ML Challenge", sponsor: "Amazon", format: "ML + AI", months: [9, 10], flexible: false, windowLabel: "Sep–Oct", prize: "Internship pipeline", category: "India-Specific Hackathons" },
  { id: "myntra-hackerramp", name: "Myntra HackerRamp", sponsor: "Myntra", format: "Fashion tech", months: [8, 9], flexible: false, windowLabel: "Aug–Sep", prize: "PPI offers", category: "India-Specific Hackathons" },
  { id: "uber-hacktag", name: "Uber HackTag", sponsor: "Uber", format: "Mobility tech", months: [9, 10], flexible: false, windowLabel: "Sep–Oct", prize: "Internship pipeline", category: "India-Specific Hackathons" },
  { id: "swiggy-code-gladiators", name: "Swiggy Code Gladiators", sponsor: "Swiggy", format: "Food tech", months: [8, 9], flexible: false, windowLabel: "Aug–Sep", prize: "100000", category: "India-Specific Hackathons" },
  { id: "zomato-hackathon", name: "Zomato Hackathon", sponsor: "Zomato", format: "Food tech", months: [9, 10], flexible: false, windowLabel: "Sep–Oct", prize: "Recognition", category: "India-Specific Hackathons" },
  { id: "paytm-build-for-india-hackathon", name: "Paytm Build for India Hackathon", sponsor: "Paytm", format: "Fintech", months: [8, 9, 10], flexible: false, windowLabel: "Aug–Oct", prize: "Internship pipeline", category: "India-Specific Hackathons" },
  { id: "phonepe-tech-scholars", name: "PhonePe Tech Scholars", sponsor: "PhonePe", format: "Fintech", months: [9, 10, 11], flexible: false, windowLabel: "Sep–Nov", prize: "Scholarship", category: "India-Specific Hackathons" },
  { id: "razorpay-hackathon", name: "Razorpay Hackathon", sponsor: "Razorpay", format: "Payments", months: [9, 10], flexible: false, windowLabel: "Sep–Oct", prize: "Recognition", category: "India-Specific Hackathons" },
  { id: "icici-appathon", name: "ICICI Appathon", sponsor: "ICICI Bank", format: "Banking tech", months: [8, 9, 10], flexible: false, windowLabel: "Aug–Oct", prize: "100000", category: "India-Specific Hackathons" },
  { id: "hdfc-digital-innovation", name: "HDFC Digital Innovation", sponsor: "HDFC Bank", format: "Banking tech", months: [9, 10, 11], flexible: false, windowLabel: "Sep–Nov", prize: "Recognition", category: "India-Specific Hackathons" },
  { id: "axis-bank-thought-factory", name: "Axis Bank Thought Factory", sponsor: "Axis Bank", format: "Fintech", months: [8, 9, 10], flexible: false, windowLabel: "Aug–Oct", prize: "Acceleration", category: "India-Specific Hackathons" },
  { id: "yes-bank-datathon", name: "Yes Bank Datathon", sponsor: "Yes Bank", format: "Data analytics", months: [9, 10], flexible: false, windowLabel: "Sep–Oct", prize: "Recognition", category: "India-Specific Hackathons" },
  { id: "kotak-fintech-hackathon", name: "Kotak Fintech Hackathon", sponsor: "Kotak Mahindra", format: "Fintech", months: [10, 11], flexible: false, windowLabel: "Oct–Nov", prize: "Recognition", category: "India-Specific Hackathons" },
  { id: "tcs-codevita", name: "TCS CodeVita", sponsor: "TCS", format: "Coding", months: [7, 8, 9, 10], flexible: false, windowLabel: "Jul–Oct", prize: "$10,000", category: "India-Specific Hackathons" },
  { id: "infosys-infytq-hackathon", name: "Infosys InfyTQ Hackathon", sponsor: "Infosys", format: "Tech", months: [8, 9, 10], flexible: false, windowLabel: "Aug–Oct", prize: "Internship pipeline", category: "India-Specific Hackathons" },
  { id: "wipro-topgeek", name: "Wipro Topgeek", sponsor: "Wipro", format: "Tech", months: [9, 10], flexible: false, windowLabel: "Sep–Oct", prize: "Recognition", category: "India-Specific Hackathons" },
  { id: "hcl-codecraft", name: "HCL CodeCraft", sponsor: "HCL", format: "Coding", months: [8, 9, 10], flexible: false, windowLabel: "Aug–Oct", prize: "Recognition", category: "India-Specific Hackathons" },
  { id: "tech-mahindra-jenga", name: "Tech Mahindra JENGA", sponsor: "Tech Mahindra", format: "Tech", months: [9, 10, 11], flexible: false, windowLabel: "Sep–Nov", prize: "Recognition", category: "India-Specific Hackathons" },
]
