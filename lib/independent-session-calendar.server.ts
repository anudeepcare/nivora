import "server-only";
/** Inactive entry point. No runtime endpoint or consumer is authorized by this module. */
export {
  scheduledSession,
  latestScheduledClose,
} from "./independent-session-calendar";
