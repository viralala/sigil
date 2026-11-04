import test from 'node:test';
import assert from 'node:assert/strict';
import { readDates, monthIndex } from '../src/dates.js';

const r = (s) => { const d = readDates(s); return d && [d.from, d.to]; };

const CASES = [
  ['Jun 2021 - Present', ['2021-06', 'present']],
  ['June 2021 – August 2022', ['2021-06', '2022-08']],
  ['Sept 2019 to May 2020', ['2019-09', '2020-05']],
  ["Jun'21 - Aug'21", ['2021-06', '2021-08']],
  ["Jun '21 – Present", ['2021-06', 'present']],
  ['Jun - Aug 2021', ['2021-06', '2021-08']],
  ['Nov - Feb 2022', ['2021-11', '2022-02']],
  ['09/2018 - 12/2021', ['2018-09', '2021-12']],
  ['2021-06 to 2022-01', ['2021-06', '2022-01']],
  ['2019 - 2023', ['2019', '2023']],
  ['2019–23', ['2019', '2023']],
  ['2019-20', ['2019', '2020']],
  ['2020-24', ['2020', '2024']],
  ['01/06/2022 - 15/08/2022', ['2022-06-01', '2022-08-15']],
  ['31/12/2020', ['2020-12-31', null]],
  ['12/31/2020', ['2020-12-31', null]],
  ['15 June 2021', ['2021-06-15', null]],
  ['15th Jun, 2021', ['2021-06-15', null]],
  ['June 15, 2021', ['2021-06-15', null]],
  ['2021-06-15', ['2021-06-15', null]],
  ['March 2023', ['2023-03', null]],
  ['2023', ['2023', null]],
  ['Since 2019', ['2019', null]],
  ['Expected 2026', ['2026', null]],
  ['(2019 – present)', ['2019', 'present']],
  ['Jan 2020 till date', ['2020-01', 'present']],
  ['Jan 2020 - ongoing', ['2020-01', 'present']],
  ['2020 – Current', ['2020', 'present']],
  ['2021-06', ['2021-06', null]],
];
for (const [text, want] of CASES) test(`date: ${text}`, () => assert.deepEqual(r(text), want));

test('no date in prose, phone numbers or words that merely contain a month', () => {
  for (const s of ['I may march on', 'Pune, India', 'Python 3.11 and 2 years of C++', 'phone 9876543210', '', 'Decade of experience']) assert.equal(readDates(s), null, s);
});
test('a month word alone is not a date', () => assert.equal(readDates('Jun'), null));
test('span points at the date text so callers can cut it out', () => {
  const s = 'Engineer, Acme  Jun 2021 - Present  Pune';
  const d = readDates(s);
  assert.equal(s.slice(d.start, d.end), 'Jun 2021 - Present');
});
test('impossible calendar numbers are ignored', () => {
  const d = r('45/13/2020');
  assert.ok(d === null || !String(d[0]).includes('-'), 'never builds a month or day out of 45/13');
});
test('monthIndex orders dates and treats present as open ended', () => {
  assert.ok(monthIndex('2020-05') < monthIndex('2020-06'));
  assert.ok(monthIndex('2020') <= monthIndex('2020-01'));
  assert.equal(monthIndex('present'), Infinity);
  assert.equal(monthIndex('nope'), null);
});
