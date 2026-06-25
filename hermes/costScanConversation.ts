import { FormState } from "@/features/cost-scan/types";
import { questionnaire, Question, QuestionId } from "./questionnaire";
import { submitHermesScan, ApiSubmissionResult } from "./apiClient";
import { handleHermesResponse, HermesResponse } from "./responseHandler";

export type ConversationState = {
  currentIndex: number;
  answers: Partial<FormState>;
  isComplete: boolean;
  isSubmitting: boolean;
  result: ApiSubmissionResult | null;
  hermesResponse: HermesResponse | null;
};

export class CostScanConversation {
  private state: ConversationState;

  constructor() {
    this.state = {
      currentIndex: -1, // -1 means we haven't started yet
      answers: {
        ref: "co-hermes",
      },
      isComplete: false,
      isSubmitting: false,
      result: null,
      hermesResponse: null,
    };
  }

  public getState(): ConversationState {
    return this.state;
  }

  public getGreeting(): string {
    return "I can help you run a quick AI Cost Scan.\n\nIt takes about 3 minutes and will show where your AI costs may be leaking.";
  }

  public start(): Question {
    this.state.currentIndex = 0;
    return this.getCurrentQuestion()!;
  }

  public getCurrentQuestion(): Question | null {
    if (this.state.currentIndex < 0 || this.state.currentIndex >= questionnaire.length) {
      return null;
    }
    return questionnaire[this.state.currentIndex];
  }

  public async answerCurrentQuestion(answer: any): Promise<Question | HermesResponse | null> {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) {
      return null;
    }

    if (currentQuestion.id === "contact_info") {
      // Assuming answer is an object with { firstname, lastname, email, company, job_title }
      if (!this.validateContactInfo(answer)) {
        throw new Error("Invalid contact info. Email, company, and name are required.");
      }
      this.state.answers = { ...this.state.answers, ...answer };
    } else {
      // Handle regular questions
      (this.state.answers as any)[currentQuestion.id] = answer;
    }

    this.state.currentIndex++;

    if (this.state.currentIndex >= questionnaire.length) {
      this.state.isComplete = true;
      return await this.submit();
    }

    return this.getCurrentQuestion();
  }

  private validateContactInfo(info: any): boolean {
    if (!info.email || !info.company || !info.firstname) {
      return false;
    }
    return true;
  }

  private async submit(): Promise<HermesResponse> {
    this.state.isSubmitting = true;
    try {
      const result = await submitHermesScan(this.state.answers);
      this.state.result = result;
      const hermesResponse = handleHermesResponse(result);
      this.state.hermesResponse = hermesResponse;
      return hermesResponse;
    } catch (error) {
      const errorResponse = handleHermesResponse({ success: false });
      this.state.hermesResponse = errorResponse;
      return errorResponse;
    } finally {
      this.state.isSubmitting = false;
    }
  }
}
