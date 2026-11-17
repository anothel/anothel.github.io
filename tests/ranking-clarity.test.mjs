import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { githubRepoQuality, selectTrendItems } from '../scripts/update-trends.mjs';
import { buildTodayBrief } from '../scripts/update-today.mjs';
const schema = createRequire(import.meta.url)('../js/signal-schema.js');
const repo = stars => ({ full_name: 'example/agent-skills', description: 'Reusable coding agent skills', stargazers_count: stars });
test('GitHub relevance retains discrimination for established repositories', () => {
    const scores = [1000, 10000, 100000].map(n => githubRepoQuality(repo(n), 'Agent skills'));
    assert.ok(scores[0] < scores[1] && scores[1] < scores[2]);
    assert.ok(scores[2] < 100);
    assert.ok(githubRepoQuality(repo(0), 'Agent skills') >= 1);
    assert.equal(githubRepoQuality({full_name:'example/css', description:'frontend checklist',stargazers_count:100000},'Agent skills'),0);
});
test('normalized relevance preserves headroom and ordering', () => {
    const scores = [80, 90, 95].map(score => schema.qualityScoreForItem('trends', {title:'MCP agent workflow', score}));
    assert.ok(scores[0] < scores[1] && scores[1] < scores[2]);
    assert.ok(scores[2] < 100);
});
test('Today retains observed counts and disclaims unmeasured growth', () => {
    const input = {trends:{items:[{title:'MCP agent workflow',category:'MCP',source:'GitHub',score:80,velocity:'10K stars',signal:'500 forks',url:'https://example.com/mcp'}]}};
    const item = buildTodayBrief(input,'2026-11-17T00:00:00Z').sections[0].items[0];
    assert.match(item.reason,/10K stars/);
    assert.match(item.reason,/not measured/);
    assert.match(item.action,/integration|permissions/);
});
test('trend ties, dedupe and coverage are independent of input order', () => {
    const items = ['z','a','e','w'].map((title,i)=>({title,source:i%2?'npm':'GitHub',category:['MCP','MCP','AI evals','Workflow automation'][i],score:80,url:`https://example.com/${title}`}));
    const selected=selectTrendItems([...items,items[0]],3);
    assert.deepEqual(selected,selectTrendItems([...items].reverse(),3));
    assert.equal(new Set(selected.map(i=>i.url)).size,3);
    assert.ok(selected.some(i=>i.category==='AI evals'));
    assert.ok(selected.some(i=>i.category==='Workflow automation'));
});

import { readFileSync } from 'node:fs';
import { normalizeExploreData } from '../src/lib/explore-domain.js';
test('frozen observations reduce normalization saturation without changing identities', () => {
    const sources=JSON.parse(readFileSync(new URL('./fixtures/phase4-ranking-baseline.json',import.meta.url)));
    const after=schema.normalizeSignalData(sources);
    assert.equal(sources.baseline.explore.filter(i=>i.score===100).length,25);
    assert.equal(after.filter(i=>i.score===100).length,12);
    assert.deepEqual(after.map(i=>i.title).sort(),sources.baseline.explore.map(i=>i.title).sort());
    const esm=normalizeExploreData(sources);
    assert.deepEqual(esm.map(i=>[i.id,i.score,i.scoreReasons]),after.map(i=>[i.id,i.score,i.scoreReasons]));
    const brief=buildTodayBrief(sources,sources.baseline.today.generatedAt);
    assert.deepEqual(brief.sections.map(s=>s.items.map(i=>i.title)),sources.baseline.today.sections.map(s=>s.items.map(i=>i.title)));
});

test('compatibility renderer never invents percentage momentum', () => {
    const renderer=readFileSync(new URL('../js/dashboard.js',import.meta.url),'utf8');
    assert.doesNotMatch(renderer,/velocity:\s*"[+-]\d+%"/);
});

test('raw GitHub scores remain bounded and monotone across supported categories', () => {
    for (const category of ['Agent skills','MCP','AI agents','AI evals','Workflow automation']) {
        const scores=[0,1,100,1000,10000,100000,1000000,1e12].map(stargazers_count=>githubRepoQuality({full_name:'example/tools',description:'coding agent skills MCP LLM evaluation durable workflow automation',stargazers_count},category));
        assert.ok(scores.every((score,i)=>Number.isInteger(score) && score>=1 && score<=100 && (!i || score>=scores[i-1])));
    }
});

test('unknown observed sources are not described as enduring references', () => {
    const [item]=schema.normalizeSignalData({trends:{items:[{title:'Example',source:'New source',score:50,velocity:'3 observations',url:'https://example.com/new'}]}});
    assert.match(item.scoreReasons[0],/observed; change not measured/);
    assert.doesNotMatch(item.scoreReasons[0],/reference/);
});

test('Today explanation follows the selected category when names match several topics', () => {
    const input={trends:{items:[{title:'AI agent workflow automation',category:'Workflow automation',source:'GitHub',score:80,velocity:'10K stars',signal:'500 forks',url:'https://example.com/workflow'}]}};
    const item=buildTodayBrief(input,'2026-11-17T00:00:00Z').sections[0].items[0];
    assert.match(item.reason,/Workflow automation signal/);
});
