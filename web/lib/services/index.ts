// Screens import services from here only. The mock↔live switch lives here.
//
// Live turns on when NEXT_PUBLIC_DATA_MODE=live, OR NEXT_PUBLIC_LIVE_SERVICES is
// non-empty (same signal the middleware uses). It's all-or-nothing on purpose: the
// seeded data is keyed to the real demo users, so mixing live auth with mock data
// would show empty screens.
import * as live from "./live";
import * as liveStore from "./live/store";
import * as mock from "./mock";
import * as mockStore from "./mock/store";

const LIVE =
  process.env.NEXT_PUBLIC_DATA_MODE === "live" ||
  (process.env.NEXT_PUBLIC_LIVE_SERVICES ?? "").trim().length > 0;

const impl = LIVE ? live : mock;
const store = LIVE ? liveStore : mockStore;

export const {
  authService, childService, libraryService, planService, feedbackService, aiService, reminderService, alertService,
} = impl;
export const resetDemoData = store.resetDB;
export const subscribeToData = store.subscribe;
export const dataRevision = store.getRev;
