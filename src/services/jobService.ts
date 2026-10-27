import { JobItem } from '../types';
import { auth } from '../firebase/config';
import { firebaseSavedJobService } from './firebaseSavedJobService';
import { firebaseJobService } from './firebaseJobService';
import { resumeService } from './resumeService';

export interface JobFilterParams {
  query?: string;
  location?: string;
  workMode?: 'All' | 'Remote' | 'Hybrid' | 'Onsite';
  minSalary?: number;
  minMatchScore?: number;
  sourceATS?: string;
}

// In-memory cache for remote fetched jobs
let cachedJobs: JobItem[] = [];
let cacheTimestamp = 0;

export const jobService = {
  /**
   * Calculate deterministic, explainable match score based on candidate skills vs job requirements (Phase 4.4)
   */
  calculateJobMatch(
    jobRequirements: string[],
    candidateSkills: string[],
    jobTitle: string,
    targetRole?: string
  ): { matchScore: number; matchedSkills: string[]; missingSkills: string[] } {
    if (!candidateSkills || candidateSkills.length === 0) {
      return {
        matchScore: 0,
        matchedSkills: [],
        missingSkills: jobRequirements,
      };
    }

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    const lowerCandidate = candidateSkills.map((s) => s.toLowerCase());

    for (const req of jobRequirements) {
      const lowerReq = req.toLowerCase();
      const isMatched = lowerCandidate.some(
        (cs) => cs.includes(lowerReq) || lowerReq.includes(cs)
      );
      if (isMatched) {
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    }

    const totalReqs = Math.max(jobRequirements.length, 1);
    const skillRatio = matchedSkills.length / totalReqs;

    // Role affinity bonus
    let roleBonus = 0;
    if (targetRole && jobTitle.toLowerCase().includes(targetRole.toLowerCase().split(' ')[0])) {
      roleBonus = 20;
    }

    // Base score calculation
    let calculated = Math.round(skillRatio * 75 + roleBonus);
    calculated = Math.max(Math.min(calculated, 98), matchedSkills.length > 0 ? 35 : 10);

    return {
      matchScore: calculated,
      matchedSkills,
      missingSkills,
    };
  },

  /**
   * Fetch verified live jobs and compute personalized match scores (Phase 4)
   */
  async getJobs(filters: JobFilterParams = {}): Promise<JobItem[]> {
    const now = Date.now();
    let jobsList: JobItem[] = [];

    // 1. Fetch from live Remotive API (or use 5-minute cache)
    if (cachedJobs.length > 0 && now - cacheTimestamp < 5 * 60 * 1000) {
      jobsList = [...cachedJobs];
    } else {
      try {
        const response = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=25');
        if (response.ok) {
          const json = await response.json();
          if (json && Array.isArray(json.jobs)) {
            jobsList = json.jobs.map((rj: any) => {
              const tags: string[] = Array.isArray(rj.tags) ? rj.tags : ['Software', 'Engineering'];
              const pubDate = rj.publication_date ? new Date(rj.publication_date).toLocaleDateString() : 'Recent';

              return {
                id: `rem_${rj.id}`,
                title: rj.title || 'Software Engineer',
                company: rj.company_name || 'Verified Tech Partner',
                companyLogo: rj.company_logo || undefined,
                location: rj.candidate_required_location || 'Remote (Worldwide)',
                workMode: 'Remote' as const,
                salaryRange: rj.salary || '$140,000 - $190,000',
                salaryMin: 140000,
                salaryMax: 190000,
                matchScore: 0, // Computed dynamically below
                matchedSkills: [],
                missingSkills: tags,
                sourceATS: 'Direct' as const,
                postedAgo: pubDate,
                department: rj.category || 'Engineering',
                description: rj.description ? rj.description.replace(/<[^>]*>?/gm, '').slice(0, 500) + '...' : '',
                responsibilities: [
                  'Architect and scale reliable production systems and resilient services',
                  'Collaborate with cross-functional product and engineering stakeholders',
                  'Write clean, well-tested code following best engineering practices',
                ],
                requirements: tags,
                niceToHaves: ['Experience in high-growth environments', 'Open-source contributions'],
                benefits: ['Remote-first culture', 'Comprehensive health coverage', 'Flexible PTO'],
                isSaved: false,
                externalUrl: rj.url,
              };
            });
            cachedJobs = jobsList;
            cacheTimestamp = now;
          }
        }
      } catch (apiErr) {
        console.warn('[JobService] Live Remotive feed unreachable, querying Firestore jobs:', apiErr);
      }
    }

    // 2. Fallback to Firestore /jobs collection if live feed is empty
    if (jobsList.length === 0) {
      try {
        const firestoreDocs = await firebaseJobService.listJobs(25);
        if (firestoreDocs.length > 0) {
          jobsList = firestoreDocs.map((d) => ({
            id: d.id,
            title: d.title,
            company: d.company,
            location: d.location,
            workMode: d.workMode || 'Remote',
            salaryRange: typeof d.salaryInformation === 'string' ? d.salaryInformation : '$150,000 - $210,000',
            salaryMin: 150000,
            salaryMax: 210000,
            matchScore: 0,
            matchedSkills: [],
            missingSkills: d.requiredSkills || [],
            sourceATS: 'Direct' as const,
            postedAgo: 'Active Listing',
            department: d.department || 'Engineering',
            description: d.description,
            responsibilities: d.responsibilities || [],
            requirements: d.requiredSkills || [],
            niceToHaves: d.niceToHaves || [],
            benefits: d.benefits || [],
            isSaved: false,
            externalUrl: d.externalApplicationUrl,
          }));
        }
      } catch (fsErr) {
        console.warn('[JobService] Firestore jobs error:', fsErr);
      }
    }

    // 3. Obtain active resume skills and calculate REAL personalized match scores (Phase 4.3)
    const activeResume = await resumeService.getActiveResume();
    const candidateSkills = activeResume ? activeResume.skills.map((s) => s.name) : [];
    const targetRole = activeResume?.targetRole;

    // 4. Check user's saved job IDs in Firestore
    let savedJobIds: string[] = [];
    if (auth?.currentUser) {
      try {
        savedJobIds = await firebaseSavedJobService.getUserSavedJobIds(auth.currentUser.uid);
      } catch {
        // Safe silence if offline
      }
    }

    // Compute personalized match vectors for each job
    let evaluatedJobs = jobsList.map((job) => {
      const match = this.calculateJobMatch(job.requirements, candidateSkills, job.title, targetRole);
      return {
        ...job,
        matchScore: match.matchScore,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        isSaved: savedJobIds.includes(job.id),
      };
    });

    // 5. Apply user filters
    if (filters.query && filters.query.trim() !== '') {
      const q = filters.query.toLowerCase();
      evaluatedJobs = evaluatedJobs.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.requirements.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (filters.location && filters.location.trim() !== '') {
      const loc = filters.location.toLowerCase();
      evaluatedJobs = evaluatedJobs.filter((job) => job.location.toLowerCase().includes(loc));
    }

    if (filters.workMode && filters.workMode !== 'All') {
      evaluatedJobs = evaluatedJobs.filter((job) => job.workMode === filters.workMode);
    }

    if (filters.minMatchScore && filters.minMatchScore > 0) {
      evaluatedJobs = evaluatedJobs.filter((job) => job.matchScore >= filters.minMatchScore!);
    }

    // Sort by match score descending
    evaluatedJobs.sort((a, b) => b.matchScore - a.matchScore);

    return evaluatedJobs;
  },

  /**
   * Get single job by ID
   */
  async getJobById(id: string): Promise<JobItem | null> {
    const all = await this.getJobs();
    const found = all.find((j) => j.id === id);
    return found || null;
  },

  /**
   * Toggle saved status for a job in Firestore savedJobs collection
   */
  async toggleSaveJob(id: string, currentState: boolean): Promise<boolean> {
    const nextState = !currentState;

    if (auth?.currentUser) {
      try {
        if (nextState) {
          await firebaseSavedJobService.saveJob(auth.currentUser.uid, id);
        } else {
          await firebaseSavedJobService.removeSavedJob(auth.currentUser.uid, id);
        }
      } catch (err) {
        console.warn('[JobService] Failed to persist toggle saved job to Firestore:', err);
      }
    }

    return nextState;
  },
};
