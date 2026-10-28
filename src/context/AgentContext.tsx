import React, { createContext, useContext, useState, useEffect } from 'react';
import { AgentMessage, ConfirmationRequest, ToolExecutionRecord } from '../types/agent';
import { agentPlanner } from '../services/agentPlanner';

interface ActionHistoryEntry {
  id: string;
  action: string;
  result: string;
  timestamp: string;
}

interface AgentContextType {
  isOpen: boolean;
  isMinimized: boolean;
  messages: AgentMessage[];
  isThinking: boolean;
  activeTool: ToolExecutionRecord | null;
  pendingConfirmation: ConfirmationRequest | null;
  actionHistory: ActionHistoryEntry[];
  toggleOpen: () => void;
  openAgentWithPrompt: (prompt: string) => void;
  toggleMinimize: () => void;
  sendMessage: (text: string) => Promise<void>;
  confirmAction: (confirmationId: string) => Promise<void>;
  cancelAction: (confirmationId: string) => void;
  clearHistory: () => void;
}

const INITIAL_WELCOME_MESSAGE: AgentMessage = {
  id: 'msg_welcome',
  sender: 'agent',
  text:
    'Hello! I am your **Resume2Hire AI Agent** — an action-taking career assistant. I can analyze your resume, discover verified jobs matched to your skills, prepare interview drills, and execute application tracking with your explicit approval.',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  suggestedActions: [
    'Analyze my uploaded resume',
    'Find jobs matching my skills',
    'Show my application history',
    'Explain what I should do next',
  ],
};

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [messages, setMessages] = useState<AgentMessage[]>(() => {
    try {
      const stored = sessionStorage.getItem('r2h_agent_messages');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Safe silence
    }
    return [INITIAL_WELCOME_MESSAGE];
  });

  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<ToolExecutionRecord | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequest | null>(null);
  const [actionHistory, setActionHistory] = useState<ActionHistoryEntry[]>(() => {
    try {
      const stored = sessionStorage.getItem('r2h_agent_history');
      if (stored) return JSON.parse(stored);
    } catch {
      // Safe silence
    }
    return [];
  });

  // Persist session messages
  useEffect(() => {
    try {
      sessionStorage.setItem('r2h_agent_messages', JSON.stringify(messages));
    } catch {
      // Safe silence
    }
  }, [messages]);

  // Persist action ledger
  useEffect(() => {
    try {
      sessionStorage.setItem('r2h_agent_history', JSON.stringify(actionHistory));
    } catch {
      // Safe silence
    }
  }, [actionHistory]);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    if (isMinimized) setIsMinimized(false);
  };

  const openAgentWithPrompt = (prompt: string) => {
    setIsOpen(true);
    setIsMinimized(false);
    sendMessage(prompt);
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  const clearHistory = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setPendingConfirmation(null);
    setActiveTool(null);
    setActionHistory([]);
    sessionStorage.removeItem('r2h_agent_messages');
    sessionStorage.removeItem('r2h_agent_history');
  };

  const sendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isThinking) return;

    const userMessage: AgentMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    // 1. Planner interprets natural language task
    const plannedTask = agentPlanner.planTask(trimmed);

    const toolRecord: ToolExecutionRecord = {
      action: plannedTask.action,
      status: 'running',
      message: `Executing: ${plannedTask.reasoning}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setActiveTool(toolRecord);

    try {
      // Add a slight natural cadence (300-500ms) for real tool dispatch
      await new Promise((res) => setTimeout(res, 350));

      // 2. Execute verified tool
      const result = await agentPlanner.executeTask(plannedTask);

      // Record in action history ledger
      const historyEntry: ActionHistoryEntry = {
        id: `act_${Date.now()}`,
        action: result.action,
        result: result.status,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActionHistory((prev) => [historyEntry, ...prev.slice(0, 19)]);

      const agentMessage: AgentMessage = {
        id: `msg_a_${Date.now()}`,
        sender: 'agent',
        text: result.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecution: {
          action: result.action,
          status: result.ok ? 'success' : 'failed',
          message: result.status,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        confirmationRequest: result.requires_confirmation ? result.confirmation_details : undefined,
        structuredData: result.data,
        suggestedActions: result.suggested_followups,
      };

      if (result.requires_confirmation && result.confirmation_details) {
        setPendingConfirmation(result.confirmation_details);
      }

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during tool execution.';
      const errorMessage: AgentMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'agent',
        text: `Execution failed: ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecution: {
          action: plannedTask.action,
          status: 'failed',
          message: errorMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        suggestedActions: ['Analyze my uploaded resume', 'Find jobs matching my skills'],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
      setActiveTool(null);
    }
  };

  const confirmAction = async (confirmationId: string) => {
    if (!pendingConfirmation || pendingConfirmation.id !== confirmationId) return;

    setIsThinking(true);
    setActiveTool({
      action: pendingConfirmation.action,
      status: 'running',
      message: `Confirmed. Committing application record...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    try {
      const finalResult = await agentPlanner.confirmAndExecute(pendingConfirmation);

      // Add to action ledger
      setActionHistory((prev) => [
        {
          id: `act_${Date.now()}`,
          action: finalResult.action,
          result: finalResult.status,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 19),
      ]);

      const successMessage: AgentMessage = {
        id: `msg_conf_done_${Date.now()}`,
        sender: 'agent',
        text: finalResult.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecution: {
          action: finalResult.action,
          status: finalResult.ok ? 'success' : 'failed',
          message: finalResult.status,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        structuredData: finalResult.data,
        suggestedActions: finalResult.suggested_followups,
      };

      setMessages((prev) => [...prev, successMessage]);
      setPendingConfirmation(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Confirmation action failed.';
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'agent',
          text: `Action could not be completed: ${errorMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
      setActiveTool(null);
    }
  };

  const cancelAction = (confirmationId: string) => {
    if (pendingConfirmation && pendingConfirmation.id === confirmationId) {
      setPendingConfirmation(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_canc_${Date.now()}`,
          sender: 'agent',
          text: 'Application submission cancelled. No changes were committed to your pipeline.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: ['Find jobs matching my skills', 'Show my application history'],
        },
      ]);
    }
  };

  return (
    <AgentContext.Provider
      value={{
        isOpen,
        isMinimized,
        messages,
        isThinking,
        activeTool,
        pendingConfirmation,
        actionHistory,
        toggleOpen,
        openAgentWithPrompt,
        toggleMinimize,
        sendMessage,
        confirmAction,
        cancelAction,
        clearHistory,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
