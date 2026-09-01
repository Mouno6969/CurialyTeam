// Registers the Telegram webhook with its secret token.
// Run after a deploy that changes PUBLIC_BASE_URL or the webhook secret:
//   sudo bash -c 'set -a; . /etc/curialy-api/curialy-api.env; set +a; node scripts/set-webhook.js'
import { setWebhook } from "../src/telegram.js";

const { url, result } = await setWebhook();
console.log(`webhook -> ${url}`);
console.log(`ok=${result.ok} ${result.description ?? ""}`);
process.exit(result.ok ? 0 : 1);
