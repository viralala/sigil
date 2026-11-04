import test from 'node:test';
import assert from 'node:assert/strict';
import { timelineFlags, parseResume } from '../src/index.js';
import { RESUMES } from './fixtures/resumes.js';

const job = (id, from, to, title = 'Engineer', source = '') => ({ id, kind: 'job', title, org: 'X', from, to, confidence: 0.9, source });

test('two overlapping full-time jobs are flagged with their ids', () => {
  assert.deepEqual(timelineFlags([job('a', '2020-01', '2022-06'), job('b', '2021-01', '2023-01')]), [{ type: 'OVERLAP', a: 'a', b: 'b' }]);
});
test('works end to end on a parsed resume', () => {
  const r = parseResume(RESUMES.find((x) => x.name === 'overlap-jobs').text);
  const f = timelineFlags(r.claims);
  assert.equal(f.length, 1);
  assert.equal(f[0].type, 'OVERLAP');
});
test('back-to-back jobs in the same month do not overlap', () => {
  assert.deepEqual(timelineFlags([job('a', '2020-01', '2022-06'), job('b', '2022-06', '2023-01')]), []);
});
test('a bare-year boundary is read leniently (2020-2022 then 2022-2024 is fine)', () => {
  assert.deepEqual(timelineFlags([job('a', '2020', '2022'), job('b', '2022', '2024')]), []);
});
test('interns, trainees, part-time, freelance and volunteers may overlap', () => {
  for (const title of ['Data Intern', 'Trainee Engineer', 'Part-time Tutor', 'Freelance Designer', 'Volunteer Coordinator']) {
    assert.deepEqual(timelineFlags([job('a', '2020-01', '2022-06'), job('b', '2021-01', '2021-06', title)]), [], title);
  }
  assert.deepEqual(timelineFlags([job('a', '2020-01', '2022-06'), job('b', '2021-01', '2021-06', 'Engineer', 'Engineer (part time)')]), []);
});
test('two current jobs overlap', () => {
  assert.equal(timelineFlags([job('a', '2020-01', 'present'), job('b', '2022-01', 'present')]).length, 1);
});
test('end before start is flagged', () => {
  assert.deepEqual(timelineFlags([job('a', '2022-03', '2021-01')]), [{ type: 'END_BEFORE_START', a: 'a' }]);
});
test('a job with no end date or no start date is skipped, not guessed', () => {
  assert.deepEqual(timelineFlags([job('a', '2020-01', null), job('b', '2020-06', '2021-01'), job('c', null, '2021-01')]), []);
});
test('only jobs are considered', () => {
  const edu = { ...job('e', '2020', '2024'), kind: 'education' };
  assert.deepEqual(timelineFlags([edu, job('a', '2021', '2022')]), []);
});
test('three-way overlap reports every pair once', () => {
  const f = timelineFlags([job('a', '2020-01', '2021-12'), job('b', '2020-06', '2021-06'), job('c', '2021-01', '2022-06')]);
  assert.equal(f.length, 3);
});
test('bad input is tolerated', () => {
  assert.deepEqual(timelineFlags(undefined), []);
  assert.deepEqual(timelineFlags([null, 7, {}]), []);
});
test('flags carry no verdict fields', () => {
  for (const f of timelineFlags([job('a', '2020-01', '2022-06'), job('b', '2021-01', '2023-01')])) assert.deepEqual(Object.keys(f).sort(), ['a', 'b', 'type']);
});
