// INVENTED resumes. Every person, company, college and number below is made up for testing.
// `expected` is what a careful human would list as claims, written BEFORE looking at parser output
// (then the parser was fixed for general bugs, not for these strings).
// Fields compared: kind, title, org, from, to. null means "not on the page".

const e = (kind, title, org, from, to) => ({ kind, title, org, from, to });

export const RESUMES = [
  {
    name: 'standard-one-column',
    layout: 'clean sections, comma separated',
    text: `Zorya Quillfeather
zorya@example.com | +91 00000 00000 | linkedin.com/in/example

EDUCATION
B.Tech in Computer Engineering, Lakeview Institute of Technology, Pune  2020 - 2024
CGPA: 8.7
HSC, Riverbend Junior College  2018-2020

EXPERIENCE
Software Engineer, Bluepeak Technologies Pvt Ltd  Jun 2024 - Present
• Built internal APIs
Data Analyst Intern | Orbitwave Infotech | Jan 2024 – Apr 2024

CERTIFICATIONS
Machine Learning Specialization - Coursera (2023)
AWS Certified Cloud Practitioner, Amazon Web Services, Mar 2022

SKILLS
Languages: Python, Java, C++
Tools: Docker, Git (Advanced), SQL
`,
    expected: [
      e('education', 'B.Tech in Computer Engineering', 'Lakeview Institute of Technology', '2020', '2024'),
      e('education', 'HSC', 'Riverbend Junior College', '2018', '2020'),
      e('job', 'Software Engineer', 'Bluepeak Technologies Pvt Ltd', '2024-06', 'present'),
      e('job', 'Data Analyst Intern', 'Orbitwave Infotech', '2024-01', '2024-04'),
      e('certificate', 'Machine Learning Specialization', 'Coursera', '2023', null),
      e('certificate', 'AWS Certified Cloud Practitioner', 'Amazon Web Services', '2022-03', null),
      e('skill', 'Python', null, null, null), e('skill', 'Java', null, null, null), e('skill', 'C++', null, null, null),
      e('skill', 'Docker', null, null, null), e('skill', 'Git (Advanced)', null, null, null), e('skill', 'SQL', null, null, null),
    ],
  },
  {
    name: 'stacked-blocks',
    layout: 'company / role / dates on separate lines',
    text: `MIRABEL ONDREJ
Pune, Maharashtra

Work Experience

Kestrel Logistics Limited
Operations Lead
March 2021 - December 2023
- Managed a team of 12 people across two depots.
- Cut delays by a third.

Fernhill Health
Marketing Executive
July 2018 - February 2021

Education

Master of Business Administration
Harborline Institute of Management
2016 - 2018

Bachelor of Commerce
Fairmount College of Commerce
2013 - 2016
`,
    expected: [
      e('job', 'Operations Lead', 'Kestrel Logistics Limited', '2021-03', '2023-12'),
      e('job', 'Marketing Executive', 'Fernhill Health', '2018-07', '2021-02'),
      e('education', 'Master of Business Administration', 'Harborline Institute of Management', '2016', '2018'),
      e('education', 'Bachelor of Commerce', 'Fairmount College of Commerce', '2013', '2016'),
    ],
  },
  {
    name: 'pipe-style-international',
    layout: 'US style, slashes and abbreviations',
    text: `Tobias Wrenfield
Professional Experience
Backend Developer at Northwind Labs, 09/2018 - 12/2021
Senior Backend Developer at Northwind Labs, 01/2022 - Present
Teaching Assistant - Eastgate University, Sept 2016 - May 2018

Education
B.S. in Computer Science, Eastgate University, May 2018
M.S. in Data Science, Highland University, 2022 - 2024

Awards
Dean's List, Eastgate University, 2017
Winner, Open Data Datathon 2019
`,
    expected: [
      e('job', 'Backend Developer', 'Northwind Labs', '2018-09', '2021-12'),
      e('job', 'Senior Backend Developer', 'Northwind Labs', '2022-01', 'present'),
      e('job', 'Teaching Assistant', 'Eastgate University', '2016-09', '2018-05'),
      e('education', 'B.S. in Computer Science', 'Eastgate University', null, '2018-05'),
      e('education', 'M.S. in Data Science', 'Highland University', '2022', '2024'),
      e('award', "Dean's List", 'Eastgate University', '2017', null),
      e('award', 'Winner, Open Data Datathon', null, '2019', null),
    ],
  },
  {
    name: 'indian-dates',
    layout: 'Indian date formats, SSC/HSC, internships',
    text: `Kavya Testgaonkar
Educational Qualifications
B.E. (Electronics and Telecommunication), Greenhill Polytechnic, 2020-24
HSC (Science), Oakridge Higher Secondary School, 2019-20, 81.5%
SSC, Cedar Valley School, 2017 - 18

Internships
Embedded Intern, Tidal Robotics, 01/06/2022 - 15/08/2022
Summer Intern at Granite Bank, May 2023 - Jul 2023

Workshops
Workshop on Cloud Native Basics, Stackyard Cloud, 12 March 2023
`,
    expected: [
      e('education', 'B.E. (Electronics and Telecommunication)', 'Greenhill Polytechnic', '2020', '2024'),
      e('education', 'HSC (Science)', 'Oakridge Higher Secondary School', '2019', '2020'),
      e('education', 'SSC', 'Cedar Valley School', '2017', '2018'),
      e('job', 'Embedded Intern', 'Tidal Robotics', '2022-06-01', '2022-08-15'),
      e('job', 'Summer Intern', 'Granite Bank', '2023-05', '2023-07'),
      e('event', 'Workshop on Cloud Native Basics, Stackyard Cloud', null, '2023-03-12', null),
    ],
  },
  {
    name: 'messy-pdf-extract',
    layout: 'PDF text: spaced headings, wide gaps, page noise, form feeds',
    text: `Page 1 of 2
\u000cNOVA  BRIGHTLOOM
nova@example.com      +91 00000 00000

E D U C A T I O N
Bachelor of Technology in Information Technology         2019 – 2023
Silverlake University, Pune
Senior Secondary (XII)         2018 - 2019
Brightfield Junior College

W O R K   E X P E R I E N C E
Associate Consultant                                Jul 2023 – Present
Mapleton Consulting
•  Implemented dashboards for retail clients and
   trained the support team on release process
Research Intern                                      Dec 2022 – Feb 2023
Quillon Systems

S K I L L S
Python  |  SQL  |  Tableau  |  Power BI
Page 2 of 2
`,
    expected: [
      e('education', 'Bachelor of Technology in Information Technology', 'Silverlake University', '2019', '2023'),
      e('education', 'Senior Secondary (XII)', 'Brightfield Junior College', '2018', '2019'),
      e('job', 'Associate Consultant', 'Mapleton Consulting', '2023-07', 'present'),
      e('job', 'Research Intern', 'Quillon Systems', '2022-12', '2023-02'),
      e('skill', 'Python', null, null, null), e('skill', 'SQL', null, null, null),
      e('skill', 'Tableau', null, null, null), e('skill', 'Power BI', null, null, null),
    ],
  },
  {
    name: 'no-headings-flat',
    layout: 'no section headings at all',
    text: `Ishaan Dummerwal
Full Stack Developer at Stackyard Cloud, Aug 2021 - Present
MCA, Ridgeway Institute of Technology, 2019 - 2021
Skills: React, Node.js, PostgreSQL
Google Data Analytics Certificate, Coursera, 2020
`,
    expected: [
      e('job', 'Full Stack Developer', 'Stackyard Cloud', '2021-08', 'present'),
      e('education', 'MCA', 'Ridgeway Institute of Technology', '2019', '2021'),
      e('skill', 'React', null, null, null), e('skill', 'Node.js', null, null, null), e('skill', 'PostgreSQL', null, null, null),
      e('certificate', 'Google Data Analytics Certificate', 'Coursera', '2020', null),
    ],
  },
  {
    name: 'research-profile',
    layout: 'publications, patents, events, awards',
    text: `Dr. Fenna Alderquist

PUBLICATIONS
1. Sparse Attention for Low-Power Edge Devices, IEEE Conference on Embedded Imaging, 2025
2. A Survey of Federated Learning Systems, International Journal of Applied Computing, March 2024

PATENTS
Patent: A device for sorting seeds by weight (Application No. 000000000, Granted 2024)

CONFERENCES
Smart Campus Hackathon, Harborline Institute of Management, 2023
Cyber Defence Cup 2024

AWARDS & HONOURS
Best Paper Award at Open Science Meetup, 2025
National Merit Scholar
`,
    expected: [
      e('publication', 'Sparse Attention for Low-Power Edge Devices', 'IEEE Conference on Embedded Imaging', '2025', null),
      e('publication', 'A Survey of Federated Learning Systems', 'International Journal of Applied Computing', '2024-03', null),
      e('patent', 'A device for sorting seeds by weight', null, '2024', null),
      e('event', 'Smart Campus Hackathon', 'Harborline Institute of Management', '2023', null),
      e('event', 'Cyber Defence Cup', null, '2024', null),
      e('award', 'Best Paper Award at Open Science Meetup', null, '2025', null),
      e('award', 'National Merit Scholar', null, null, null),
    ],
  },
  {
    name: 'skills-heavy',
    layout: 'bulleted skills, several labels',
    text: `Leif Oakenshaw
TECHNICAL SKILLS
• Programming: Python, Go, Rust
• Cloud & DevOps: AWS, Terraform, Kubernetes (CKA)
• Soft skills: Public Speaking, Teamwork

PROJECTS
Campus Navigator (React Native, Firebase) 2024
Tiny Compiler for a Toy Language 2023

EXPERIENCE
DevOps Engineer, Corvid Solutions LLP, 2022 - 2024
`,
    expected: [
      e('skill', 'Python', null, null, null), e('skill', 'Go', null, null, null), e('skill', 'Rust', null, null, null),
      e('skill', 'AWS', null, null, null), e('skill', 'Terraform', null, null, null), e('skill', 'Kubernetes (CKA)', null, null, null),
      e('skill', 'Public Speaking', null, null, null), e('skill', 'Teamwork', null, null, null),
      e('other', 'Campus Navigator', null, '2024', null),
      e('other', 'Tiny Compiler for a Toy Language', null, '2023', null),
      e('job', 'DevOps Engineer', 'Corvid Solutions LLP', '2022', '2024'),
    ],
  },
  {
    name: 'marathi-headings',
    layout: 'Devanagari section headings, English content',
    text: `सायली टेस्टकर
शिक्षण
B.Com, Fairmount College of Commerce, 2018 - 2021
अनुभव
Accountant, Granite Bank, Aug 2021 - Sep 2023
कौशल्ये
Excel, Tally, Communication
`,
    expected: [
      e('education', 'B.Com', 'Fairmount College of Commerce', '2018', '2021'),
      e('job', 'Accountant', 'Granite Bank', '2021-08', '2023-09'),
      e('skill', 'Excel', null, null, null), e('skill', 'Tally', null, null, null), e('skill', 'Communication', null, null, null),
    ],
  },
  {
    name: 'overlap-jobs',
    layout: 'two full-time jobs that overlap (timeline test)',
    text: `Rhea Ploverton
EXPERIENCE
Product Manager - Zenfold Software - Jan 2021 to Dec 2022
Business Analyst - Paperkite Media - Jun 2022 to Present
`,
    expected: [
      e('job', 'Product Manager', 'Zenfold Software', '2021-01', '2022-12'),
      e('job', 'Business Analyst', 'Paperkite Media', '2022-06', 'present'),
    ],
  },
  {
    name: 'wrapped-and-bulleted-certs',
    layout: 'bulleted certificates, one wraps onto a second line',
    text: `Orin Teasdale
Courses and Certifications
• Deep Learning Specialization by DeepLearning.AI on Coursera, 2022
• NPTEL: Introduction to Machine Learning (IIT Kharagpur), Jan 2023
• Certificate of Participation, National Cyber Security Awareness
  Workshop, 2021
`,
    expected: [
      e('certificate', 'Deep Learning Specialization', 'DeepLearning.AI on Coursera', '2022', null),
      e('certificate', 'NPTEL: Introduction to Machine Learning', 'IIT Kharagpur', '2023-01', null),
      e('certificate', 'Certificate of Participation, National Cyber Security Awareness Workshop', null, '2021', null),
    ],
  },
  {
    name: 'two-column-collapse',
    layout: 'two columns collapsed into one stream by an extractor',
    text: `ARDEN QUILLMOORE            SKILLS
Embedded Engineer           C, Embedded C, Arduino
EXPERIENCE                  EDUCATION
Tidal Robotics              Diploma in Electronics, Greenhill Polytechnic
Embedded Engineer           2015 - 2018
Mar 2019 - Jan 2024
`,
    expected: [
      e('job', 'Embedded Engineer', 'Tidal Robotics', '2019-03', '2024-01'),
      e('education', 'Diploma in Electronics', 'Greenhill Polytechnic', '2015', '2018'),
      e('skill', 'C', null, null, null), e('skill', 'Embedded C', null, null, null), e('skill', 'Arduino', null, null, null),
    ],
    hard: true,
  },
];
