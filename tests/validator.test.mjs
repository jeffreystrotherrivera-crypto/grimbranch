/*
 * GrimBranch validator tests — plain Node, no framework.
 * Run: node tests/validator.test.mjs
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseStory, validateStory } = require('../validator.js');
const { STORY_TEXT } = require('../story.js');

let failures = 0;
function check(name, cond, extra = '') {
  if (cond) { console.log('  ok  ' + name); }
  else { failures++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}
function issueTypes(result) { return result.issues.map(i => i.type); }

/* --- The built-in story ---------------------------------------------- */
const parsed = parseStory(STORY_TEXT);
const result = validateStory(parsed);

check('built-in story parses to 13 passages', parsed.passages.length === 13, 'got ' + parsed.passages.length);
check('start passage is "The Gate"', parsed.start && parsed.start.name === 'The Gate');
check('four endings found', parsed.endings.length === 4, 'got ' + parsed.endings.length);
check('built-in story has zero errors', result.stats.errors === 0,
  JSON.stringify(result.issues.filter(i => i.level === 'error'), null, 1));
check('built-in story has zero warnings', result.stats.warnings === 0,
  JSON.stringify(result.issues.filter(i => i.level === 'warning'), null, 1));

const shed = parsed.byName.get('The Shed');
check('The Shed sets brassKey', shed && shed.setsFlags.includes('brassKey'));
const stair = parsed.byName.get('The Stair');
const atticChoice = stair && stair.choices.find(c => c.target === 'The Attic');
check('attic choice requires brassKey', !!atticChoice && atticChoice.requires === 'brassKey');
const gate = parsed.byName.get('The Gate');
check('choice markup is stripped from displayed body',
  gate && !gate.displayBody.includes('[[') && gate.displayBody.length > 40);
const attic = parsed.byName.get('The Attic');
check('display body does not leak @set lines',
  parsed.passages.every(p => !p.displayBody.includes('@set')));

/* --- Broken stories: one per issue type ------------------------------ */
function typesOf(text) { return issueTypes(validateStory(parseStory(text))); }

check('unknown target is an error', typesOf([
  ':: A [start]', 'Go [[on->Nowhere]]', ''].join('\n')).includes('unknown-target'));

check('dead end is an error', typesOf([
  ':: A [start]', 'Go [[on->B]]', '', ':: B', 'Nothing here.', ''].join('\n')).includes('dead-end'));

check('unreachable passage is a warning', typesOf([
  ':: A [start]', 'Go [[on->B]]', '', ':: B [ending]', 'Done.', '',
  ':: C [ending]', 'Never seen.', ''].join('\n')).includes('unreachable'));

check('duplicate names are an error', typesOf([
  ':: A [start]', 'Go [[on->B]]', '', ':: B [ending]', 'One.', '',
  ':: B [ending]', 'Two.', ''].join('\n')).includes('duplicate-name'));

check('missing start is an error', typesOf([
  ':: A', 'Go [[on->B]]', '', ':: B [ending]', 'Done.', ''].join('\n')).includes('missing-start'));

check('unset required flag is an error', typesOf([
  ':: A [start]', 'Go [[on->B]] (requires magicKey)', '',
  ':: B [ending]', 'Done.', ''].join('\n')).includes('unset-flag'));

check('set required flag passes', !typesOf([
  ':: A [start]', '@set magicKey', 'Go [[on->B]] (requires magicKey)', '',
  ':: B [ending]', 'Done.', ''].join('\n')).includes('unset-flag'));

check('empty input never throws and reports empty-story',
  typesOf('').includes('empty-story'));
check('garbage input never throws', (() => {
  try { validateStory(parseStory('::: [[[ -> \n@set\n:: ')); return true; }
  catch (e) { return false; }
})());

check('a tag inside the body does NOT count as an ending', typesOf([
  ':: A [start]', 'Go [[on->B]]', '',
  ':: B', 'This body mentions [ending] but is not one.', ''].join('\n')).includes('dead-end'));

console.log(failures === 0 ? '\nALL TESTS PASSED' : '\n' + failures + ' TEST(S) FAILED');
process.exit(failures === 0 ? 0 : 1);
