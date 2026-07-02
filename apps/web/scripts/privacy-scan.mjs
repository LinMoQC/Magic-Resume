import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');

const read = (relativePath) =>
  fs.readFileSync(path.join(appRoot, relativePath), 'utf8');

const readOptional = (relativePath) => {
  const fullPath = path.join(appRoot, relativePath);
  if (!fs.existsSync(fullPath)) return undefined;
  return fs.readFileSync(fullPath, 'utf8');
};

const failures = [];

const assertNotContains = (label, content, patterns) => {
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      failures.push(`${label} must not match ${pattern}`);
    }
  }
};

const packageJson = JSON.parse(read('package.json'));
const dependencyText = JSON.stringify({
  dependencies: packageJson.dependencies ?? {},
  devDependencies: packageJson.devDependencies ?? {},
});

assertNotContains('package dependencies', dependencyText, [
  /@magic-resume\/analytics-sdk/,
  /@magic-resume\/enterprise-sdk/,
  /@sentry\//,
  /posthog-js/,
  /mixpanel-browser/,
  /@amplitude\/analytics-browser/,
  /@vercel\/analytics/,
]);

const analyticsFacade = readOptional('src/lib/analytics/core-events.ts');
if (analyticsFacade) {
  assertNotContains('analytics facade', analyticsFacade, [
    /sendBeacon/,
    /\/api\/analytics\/events/,
    /magic_resume_anonymous_id/,
    /magic_resume_session/,
    /localStorage/,
    /document\.referrer/,
    /window\.location\.search/,
  ]);
}

assertNotContains('root layout', read('src/app/layout.tsx'), [
  /PageViewTracker/,
]);

assertNotContains('extension lifecycle', read('src/lib/extensions/app-lifecycle.ts'), [
  /@magic-resume\/analytics-sdk/,
  /analytics\./,
  /track\(/,
  /capture/,
  /sendBeacon/,
  /\/api\/analytics\/events/,
  /resume\.created/,
  /resume\.imported/,
  /username/,
  /primaryEmailAddress/,
  /resume_name/,
  /resumeName/,
  /fullName/,
  /email/,
  /jobDescription/,
  /resumeContent/,
]);

if (failures.length) {
  console.error('Open-source privacy scan failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Open-source privacy scan passed.');
