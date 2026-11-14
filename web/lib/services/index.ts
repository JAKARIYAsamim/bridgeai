// Screens import services from here only. Phase 2 swaps these exports for the real implementations.
export {
  authService, childService, libraryService, planService, feedbackService, aiService, reminderService, alertService,
} from "./mock";
export { resetDB as resetDemoData, subscribe as subscribeToData, getRev as dataRevision } from "./mock/store";
