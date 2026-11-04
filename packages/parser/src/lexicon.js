// Word lists and patterns used by the rule layer. Everything is bounded (no nested quantifiers) so hostile input cannot hang it.

/** Section headings -> section key. Matched against a short, lower-cased, decoration-stripped line. */
export const HEADINGS = [
  ['ignore', /^(?:summary|professional summary|career summary|profile|profile summary|objective|career objective|about(?: me)?|personal (?:details|information|profile|data)|contact(?: details| information| info)?|declaration|references?|interests?|hobbies(?: (?:and|&) interests)?|hobbies|strengths|cover letter|संपर्क)$/],
  ['education', /^(?:education|educational (?:qualifications?|background|details)|academics?|academic (?:background|qualifications?|details|record)|qualifications?|scholastic record|education (?:and|&) (?:training|qualifications?)|शिक्षण|शिक्षा)$/],
  ['experience', /^(?:(?:work|professional|employment|relevant|industry|industrial|internship|career) ?(?:experience|history|background|training)?|experience|employment|work (?:and|&) internships?|internships?(?: (?:and|&) (?:training|experience|projects))?|internships? experience|work experience (?:and|&) internships?|professional experience|अनुभव)$/],
  ['certificates', /^(?:certifications?|certificates?|licen[sc]es(?: (?:and|&) certifications?)?|certifications? (?:and|&) (?:licen[sc]es|courses|training)|courses?|online courses|courses (?:and|&) certifications?|training(?: (?:and|&) certifications?)?|trainings?|professional development|प्रमाणपत्रे|प्रमाणपत्र)$/],
  ['skills', /^(?:(?:(?:technical|key|core|soft|it|computer|professional) )?skills?(?: (?:and|&) .{1,30})?|technical (?:proficiency|expertise|competenc(?:y|ies)|summary)|core competenc(?:y|ies)|tools(?: (?:and|&) technologies)?|technologies|tech stack|programming languages|skills? summary|कौशल्ये|कौशल्य|कौशल)$/],
  ['projects', /^(?:(?:(?:academic|personal|key|major|mini|selected|notable|technical) )?projects?(?: (?:and|&) .{1,30})?|project work|projects? undertaken)$/],
  ['patents', /^(?:patents?|patents? (?:and|&) (?:copyrights?|ipr)|ipr)$/],
  ['publications', /^(?:publications?|research(?: (?:papers|publications|work|experience))?|papers|journals?|research (?:and|&) publications?|selected publications|published papers|प्रकाशन|प्रकाशने)$/],
  ['awards', /^(?:awards?(?: (?:and|&) (?:honou?rs|achievements|recognitions?|scholarships?))?|honou?rs(?: (?:and|&) awards?)?|achievements?|accomplishments?|scholarships?|recognitions?|achievements? (?:and|&) awards?|पुरस्कार)$/],
  ['events', /^(?:workshops?|conferences?|hackathons?|seminars?|events?|(?:workshops?|seminars?|conferences?) (?:and|&) (?:seminars?|workshops?|conferences?|events?)|participation|competitions?|workshops?,? seminars? (?:and|&) conferences?)$/],
  ['activities', /^(?:co-?curricular(?: activities)?|extra-?curricular(?: activities)?|activities|volunteering|volunteer experience|leadership(?: (?:and|&) activities)?|positions? of responsibility|clubs?(?: (?:and|&) societies)?|community service|extracurriculars?)$/],
];

export const BULLET = /^\s{0,6}(?:[•●▪■◦○·*►▸‣⁃»>+]|[-–—](?=\s)|\d{1,2}[.)](?=\s)|\(?[a-z][.)](?=\s))\s{0,4}/;

export const ROLE = /\b(?:engineers?|developers?|programmers?|interns?|internship|trainees?|analysts?|managers?|consultants?|designers?|architects?|scientists?|researchers?|research (?:assistant|associate|fellow)|associates?|executives?|directors?|officers?|specialists?|administrators?|testers?|leads?|heads?|founders?|co-?founders?|assistants?|apprentices?|technicians?|coordinators?|supervisors?|teachers?|lecturers?|professors?|tutors?|editors?|writers?|accountants?|auditors?|advis[eo]rs?|representatives?|operators?|strategists?|sde|swe|ceo|cto|cfo|coo|president|volunteers?|fellows?|member of technical staff|mts|freelancers?|contractors?|owner)\b/i;

