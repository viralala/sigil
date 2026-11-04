import { parseResume, timelineFlags } from './src/index.js';
const r = `
ASHA VERMA
asha@example.com | +91 98765 43210

EDUCATION
B.Tech in Computer Engineering, Lakeview Institute of Technology, Pune  2020 - 2024
CGPA: 8.7
HSC, Riverbend Junior College  2018-2020

EXPERIENCE
Software Engineer, Bluepeak Technologies Pvt Ltd  Jun 2024 - Present
• Built APIs
Data Analyst Intern | Orbitwave Infotech | Jan 2024 – Apr 2024

CERTIFICATIONS
Machine Learning Specialization - Coursera (2023)
AWS Certified Cloud Practitioner, Amazon Web Services, Mar 2022

SKILLS
Languages: Python, Java, C++
Tools: Docker, Git (Advanced), SQL
`;
console.log(JSON.stringify(parseResume(r), null, 1));
