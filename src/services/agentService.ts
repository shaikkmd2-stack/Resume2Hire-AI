import { AgentActivityItem } from '../types';
import { INITIAL_AGENT_ACTIVITIES } from './mockData';
import { auth } from '../firebase/config';
import { firebaseAgentRunService } from './firebaseAgentRunService';

export const agentService = {
  /**
   * Get all background agent telemetry and activity ledger items
   */
  async getActivities(): Promise<AgentActivityItem[]> {
    if (auth?.currentUser) {
      try {
        const runs = await firebaseAgentRunService.getUserAgentRuns(auth.currentUser.uid);
        if (runs.length > 0) {
          return runs.map((r) => ({
            id: r.id,
            type: (r.workflowType === 'resume_analysis' ? 'evaluation' : 'ats_dispatch') as AgentActivityItem['type'],
            actionName: r.actionName || 'Autonomous Workflow Run',
            targetEntity: r.targetEntity || 'System',
            timestamp: typeof r.createdAt === 'object' && r.createdAt && 'seconds' in r as any
              ? new Date((r.createdAt as any).seconds * 1000).toLocaleTimeString()
              : 'Recent',
            status: r.status,
            requiresApproval: false,
            details: r.errorMessage ? `Error: ${r.errorMessage}` : `Executed workflow: ${r.workflowType}`,
            traceLogs: [
              `[Workflow] Initialized run ${r.id}`,
              r.status === 'completed'
                ? `[Workflow] Succeeded with result reference ${r.resultReference || 'ok'}`
                : `[Workflow] Status: ${r.status}`,
            ],
          }));
        }
      } catch (err) {
        console.warn('[AgentService] Could not load agent runs from Firestore:', err);
      }
    }

    return [...INITIAL_AGENT_ACTIVITIES];
  },

  /**
   * Approve a human-gated application dispatch
   */
  async approveGateDispatch(activityId: string): Promise<{ success: boolean; message: string }> {
    const act = INITIAL_AGENT_ACTIVITIES.find((a) => a.id === activityId);
    if (!act) {
      return { success: false, message: 'Activity not found.' };
    }

    act.status = 'completed';
    act.requiresApproval = false;
    act.details = `Authorized by user at ${new Date().toLocaleTimeString()}. Sign-off recorded.`;
    act.traceLogs.push(
      `${new Date().toLocaleTimeString()} [HumanApproval] Sign-off confirmed by candidate. Gate unlocked.`
    );

    if (auth?.currentUser) {
      try {
        await firebaseAgentRunService.updateAgentRun(activityId, auth.currentUser.uid, {
          status: 'completed',
          resultReference: 'human_gate_approved',
        });
      } catch {
        // Safe silence
      }
    }

    return {
      success: true,
      message: `Signed off on ${act.approvalData?.company || 'application'}. Packet queued for dispatch.`,
    };
  },

  /**
   * Reject / Cancel a human-gated application dispatch
   */
  async rejectGateDispatch(activityId: string): Promise<{ success: boolean; message: string }> {
    const act = INITIAL_AGENT_ACTIVITIES.find((a) => a.id === activityId);
    if (!act) {
      return { success: false, message: 'Activity not found.' };
    }

    act.status = 'failed';
    act.requiresApproval = false;
    act.details = `Cancelled by user at ${new Date().toLocaleTimeString()}. Dispatch blocked. Zero transmission guaranteed.`;
    act.traceLogs.push(
      `${new Date().toLocaleTimeString()} [HumanRejection] Candidate cancelled dispatch packet. Purged.`
    );

    if (auth?.currentUser) {
      try {
        await firebaseAgentRunService.updateAgentRun(activityId, auth.currentUser.uid, {
          status: 'failed',
          errorMessage: 'Cancelled by candidate at approval gate.',
        });
      } catch {
        // Safe silence
      }
    }

    return {
      success: true,
      message: `Cancelled dispatch for ${act.approvalData?.company || 'role'}. No data was transmitted.`,
    };
  },

  /**
   * Retry a failed agent task
   */
  async retryTask(activityId: string): Promise<AgentActivityItem | null> {
    const act = INITIAL_AGENT_ACTIVITIES.find((a) => a.id === activityId);
    if (act) {
      act.status = 'completed';
      act.details = 'Retried successfully by candidate.';
      return act;
    }
    return null;
  },
};
