/**
 * AI Prompt Configuration
 * 
 * Centralized configuration for system prompts.
 * Switch between different prompt modes based on use case.
 */

import { systemPrompt as enterprisePrompt } from "./system-prompt";
import eduPlexoAssistantPrompt from "./eduplexo-assistant-prompt";
import { studentAnalysisPrompt } from "./student-analysis";

/**
 * Available prompt modes
 */
export enum PromptMode {
  ENTERPRISE = "enterprise",     // Original enterprise ERP copilot
  ASSISTANT = "assistant",       // New conversational assistant
  HYBRID = "hybrid",             // Combination of both
}

/**
 * Prompt configuration
 */
export interface PromptConfig {
  mode: PromptMode;
  includeStudentAnalysis: boolean;
  customContext?: string;
}

/**
 * Default configuration
 */
export const defaultPromptConfig: PromptConfig = {
  mode: PromptMode.ASSISTANT,  // Use new assistant by default
  includeStudentAnalysis: true,
};

/**
 * Get system prompt based on configuration
 */
export function getSystemPrompt(config: PromptConfig = defaultPromptConfig): string {
  let prompt = "";

  switch (config.mode) {
    case PromptMode.ENTERPRISE:
      prompt = enterprisePrompt;
      break;

    case PromptMode.ASSISTANT:
      prompt = eduPlexoAssistantPrompt;
      break;

    case PromptMode.HYBRID:
      // Combine both prompts
      prompt = `${eduPlexoAssistantPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENTERPRISE OPERATIONAL GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${enterprisePrompt}`;
      break;

    default:
      prompt = eduPlexoAssistantPrompt;
  }

  // Add student analysis if enabled
  if (config.includeStudentAnalysis) {
    prompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPECIALIZED SKILLS: STUDENT ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${studentAnalysisPrompt}`;
  }

  // Add custom context if provided
  if (config.customContext) {
    prompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADDITIONAL CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${config.customContext}`;
  }

  return prompt;
}

/**
 * Get prompt with dynamic context injection
 */
export function getSystemPromptWithContext(
  config: PromptConfig = defaultPromptConfig,
  dynamicContext?: {
    currentDate?: string;
    schoolName?: string;
    academicYear?: string;
    userName?: string;
    userRole?: string;
  }
): string {
  let prompt = getSystemPrompt(config);

  // Inject dynamic context
  if (dynamicContext) {
    const contextSection = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${dynamicContext.currentDate ? `- Current Date: ${dynamicContext.currentDate}` : ""}
${dynamicContext.schoolName ? `- School Name: ${dynamicContext.schoolName}` : ""}
${dynamicContext.academicYear ? `- Academic Year: ${dynamicContext.academicYear}` : ""}
${dynamicContext.userName ? `- Logged-in User: ${dynamicContext.userName}` : ""}
${dynamicContext.userRole ? `- User Role: ${dynamicContext.userRole}` : ""}

Personalize responses using this context. E.g., "آپ کے اسکول ${dynamicContext.schoolName || "[School Name]"} میں..."`;

    prompt += contextSection;
  }

  return prompt;
}

/**
 * Quick access functions
 */
export const getEnterprisePrompt = () => getSystemPrompt({ mode: PromptMode.ENTERPRISE, includeStudentAnalysis: true });
export const getAssistantPrompt = () => getSystemPrompt({ mode: PromptMode.ASSISTANT, includeStudentAnalysis: true });
export const getHybridPrompt = () => getSystemPrompt({ mode: PromptMode.HYBRID, includeStudentAnalysis: true });