export const NOT_FULL_TIME = /\b(?:interns?|internship|trainee|apprentice|part[- ]?time|freelanc\w*|volunteer\w*|contract(?:or)? \(part|student (?:partner|ambassador)|campus ambassador)\b/i;

export const ORG_SUFFIX = /\b(?:pvt\.?|private|ltd\.?|limited|inc\.?|incorporated|llc|llp|corp\.?|corporation|co\.|company|technologies|technology|technologie|systems?|solutions?|labs?|laboratory|laboratories|software|softwares|infotech|infosystems|services|consulting|consultancy|bank|group|industries|enterprises?|ventures|studios?|analytics|robotics|networks?|media|motors|pharma|healthcare|logistics|foundation|ngo|startup|university|institute|college|school|academy|council|society|association|hospital|retail|finance|financial|capital|partners|agency|works|research|iit|nit|iiit|iisc|bits|vit|vjti|coep|isro|drdo|csir)\b/i;

export const INSTITUTION = /\b(?:universit(?:y|ies)|colleges?|institute|institution|schools?|academy|vidyalaya|vidyapeeth|mahavidyalaya|polytechnic|iit|nit|iiit|iisc|bits|vit|vjti|coep|mit|board|junior college|jr\.? college|campus|cbse|icse|gymnasium)\b/i;

const DEGREE_SHORT = /(?:^|[^A-Za-z])(?:B\.?\s?Tech|M\.?\s?Tech|B\.\s?E\.?|M\.\s?E\.?|B\.\s?S\.?|M\.\s?S\.?|BE|B\.?\s?Sc\.?|M\.?\s?Sc\.?|B\.?\s?Com\.?|M\.?\s?Com\.?|BCA|MCA|BBA|MBA|B\.?\s?Des\.?|M\.?\s?Des\.?|B\.?\s?Arch\.?|B\.?\s?Pharm\.?|M\.?\s?Pharm\.?|B\.\s?A\.?|M\.\s?A\.?|BA|LL\.?B|LL\.?M|MBBS|B\.?\s?Ed|M\.?\s?Ed|Ph\.?\s?D|PGDM|HSC|SSC|XII|XI)(?![A-Za-z])/;
const DEGREE_LONG = /\b(?:bachelors?|masters?|diploma|post[- ]?graduate|doctorate|higher secondary|secondary school|senior secondary|intermediate|high school|(?:10|12)th|class\s{0,2}(?:x|xi|xii|10|11|12)|(?:std|standard|grade)\.?\s{0,2}(?:x|xi|xii|10|11|12)|associate degree)\b/i;
export const isDegree = (s) => DEGREE_SHORT.test(s) || DEGREE_LONG.test(s);

export const KNOWN_ORG = /\b(?:coursera|udemy|nptel|swayam|edx|udacity|linkedin learning|pluralsight|codecademy|datacamp|great learning|upgrad|simplilearn|infosys springboard|springboard|google|microsoft|amazon|aws|ibm|cisco|oracle|meta|salesforce|red hat|redhat|adobe|nvidia|hackerrank|hackerearth|kaggle|leetcode|unstop|internshala|freecodecamp|postman|scaler|ieee|acm|springer|elsevier|wipro|infosys|tcs|accenture|deloitte|capgemini|cognizant|hcl|stanford|harvard|nasscom|wadhwani|be10x|pearson|cambridge|ielts|toefl)\b/i;

export const ORG_LIKE = (s) => ORG_SUFFIX.test(s) || KNOWN_ORG.test(s) || INSTITUTION.test(s);

/** Lines that read like instructions aimed at software. They are never turned into claims. */
export const INJECTION = [
  /\b(?:ignore|disregard|forget|override|bypass|skip)\b.{0,40}\b(?:previous|prior|above|earlier|all|any|the|your|these|those)\b.{0,30}\b(?:instructions?|prompts?|rules?|messages?|checks?|polic(?:y|ies)|guidelines?|verification|constraints?)\b/i,
  /\b(?:ignore|disregard|forget)\s+(?:everything|all|this|that|the rest|previous|prior)\b/i,
  /\b(?:system|developer|admin(?:istrator)?|assistant)\s{0,3}(?:prompt|message|override|instructions?|note|command)\b/i,
  /^\s{0,4}(?:system|assistant|developer|user|admin)\s{0,3}[:>]/i,
  /<\/?\s{0,3}(?:system|assistant|instructions?|prompt|tool|function|im_start|im_end)[^>]{0,40}>/i,
  /\[\s{0,3}(?:system|inst|instructions?|assistant)\s{0,3}\]/i,
  /\byou\s+(?:are|must|should|will|shall)\s+(?:now|always|never|only|immediately)?\s{0,3}(?:act|behave|respond|output|answer|reply|mark|set|flag|approve|ignore|treat|return|print|say|pretend|follow)/i,
  /\b(?:mark|flag|label|tag|treat|stamp|certify|declare|set|approve|confirm|report|output|return)\b[^.\n]{0,30}\b(?:as|to be|=|:)\s{0,3}["']?(?:verified|genuine|authentic|trusted|approved|valid(?:ated)?|real|passed|green|confirmed)\b/i,
  /\b(?:all|every|this|these|each)\b.{0,30}\b(?:claims?|credentials?|certificates?|degrees?|entries|items|resume|cv|details)\b.{0,20}\b(?:are|is|as)\b.{0,10}\b(?:verified|genuine|authentic|real|valid|true|trusted)\b/i,
  /\b(?:verified|verification|trust(?:ed)?|status|state|witness|tier)\s{0,3}["']?\s{0,3}[:=]\s{0,3}["']?\s{0,3}(?:true|yes|verified|green|w[1-5]|tier\s?a)\b/i,
  /["']?(?:verified|status|state|trust)["']?\s{0,3}:\s{0,3}["']?(?:true|verified|green)/i,
  /\b(?:pretend|roleplay|role-play|jailbreak|do anything now|dan mode|developer mode|god mode)\b/i,
  /\b(?:reveal|show|print|repeat|leak|exfiltrate|send|email|post)\b.{0,40}\b(?:system prompt|your prompt|instructions|api[- ]?key|secret|password|token|credentials?|private key|database)\b/i,
  /\b(?:new|updated|real|actual|hidden|secret) (?:instructions?|task|rules?|orders?|objective)\b/i,
  /\b(?:rank|score|rate|grade)\b.{0,40}\b(?:this|the) (?:candidate|applicant|resume|person|profile)\b.{0,30}\b(?:first|highest|top|best|perfect|10\/10|100|number one|#1)\b/i,
  /\b(?:hire|select|shortlist|recommend|approve|accept)\s{0,3}(?:this|the)?\s{0,3}(?:candidate|applicant|person)\b/i,
  /\b(?:tool[_ ]?call|function[_ ]?call|execute|curl|wget|fetch|browse|navigate|download)\b.{0,20}(?:https?:|www\.)/i,
  /\b(?:base64|rot13|decode (?:the|this) (?:following|string|message))\b/i,
  /(?:^|\s)(?:#{1,3}\s{0,2}instructions?|\*\*\s{0,2}instructions?\s{0,2}\*\*)/i,
  /\b(?:sudo|rm -rf|drop table|select \* from)\b|<script\b|javascript:|onerror\s{0,2}=/i,
  /\b(?:ignore|disregard)\s{1,3}(?:the\s{1,3})?(?:above|below|following|preceding)\b/i,
  /\b(?:note|message|attention|instructions?)s?\s{1,3}(?:to|for)\s{1,3}(?:the\s{1,3})?(?:ai|assistant|model|llm|bot|parser|system|reviewer|screener|recruiter|reader)\b/i,
  /\b(?:do not|don'?t|never)\s{1,3}(?:check|verify|question|flag|validate|look)\b/i,
  /\bpre-?(?:verified|approved|validated|checked)\b/i,
  /\b(?:as an ai|as a language model|i am an ai)\b/i,
  /\b(?:end of (?:resume|document|input)|begin (?:instructions?|system|new))\b/i,
];

export const CONTACT = /(?:[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+|(?:https?:\/\/|www\.)\S+|(?:linkedin|github|gitlab|twitter|instagram|facebook)\.com\S*|\+?\d[\d\s\-()]{8,16}\d)/g;
