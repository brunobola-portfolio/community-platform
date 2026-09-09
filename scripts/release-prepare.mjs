#!/usr/bin/env node
/**
 * Guards the release before anything is published, and writes the notes.
 *
 * A tag that disagrees with package.json would ship a zip whose version.json
 * and generator meta tag announce a different version than the release page —
 * the one lie the version stamp exists to prevent. A version with no CHANGELOG
 * section would ship a release nobody can read. Both fail here, before the
 * build, instead of being discovered by whoever downloads the artifact.
 *
 * Usage: node scripts/release-prepare.mjs v2.9.1 [--out RELEASE_NOTES.md]
 */

import { readFileSync, writeFileSync } from 'node:fs';

const [, , rawTag, ...rest] = process.argv;
const outIndex = rest.indexOf('--out');
const outFile = outIndex === -1 ? 'RELEASE_NOTES.md' : rest[outIndex + 1];

function fail(message) {
  // GitHub renders the annotation; the plain line keeps local runs readable
  console.error(`::error::${message}`);
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

if (!rawTag) fail('Missing tag argument (expected something like v2.9.1).');

const tagVersion = rawTag.replace(/^v/, '');
const { version: pkgVersion } = JSON.parse(readFileSync('package.json', 'utf8'));

if (tagVersion !== pkgVersion) {
  fail(
    `Tag ${rawTag} does not match package.json (${pkgVersion}). ` +
    'The zip stamps package.json into version.json and the generator meta tag, ' +
    'so the release page would announce a version the artifact denies.'
  );
}

const changelog = readFileSync('CHANGELOG.md', 'utf8').replace(/\r\n/g, '\n');
const heading = new RegExp(`^## \\[${tagVersion.replace(/\./g, '\\.')}\\].*$`, 'm');
const start = changelog.search(heading);
if (start === -1) fail(`CHANGELOG.md has no "## [${tagVersion}]" section.`);

const body = changelog.slice(start);
const next = body.slice(1).search(/^## /m);
const section = (next === -1 ? body : body.slice(0, next + 1))
  .split('\n')
  .slice(1)
  .join('\n')
  .trim();

if (!section) fail(`The "## [${tagVersion}]" section in CHANGELOG.md is empty.`);

writeFileSync(outFile, `${section}\n`);
console.log(`Release ${rawTag} matches package.json; notes written to ${outFile} (${section.length} chars).`);
