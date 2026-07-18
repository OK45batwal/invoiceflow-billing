const fs = require('fs');

const filePath = '/Users/omkar/invoiceflow-billing/server/server.js';
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'GET profiles', line: 97 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'PUT profile', line: 138 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'GET customers', line: 161 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'POST customer', line: 176 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'PUT customer', line: 192 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'DELETE customer', line: 207 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'GET products', line: 230 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'POST product', line: 245 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'PUT product', line: 261 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'DELETE product', line: 276 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'GET invoices', line: 312 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'GET invoice', line: 341 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'POST invoice', line: 431 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'PUT invoice', line: 480 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'DELETE invoice', line: 497 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'GET dashboard stats', line: 580 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'GET reports', line: 643 },
  { pattern: /res\.status\(500\)\.json\(\{ error: error\.message \}\);/, context: 'POST restore', line: 744 },
];

let count = 0;
for (const r of replacements) {
  const regex = new RegExp(r.pattern.source, 'm');
  const replacement = `handleError(res, error, "${r.context}");`;
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    count++;
    console.log(`Replaced: ${r.context} (line ~${r.line})`);
  } else {
    console.log(`NOT FOUND: ${r.context} (line ~${r.line})`);
  }
}

fs.writeFileSync(filePath, content);
console.log(`\nTotal replacements: ${count}/18`);