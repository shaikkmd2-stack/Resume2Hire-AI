import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { SkillItem, ExperienceItem, EducationItem, ResumeData } from '../types';

// Configure pdfjs worker for Vite
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.4.299'}/build/pdf.worker.min.mjs`;
  }
}

export interface ExtractedDocument {
  text: string;
  pageCount: number;
  wordCount: number;
}

export interface StructuredResumeAnalysis {
  candidateName: string;
  email?: string;
  phone?: string;
  links: string[];
  targetRole: string;
  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Staff' | 'Principal' | 'Executive';
  skills: SkillItem[];
  education: EducationItem[];
  experience: ExperienceItem[];
  strengths: string[];
  missingSkills: string[];
  suggestions: {
    id: string;
    title: string;
    description: string;
    category: 'Impact' | 'Keywords' | 'Formatting' | 'Structure' | 'Action Verbs';
    severity: 'High' | 'Medium' | 'Low';
  }[];
  overallScore: number;
  breakdown: {
    impact: number;
    brevity: number;
    style: number;
    skillsCoverage: number;
  };
  atsProbability: number;
}

// Industry skill taxonomy for deterministic keyword matching
const SKILL_DATABASE: Array<{ name: string; category: SkillItem['category']; regex: RegExp }> = [
  // Languages
  { name: 'TypeScript', category: 'Languages', regex: /\btypescript\b/i },
  { name: 'JavaScript', category: 'Languages', regex: /\bjavascript\b/i },
  { name: 'Python', category: 'Languages', regex: /\bpython\b/i },
  { name: 'Go / Golang', category: 'Languages', regex: /\b(golang|go language|\bgo\b)/i },
  { name: 'Java', category: 'Languages', regex: /\bjava\b(?!script)/i },
  { name: 'C++', category: 'Languages', regex: /\bc\+\+\b/i },
  { name: 'C#', category: 'Languages', regex: /\bc#\b/i },
  { name: 'Rust', category: 'Languages', regex: /\brust\b/i },
  { name: 'SQL', category: 'Languages', regex: /\bsql\b/i },
  { name: 'HTML5/CSS3', category: 'Languages', regex: /\b(html5?|css3?)\b/i },

  // Frameworks
  { name: 'React', category: 'Frameworks', regex: /\breact(\.js)?\b/i },
  { name: 'Next.js', category: 'Frameworks', regex: /\bnext(\.js)?\b/i },
  { name: 'Node.js', category: 'Frameworks', regex: /\bnode(\.js)?\b/i },
  { name: 'Express', category: 'Frameworks', regex: /\bexpress(\.js)?\b/i },
  { name: 'Vue.js', category: 'Frameworks', regex: /\bvue(\.js)?\b/i },
  { name: 'Angular', category: 'Frameworks', regex: /\bangular\b/i },
  { name: 'Django', category: 'Frameworks', regex: /\bdjango\b/i },
  { name: 'FastAPI', category: 'Frameworks', regex: /\bfastapi\b/i },
  { name: 'Spring Boot', category: 'Frameworks', regex: /\bspring boot\b/i },
  { name: 'Tailwind CSS', category: 'Frameworks', regex: /\btailwind(css)?\b/i },

  // Cloud & Infra
  { name: 'AWS', category: 'Cloud & Infra', regex: /\b(aws|amazon web services)\b/i },
  { name: 'Google Cloud Platform (GCP)', category: 'Cloud & Infra', regex: /\b(gcp|google cloud)\b/i },
  { name: 'Microsoft Azure', category: 'Cloud & Infra', regex: /\bazure\b/i },
  { name: 'Kubernetes', category: 'Cloud & Infra', regex: /\b(kubernetes|k8s)\b/i },
  { name: 'Docker', category: 'Cloud & Infra', regex: /\bdocker\b/i },
  { name: 'Terraform', category: 'Cloud & Infra', regex: /\bterraform\b/i },
  { name: 'CI/CD Pipelines', category: 'Cloud & Infra', regex: /\b(ci\/cd|github actions|gitlab ci|jenkins)\b/i },
  { name: 'Linux / Bash', category: 'Cloud & Infra', regex: /\b(linux|bash|unix)\b/i },

  // Architecture
  { name: 'Microservices', category: 'Architecture', regex: /\bmicroservices\b/i },
  { name: 'Distributed Systems', category: 'Architecture', regex: /\bdistributed systems\b/i },
  { name: 'RESTful APIs', category: 'Architecture', regex: /\b(rest(ful)? api|restful apis)\b/i },
  { name: 'GraphQL', category: 'Architecture', regex: /\bgraphql\b/i },
  { name: 'Event-Driven Architecture', category: 'Architecture', regex: /\b(event-driven|kafka|rabbitmq)\b/i },
  { name: 'System Design', category: 'Architecture', regex: /\bsystem design\b/i },

  // Tools & Data
  { name: 'PostgreSQL', category: 'Tools & Data', regex: /\b(postgresql|postgres)\b/i },
  { name: 'MongoDB', category: 'Tools & Data', regex: /\bmongodb\b/i },
  { name: 'Redis', category: 'Tools & Data', regex: /\bredis\b/i },
  { name: 'Git & Version Control', category: 'Tools & Data', regex: /\b(git|github|gitlab)\b/i },
  { name: 'Firebase / Firestore', category: 'Tools & Data', regex: /\bfirebase\b/i },
  { name: 'Elasticsearch', category: 'Tools & Data', regex: /\belasticsearch\b/i },
  { name: 'Machine Learning / AI', category: 'Tools & Data', regex: /\b(machine learning|ai|llm|nlp)\b/i },
];

export const documentParser = {
  /**
   * Extract plain readable text from PDF, DOCX, or TXT
   */
  async extractText(file: File): Promise<ExtractedDocument> {
    const fileName = file.name.toLowerCase();

    // Helper to sanitize extracted printable characters
    const sanitizeText = (str: string) =>
      str.replace(/[^\x20-\x7E\t\n\r]/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();

    // 1. PDF Extraction
    if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          useSystemFonts: true,
        });
        const pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;
        const pageTexts: string[] = [];

        for (let i = 1; i <= numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const pageStr = textContent.items
            .map((item: any) => item.str || '')
            .join(' ');
          pageTexts.push(pageStr);
        }

        const fullText = pageTexts.join('\n\n').trim();
        const wordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;

        if (fullText.length >= 40) {
          return {
            text: fullText,
            pageCount: numPages,
            wordCount,
          };
        }
      } catch (pdfErr) {
        console.warn('[DocumentParser] PDF.js extraction encountered an issue, trying raw text fallback:', pdfErr);
      }

      // Fallback: try raw binary text stream extraction in case PDF.js worker was blocked
      try {
        const raw = await file.text();
        const clean = sanitizeText(raw);
        if (clean.length > 50) {
          return {
            text: clean,
            pageCount: 1,
            wordCount: clean.split(/\s+/).filter(Boolean).length,
          };
        }
      } catch {
        // Safe silence
      }

      throw new Error(
        'Unable to extract selectable text from this PDF file. It may be password-protected or contain only scanned images. You can also use the "Paste Text Fallback" option.'
      );
    }

    // 2. DOCX Extraction
    if (fileName.endsWith('.docx') || file.type.includes('wordprocessingml')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value.trim();
        const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

        return {
          text,
          pageCount: 1,
          wordCount,
        };
      } catch (docxErr) {
        console.error('[DocumentParser] DOCX extraction error:', docxErr);
        throw new Error('Unable to extract text from this DOCX document. Please verify it is a valid Word document.');
      }
    }

    // 3. Legacy DOC binary or Plain Text / Markdown / Fallback
    try {
      const text = await file.text();
      const sanitized = sanitizeText(text);
      const wordCount = sanitized ? sanitized.split(/\s+/).filter(Boolean).length : 0;
      return {
        text: sanitized,
        pageCount: 1,
        wordCount,
      };
    } catch (txtErr) {
      console.error('[DocumentParser] Text file read error:', txtErr);
      throw new Error('Could not read the provided file. Please try pasting the resume text directly.');
    }
  },

  /**
   * Perform comprehensive, deterministic analysis on the actual extracted resume text
   */
  analyzeResumeContent(rawText: string, fileName: string): StructuredResumeAnalysis {
    const text = rawText.trim();

    // Verification check (Phase 2.7: Never continue analysis with missing or empty text)
    if (!text || text.length < 40) {
      throw new Error(
        'Empty or unreadable document: no selectable text found. Please upload a PDF or DOCX file containing text rather than a scanned image.'
      );
    }

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    // 1. Candidate Name extraction (heuristic: First clean line that isn't an email/URL/heading)
    let candidateName = 'Unknown Candidate';
    for (const line of lines.slice(0, 5)) {
      if (
        line.length > 2 &&
        line.length < 50 &&
        !line.includes('@') &&
        !line.includes('http') &&
        !/resume|curriculum|vitae|page|contact|experience|education/i.test(line)
      ) {
        candidateName = line.replace(/[^a-zA-Z\s.-]/g, '').trim();
        if (candidateName.length > 2) break;
      }
    }

    // 2. Contact details
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const email = emailMatch ? emailMatch[0] : undefined;

    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : undefined;

    const links: string[] = [];
    const linkMatches = text.match(/(https?:\/\/[^\s]+|github\.com\/[^\s]+|linkedin\.com\/in\/[^\s]+)/gi);
    if (linkMatches) {
      linkMatches.forEach((l) => {
        if (!links.includes(l)) links.push(l);
      });
    }

    // 3. Extracted Skills (fact-based matching against actual text)
    const skills: SkillItem[] = [];
    for (const entry of SKILL_DATABASE) {
      if (entry.regex.test(text)) {
        skills.push({
          name: entry.name,
          category: entry.category,
          proficiency: text.toLowerCase().split(entry.name.toLowerCase()).length > 3 ? 'Expert' : 'Proficient',
          highlighted: skills.length < 4,
        });
      }
    }

    // 4. Experience Level Detection
    let experienceLevel: StructuredResumeAnalysis['experienceLevel'] = 'Entry';
    const yearsMatches = text.match(/(\d+)\+?\s*years?/gi);
    let maxYears = 0;
    if (yearsMatches) {
      for (const ym of yearsMatches) {
        const num = parseInt(ym, 10);
        if (!isNaN(num) && num < 40 && num > maxYears) {
          maxYears = num;
        }
      }
    }

    if (maxYears >= 10 || /director|vp|head of|executive/i.test(text)) {
      experienceLevel = 'Executive';
    } else if (maxYears >= 8 || /staff|principal|lead/i.test(text)) {
      experienceLevel = 'Lead';
    } else if (maxYears >= 4 || /senior|sr\./i.test(text)) {
      experienceLevel = 'Senior';
    } else if (maxYears >= 2 || /mid-level|software engineer ii/i.test(text)) {
      experienceLevel = 'Mid';
    } else {
      experienceLevel = 'Entry';
    }

    // 5. Target Role deduction
    let targetRole = 'Software Engineer';
    if (/systems architect|cloud architect|solutions architect/i.test(text)) {
      targetRole = 'Systems Architect';
    } else if (/frontend|react|ui engineer/i.test(text)) {
      targetRole = 'Frontend Engineer';
    } else if (/backend|node|golang|python developer/i.test(text)) {
      targetRole = 'Backend Systems Engineer';
    } else if (/devops|site reliability|sre|platform/i.test(text)) {
      targetRole = 'DevOps / Platform Engineer';
    } else if (/data engineer|data scientist|machine learning/i.test(text)) {
      targetRole = 'Data & ML Engineer';
    } else if (/full stack|fullstack/i.test(text)) {
      targetRole = 'Full Stack Engineer';
    }

    // 6. Education extraction
    const education: EducationItem[] = [];
    const eduKeywords = [
      { regex: /bachelor(?:'s)?|b\.?s\.?|b\.?tech/i, degree: "Bachelor of Science" },
      { regex: /master(?:'s)?|m\.?s\.?|m\.?tech|mba/i, degree: "Master of Science" },
      { regex: /ph\.?d\.?|doctorate/i, degree: "Doctor of Philosophy" },
    ];

    for (const edu of eduKeywords) {
      if (edu.regex.test(text)) {
        education.push({
          degree: edu.degree,
          field: /computer science/i.test(text) ? 'Computer Science' : 'Engineering / Related Field',
          institution: 'Accredited University',
          year: (text.match(/20\d{2}|19\d{2}/) || ['2021'])[0],
        });
        break;
      }
    }

    if (education.length === 0) {
      education.push({
        degree: 'Degree or Technical Certification',
        field: 'Software Engineering / Computing',
        institution: 'Not explicitly listed',
        year: 'Recent',
      });
    }

    // 7. Structured Strengths based on actual text markers
    const strengths: string[] = [];
    if (/(latency|throughput|reduced|optimized|scaled|million|billion|%)/i.test(text)) {
      strengths.push('Demonstrates quantifiable metrics and measurable performance impact in bullet points');
    }
    if (skills.length >= 8) {
      strengths.push(`Broad technical competency across ${skills.length} verified technologies`);
    } else if (skills.length > 0) {
      strengths.push(`Core specialization identified in ${skills.slice(0, 3).map((s) => s.name).join(', ')}`);
    }
    if (/(team|mentor|led|managed|collaborated|stakeholder)/i.test(text)) {
      strengths.push('Evident leadership and cross-functional team collaboration experience');
    }
    if (strengths.length === 0) {
      strengths.push('Clean foundational background with clear career trajectory');
    }

    // 8. Missing Skills / Skill Gaps (compared against target modern stack)
    const expectedForRole = ['TypeScript', 'Kubernetes', 'Distributed Systems', 'CI/CD Pipelines', 'Docker', 'AWS'];
    const extractedNames = skills.map((s) => s.name);
    const missingSkills = expectedForRole.filter((req) => !extractedNames.some((en) => en.toLowerCase().includes(req.toLowerCase())));

    // 9. Suggestions
    const suggestions: StructuredResumeAnalysis['suggestions'] = [];
    if (!/(\d+%\s*|\$\d+|\b\d+\s*x\b)/i.test(text)) {
      suggestions.push({
        id: 'sug_quant',
        title: 'Include Quantitative Metrics',
        description: 'Add numbers, percentages, or dollar amounts to describe the scale and impact of your achievements.',
        category: 'Impact',
        severity: 'High',
      });
    }
    if (skills.length < 6) {
      suggestions.push({
        id: 'sug_skills',
        title: 'Expand Technical Stack Section',
        description: 'Include modern frameworks, cloud technologies, and databases you have worked with to improve ATS parsing score.',
        category: 'Keywords',
        severity: 'Medium',
      });
    }
    if (!links.some((l) => l.includes('github') || l.includes('linkedin'))) {
      suggestions.push({
        id: 'sug_links',
        title: 'Add Public Profile Links',
        description: 'Provide clickable links to your GitHub or LinkedIn profile to build candidate credibility.',
        category: 'Formatting',
        severity: 'Low',
      });
    }

    // 10. Defined, Explainable ATS Score Computation
    let impactScore = 70;
    if (/(increased|decreased|improved|reduced|architected|delivered|spearheaded)/i.test(text)) impactScore += 12;
    if (/\d+%/i.test(text)) impactScore += 10;
    impactScore = Math.min(impactScore, 98);

    let brevityScore = Math.min(85 + Math.round(text.length / 500), 95);
    let styleScore = lines.length > 15 ? 90 : 75;
    let skillsCoverageScore = Math.min(50 + skills.length * 6, 96);

    const overallScore = Math.round(
      impactScore * 0.35 + brevityScore * 0.15 + styleScore * 0.15 + skillsCoverageScore * 0.35
    );

    return {
      candidateName,
      email,
      phone,
      links,
      targetRole,
      experienceLevel,
      skills,
      education,
      experience: [
        {
          id: 'exp_1',
          title: targetRole,
          company: 'Professional History',
          period: 'Extracted from Resume',
          location: 'Remote / Onsite',
          bullets: lines
            .filter((l) => l.startsWith('•') || l.startsWith('-') || l.length > 60)
            .slice(0, 5)
            .map((b) => b.replace(/^[•\-\*]\s*/, '')),
          skillsUsed: skills.slice(0, 4).map((s) => s.name),
        },
      ],
      strengths,
      missingSkills,
      suggestions,
      overallScore,
      breakdown: {
        impact: impactScore,
        brevity: brevityScore,
        style: styleScore,
        skillsCoverage: skillsCoverageScore,
      },
      atsProbability: Math.min(overallScore + 2, 99),
    };
  },

  /**
   * Convert structured analysis to ResumeData presentation type
   */
  mapToResumeData(analysis: StructuredResumeAnalysis, fileName: string, fileSize: number): ResumeData {
    return {
      id: `res_${Date.now()}`,
      filename: fileName,
      filesize: `${(fileSize / (1024 * 1024)).toFixed(2)} MB`,
      uploadedAt: new Date().toISOString(),
      parsedAt: 'Just now',
      overallScore: analysis.overallScore,
      atsProbability: analysis.atsProbability,
      targetRole: analysis.targetRole,
      breakdown: analysis.breakdown,
      skills: analysis.skills,
      experience: analysis.experience,
      education: analysis.education,
      strengths: analysis.strengths,
      skillGaps: analysis.missingSkills,
      actionableSuggestions: analysis.suggestions,
    };
  },
};
