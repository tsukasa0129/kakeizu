// Worker secrets (not in wrangler.jsonc, so `wrangler types` doesn't generate them).
// Set with: npx wrangler secret put ANTHROPIC_API_KEY
interface Env {
  ANTHROPIC_API_KEY?: string;
}
