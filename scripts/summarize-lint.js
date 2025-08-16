/* eslint-disable no-console */
// Summarize ESLint JSON report into simple artifacts
// Usage: node scripts/summarize-lint.js lint.json

const fs = require('fs');
const path = require('path');

function main() {
  const input = process.argv[2] || 'lint.json';
  if (!fs.existsSync(input)) {
    console.error(`Input file not found: ${input}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(input, 'utf8');
  const data = JSON.parse(raw);
  const messages = data.flatMap((f) => f.messages || []);
  const total = messages.length;
  const errors = messages.filter((m) => m.severity === 2).length;
  const warnings = messages.filter((m) => m.severity === 1).length;

  const byRule = new Map();
  for (const m of messages) {
    if (!m.ruleId) continue;
    byRule.set(m.ruleId, (byRule.get(m.ruleId) || 0) + 1);
  }
  const sorted = Array.from(byRule.entries()).sort((a, b) => b[1] - a[1]);

  const summary = {
    total,
    errors,
    warnings,
    rules: sorted.map(([rule, count]) => ({ rule, count })),
  };

  fs.writeFileSync('lint-summary.json', JSON.stringify(summary, null, 2));
  fs.writeFileSync(
    'lint-top.csv',
    sorted
      .slice(0, 20)
      .map(([rule, count]) => `${rule},${count}`)
      .join('\n') + '\n'
  );

  console.log(
    `Wrote lint-summary.json (total=${total}, errors=${errors}, warnings=${warnings}) and lint-top.csv`
  );
}

main();


