#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { recommendSkills, resolveSkillsDir } = require('./recommend_skills');
const { clusterSkills } = require('./cluster_skills');
const { dedupCheck } = require('./check_skill_dedup');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-recommender-'));
const skillsDir = path.join(root, 'skills');
fs.mkdirSync(path.join(skillsDir, 'shopping-helper'), { recursive: true });
fs.writeFileSync(
  path.join(skillsDir, 'shopping-helper', 'SKILL.md'),
  '---\nname: Shopping Helper\ndescription: Help with shopping and grocery reminders.\n---\n'
);

const oldCwd = process.cwd();
try {
  process.chdir(root);
  assert.strictEqual(fs.realpathSync(resolveSkillsDir('skills')), fs.realpathSync(skillsDir));
  assert.throws(() => resolveSkillsDir('../outside'), /inside the current workspace/);
  assert.throws(() => resolveSkillsDir('/tmp'), /relative/);

  const recommended = recommendSkills({ query: 'shopping reminder', skills_dir: 'skills' });
  assert.strictEqual(recommended.scanned, 1);
  assert.strictEqual(recommended.recommended[0].skill, 'shopping-helper');

  const clustered = clusterSkills({ skills_dir: 'skills' });
  assert.strictEqual(clustered.scanned, 1);

  const deduped = dedupCheck({ request: 'shopping reminders', skills_dir: 'skills' });
  assert.strictEqual(deduped.scanned, 1);
} finally {
  process.chdir(oldCwd);
  fs.rmSync(root, { recursive: true, force: true });
}

console.log('passed');
