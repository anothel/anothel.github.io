// Offline comparison: observations frozen at the Phase 4 starting commit.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { githubRepoQuality } from './update-trends.mjs';
import { buildTodayBrief } from './update-today.mjs';
const schema = createRequire(import.meta.url)('../js/signal-schema.js');
const sources = JSON.parse(readFileSync(new URL('../tests/fixtures/phase4-ranking-baseline.json', import.meta.url)));
const after = schema.normalizeSignalData(sources).sort(schema.compareSignalPriority);
const before = sources.baseline.explore;
const brief = buildTodayBrief(sources, sources.baseline.today.generatedAt);
console.log('Frozen observations:', sources.baseline.commit);
console.log('Explore saturation:', before.filter(i => i.score === 100).length, '->', after.filter(i => i.score === 100).length);
console.table(after.slice(0, 15).map((i, index) => ({title:i.title, beforeRank:before.findIndex(b=>b.title===i.title)+1, afterRank:index+1, before:before.find(b=>b.title===i.title)?.score, after:i.score})));
console.log('Synthetic same-description GitHub fixture (not live repository measurements):');
console.table([1000,10000,100000].map(stars=>({stars,before:100,after:githubRepoQuality({full_name:'example/agent-skills',description:'Reusable coding agent skills',stargazers_count:stars},'Agent skills')})));
console.log('Today Start here (selection score / heuristic qualityScore):');
console.table(brief.sections[0].items.map(i=>({title:i.title,score:i.score,qualityScore:i.qualityScore,reason:i.reason,action:i.action})));
console.log('Raw Trends remain at 12/24 saturated until a successful refresh: compact labels cannot reconstruct lost raw inputs.');
