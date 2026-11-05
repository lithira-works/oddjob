#!/usr/bin/env node
/**
 * Privacy check. Scans what git is about to store (the index) for secrets, personal data
 * and privacy rule breaks. Runs on pre-commit (.githooks/pre-commit) and in CI.
 *
 *   npm run privacy
 *
 * For a line that is a checked false positive, add the comment: privacy-check-ignore
 * This reduces risk. It does not prove a repo is clean, so never rely on it alone.
 */
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** Files that should never be committed, whatever they contain. */
export const FORBIDDEN_FILES = [
  { pattern: /(^|\/)\.env(\.(?!example$)[^/]+)?$/, why: "environment file" },
  { pattern: /\.(pem|key|p8|p12|pfx|jks|keystore)$/i, why: "private key or certificate store" },
  { pattern: /(^|\/)id_(rsa|ed25519|ecdsa)/, why: "SSH key" },
  { pattern: /(^|\/)(credentials[^/]*|[^/]*service-?account[^/]*)\.json$/i, why: "credentials file" },
  { pattern: /\.(dump|bak|backup|sqlite3?|db|sql\.gz|sql\.zip|tfstate)$/i, why: "database or state copy" },
  { pattern: /\.(csv|xlsx)$/i, why: "spreadsheet, which may hold customer data" },
  { pattern: /(^|\/)(backups|dumps|exports|uploads|user-data|id-documents|logs)\//, why: "folder for customer data or logs" },
  { pattern: /\.log$/i, why: "log file" },
];

const SECRET_RULES = [
  { name: "Anthropic API key", pattern: /\bsk-ant-[A-Za-z0-9_-]{16,}/ },
  { name: "GitHub token", pattern: /\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/ },
  { name: "AWS access key", pattern: /\b(AKIA|ASIA)[A-Z0-9]{16}\b/ },
  { name: "Google API key", pattern: /\bAIza[A-Za-z0-9_-]{30,}\b/ },
  { name: "Supabase secret key", pattern: /\bsb_secret_[A-Za-z0-9_-]{16,}/ },
  { name: "Stripe live key", pattern: /\b[spr]k_live_[A-Za-z0-9]{10,}\b/ },
  { name: "Slack token", pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "private key block", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "signed token (JWT)", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: "database URL with a password", pattern: /\b(postgres(ql)?|mysql|mongodb(\+srv)?|redis):\/\/[^\s:/@]+:[^\s@/]{3,}@/ },
  {
    name: "hard-coded secret",
    pattern: /\b(api[_-]?key|secret|password|passwd|service[_-]?role[_-]?key|auth[_-]?token)\b["']?\s*[:=]\s*["'][A-Za-z0-9_\-+/=.]{12,}["']/i,
  },
];

const PERSONAL_RULES = [
  {
    name: "email address",
    pattern: /\b[A-Za-z0-9._%+-]+@(?!(?:[a-z0-9-]+\.)*(?:example\.(?:com|org|net)|users\.noreply\.github\.com)\b)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/,
  },
  { name: "Sri Lankan phone number", pattern: /(?<![\w.])(?:\+94|0094|0)[\s-]?7\d[\s-]?\d{3}[\s-]?\d{4}(?![\w])/ },
  { name: "Sri Lankan national ID", pattern: /(?<![\w.-])(?:\d{9}[VvXx]|(?:19|20)\d{10})(?![\w-])/ },
  { name: "local user folder", pattern: /(?:[A-Za-z]:[\\/]+Users[\\/]+|\/home\/|\/Users\/)(?!<|\[|\$|\{|name\b|user\b|you\b)[A-Za-z0-9._-]+[\\/]/ },
];

/** Paths where sample contact details are expected, because they test the screening. */
const PERSONAL_DATA_EXEMPT = [/^tests\//, /^package-lock\.json$/];
const SCREEN_ONLY_CODE = /^(lib\/contact-screen\.ts|scripts\/privacy-check\.mjs)$/;

const BINARY = /\.(jpe?g|png|webp|avif|gif|ico|webm|mp4|woff2?|ttf|pdf|zip)$/i;

const SERVER_ONLY_NAME = /NEXT_PUBLIC_[A-Z0-9_]*(SERVICE_ROLE|SECRET|PRIVATE|PASSWORD|ANTHROPIC|API_KEY|TOKEN)/;

// Logging these fields would put job text, messages or contact details in server logs.
const LOG_CALL = /\bconsole\.(log|info|warn|error|debug)\s*\(([^)]*)/;
const PERSONAL_FIELD = /\b(words|text|message|messages|body|address|phone|email|area|name|redacted|request|parsed)\b/;

const IGNORE_MARK = "privacy-check-ignore";
const isCode = (path) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(path);

/** Scans one file. Pure, so it can be tested without git. Returns a list of problems. */
export function scanFile(path, content = "") {
  const problems = [];
  const add = (line, rule) => problems.push({ path, line, rule });

  for (const { pattern, why } of FORBIDDEN_FILES) {
    if (pattern.test(path)) add(0, `forbidden file: ${why}`);
  }
  if (BINARY.test(path)) return problems;

  const personalExempt = PERSONAL_DATA_EXEMPT.some((p) => p.test(path)) || SCREEN_ONLY_CODE.test(path);
  const isEnvExample = /(^|\/)\.env\.example$/.test(path);

  content.split(/\r?\n/).forEach((text, index) => {
    if (text.includes(IGNORE_MARK)) return;
    const line = index + 1;

    for (const rule of SECRET_RULES) {
      if (rule.pattern.test(text)) add(line, `secret: ${rule.name}`);
    }
    if (!personalExempt) {
      for (const rule of PERSONAL_RULES) {
        if (rule.pattern.test(text)) add(line, `personal data: ${rule.name}`);
      }
    }
    if (isEnvExample && /^\s*[A-Z0-9_]*(KEY|SECRET|TOKEN|PASSWORD)[A-Z0-9_]*\s*=\s*\S/.test(text)) {
      add(line, "secret: .env.example must leave secret values empty");
    }
    if (path !== "scripts/privacy-check.mjs" && SERVER_ONLY_NAME.test(text)) {
      add(line, "secret: server-only value exposed through NEXT_PUBLIC_");
    }
    if (isCode(path) && !path.startsWith("tests/") && !path.startsWith("scripts/")) {
      const call = text.match(LOG_CALL);
      if (call && PERSONAL_FIELD.test(call[2].replace(/(["'`])(?:\\.|(?!\1).)*\1/g, ""))) {
        add(line, "logging: this may write personal data to logs");
      }
    }
  });
  return problems;
}

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 200 });

function main() {
  const files = git("ls-files", "--cached", "-z").split("\0").filter(Boolean);
  const problems = [];
  for (const path of files) {
    const content = BINARY.test(path) ? "" : execFileSync("git", ["show", `:${path}`], { maxBuffer: 1024 * 1024 * 200 }).toString("utf8");
    problems.push(...scanFile(path, content));
  }
  if (problems.length > 0) {
    console.error(`Privacy check failed: ${problems.length} problem(s). The values are not shown, so they stay out of logs.\n`);
    for (const p of problems) console.error(`  ${p.path}${p.line ? `:${p.line}` : ""}  ${p.rule}`);
    console.error(`\nRemove the value and replace any leaked secret. For a checked false positive, add the comment ${IGNORE_MARK} to that line.`);
    process.exit(1);
  }
  console.log(`Privacy check passed: ${files.length} files scanned.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
