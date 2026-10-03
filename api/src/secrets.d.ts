// Worker secrets (not in wrangler.jsonc, so `wrangler types` doesn't generate them).
interface Env {
  /** Lets a request pick the AI reading model with the x-extract-model header (for comparing models). Unset = off. */
  EXTRACT_DEBUG_KEY?: string;
}
