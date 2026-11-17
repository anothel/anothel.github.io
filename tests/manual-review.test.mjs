import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { collectLinks, buildLinkRows } from '../scripts/update-links.mjs';
import { assessRefresh } from '../scripts/check-refresh.mjs';
const { freshnessForSource } = createRequire(import.meta.url)('../js/data-health.js');
const now = new Date('2026-11-17T12:00:00.000Z');
const watchlists = JSON.parse(readFileSync('data/watchlists.json'));
const contentHash = createHash('sha256').update(JSON.stringify(buildLinkRows())).digest('hex');
const review = { reviewedAt: '2026-11-16T12:00:00.000Z', reviewedBy: 'test reviewer', evidence: 'Fixture only: whole shelf checked', contentHash };

test('genuine review survives unchanged daily generations without mutating evidence', () => {
    const input = { ...watchlists, linksReview: review };
    const first = collectLinks(input, now);
    const next = collectLinks(input, new Date('2026-11-18T12:00:00Z'));
    assert.equal(first.sourceMeta.reviewedAt, review.reviewedAt);
    assert.deepEqual(next.sourceMeta, first.sourceMeta);
    assert.notEqual(first.generatedAt, next.generatedAt);
    assert.equal(input.linksReview, review);
    assert.equal(freshnessForSource(first.sourceMeta, now).state, 'fresh');
});
for (const [label, change] of [
    ['missing', undefined], ['future', { ...review, reviewedAt: '2026-11-17T12:00:01Z' }],
    ['malformed', { ...review, reviewedAt: 'yesterday' }], ['impossible date', { ...review, reviewedAt: '2026-02-30T00:00:00Z' }],
    ['unattributed', { ...review, reviewedBy: '' }], ['no evidence', { ...review, evidence: '' }],
    ['changed content', { ...review, contentHash: '0'.repeat(64) }]
]) test(`${label} review remains unknown even with fresh generation`, () => {
    const result = collectLinks({ ...watchlists, linksReview: change }, now);
    assert.equal(result.sourceMeta.reviewedAt, undefined);
    assert.equal(freshnessForSource(result.sourceMeta, now).state, 'unknown');
});
test('manual generation and legacy update clocks are not review evidence', () => {
    for (const reviewedAt of [undefined, '2026-11-17T12:00:01Z', '2026-02-30T00:00:00Z']) {
        assert.equal(freshnessForSource({ name: 'manual', status: 'ok', updatedAt: now.toISOString(), reviewedAt }, now).state, 'unknown');
    }
});
function input() {
    return { manifest: { generatedAt: now.toISOString(), modules: ['trends','packages','repos','links'].map(id => ({ id })) },
        datasets: Object.fromEntries(['trends','packages','repos','links'].map(id => [id, { sourceMeta: { name: id === 'links' ? 'manual' : id, status: 'ok', count: 1, updatedAt: now.toISOString() } }])),
        report: { totals: { status: 'ok' } } };
}
test('generation alerts recover while manual freshness stays an advisory', () => {
    const data = input();
    let result = assessRefresh(data, now);
    assert.equal(result.ok, false);
    assert.equal(result.generationOk, true);
    assert.equal(result.manualSources[0].freshness, 'unknown');
    data.manifest.generatedAt = '2026-11-15T23:59:59Z';
    assert.equal(assessRefresh(data, now).generationOk, false);
    data.manifest.generatedAt = now.toISOString();
    for (const status of ['partial','error','fallback']) {
        data.datasets.repos.sourceMeta.status = status;
        result = assessRefresh(data, now);
        assert.equal(result.generationOk, true);
        assert.equal(result.ok, false);
        assert.notEqual(result.automatedSources.find(row => row.name === 'repos').health, 'healthy');
    }
    data.datasets.repos.sourceMeta.status = 'ok';
    assert.equal(assessRefresh(data, now).automatedSources.every(row => row.health === 'healthy'), true);
    data.manifest.modules.pop();
    assert.equal(assessRefresh(data, now).generationOk, false);
});

test('changing a reviewed reference invalidates evidence; reordering does not', () => {
    const reviewed = { ...watchlists, linksReview: review };
    const reordered = { ...reviewed, links: [...watchlists.links].reverse() };
    assert.equal(collectLinks(reordered, now).sourceMeta.reviewedAt, review.reviewedAt);
    const changed = structuredClone(reviewed);
    changed.links.find(link => !link.disabled).summary += ' changed';
    assert.equal(collectLinks(changed, now).sourceMeta.reviewedAt, undefined);
});

test('manual freshness uses the existing 30/90 day policy and never masks failure', () => {
    const source = { name: 'manual', status: 'ok', count: 1, reviewedAt: review.reviewedAt };
    assert.equal(freshnessForSource(source, '2026-12-17').state, 'aging');
    assert.equal(freshnessForSource(source, '2027-02-16').state, 'stale');
    assert.equal(freshnessForSource({ ...source, status: 'error', count: 0 }, now).state, 'unavailable');
});

test('Status and refresh report expose review time without manufacturing fallback evidence', async () => {
    const { buildStatusDashboard } = await import('../src/lib/status-data.mjs');
    const { buildRefreshReport } = await import('../scripts/report-refresh.mjs');
    const data = input();
    const module = data.manifest.modules.find(module => module.id === 'links');
    module.updated = '2026-11-17';
    data.datasets.links = collectLinks({ ...watchlists, linksReview: review }, now);
    assert.equal(buildStatusDashboard({ ...data, now }).rows.find(row => row.name === 'manual').lastSuccessfulUpdate, review.reviewedAt);
    assert.equal(buildRefreshReport(data.manifest, data.datasets).modules.find(module => module.id === 'links').sources[0].updatedAt, review.reviewedAt);
    data.datasets.links.sourceMeta = { name: 'manual', status: 'fallback', count: 1, previousUpdated: now.toISOString() };
    const row = buildStatusDashboard({ ...data, now }).rows.find(row => row.name === 'manual');
    assert.equal(row.lastSuccessfulUpdate, null);
    assert.equal(row.freshness, 'unknown');
});

test('Explore source details agree with shared manual review freshness', async () => {
    const { sourceHealthModel } = await import('../src/lib/explore-model.js');
    for (const reviewedAt of [review.reviewedAt, undefined, '2026-11-17T12:00:01Z', '2026-02-30T00:00:00Z', 'yesterday']) {
        const source = { name: 'manual', status: 'ok', count: 1, updatedAt: now.toISOString(), reviewedAt };
        const expected = freshnessForSource(source, now).state;
        assert.equal(sourceHealthModel(source, now)[0].detail.split(' ')[0].toLowerCase(), expected);
    }
});
