import React, { useEffect, useMemo, useRef, useState } from "react";
import { normalizeExploreData, safeExternalUrl } from "../lib/explore-domain.js";
import {
    clearSavedItems,
    mergeSavedRecords,
    readSavedRecords,
    removeSavedItem,
    setSavedItemMeta,
    setSavedItemStatus
} from "../lib/explore-storage.js";
import {
    filterReviewItems,
    matchSavedItems,
    reviewImportPreview,
    reviewImportRecords,
    reviewJsonPayload,
    reviewMarkdownPayload,
    reviewStats,
    selectedReviewItem,
    similarExploreHref,
    topicNotesHref,
    workflowStats
} from "../lib/review-domain.js";

const filters = ["all", "unread", "read", "done"];

function browserStorage() {
    try { return globalThis.localStorage; } catch { return undefined; }
}

function statusLabel(status) {
    return status === "done" ? "Done" : status === "read" ? "Read" : "Unread";
}

function savedDateLabel(value) {
    return value ? `Saved ${String(value).slice(0, 10)}` : "Saved date unknown";
}

function nextActionCopy(status) {
    if (status === "done") return "Remove it if it no longer needs to stay here, or find similar signals in Explore.";
    if (status === "read") return "Add a reason, tag, or note, then mark done when no follow-up remains.";
    return "Open this signal, then mark it read or done.";
}

function staleSavedCopy(count) {
    return `${count === 1 ? "1 saved item is" : `${count} saved items are`} local but not in current data. Export JSON before clearing local browser data, or open Explore to save current signals.`;
}

function download(text, type, filename) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function EmptyReview({ prefix, staleCount, statusFilter }) {
    if (staleCount) return <article className="review-empty"><h2>Saved items not in current data</h2><p>{staleSavedCopy(staleCount)}</p><a href={`${prefix}explore/index.html`}>Open Explore</a></article>;
    if (statusFilter !== "all") return <article className="review-empty"><h2>No {statusFilter} items in Review</h2><p>Choose All or another status to keep working through saved local items.</p><a href={`${prefix}explore/index.html`}>Open Explore</a></article>;
    return <article className="review-empty"><h2>No saved items yet</h2><p>Saved items are local to this browser. Open Explore and save useful signals to build this queue.</p><a href={`${prefix}explore/index.html`}>Open Explore</a></article>;
}

function ReviewDetail({ item, editor, onEditorChange, onSaveMeta, onStatus, onRemove, prefix }) {
    const status = item.savedStatus || "unread";
    const href = safeExternalUrl(item.url);
    const noteHref = topicNotesHref(item, prefix);
    const context = [item.module, item.origin, item.category, item.sourceContext].filter(Boolean).join(" / ");
    const score = Number(item.qualityScore || item.score || 0);
    return (
        <article className="review-detail-card">
            <div className="card-topline"><span>{item.module}</span><span>{item.category}</span></div>
            <h2>{item.title}</h2>
            <p className="why-copy"><strong>Why this matters</strong> {item.summary}</p>
            <p className="source-context"><strong>Source context</strong> {context}</p>
            {item.scoreReasons?.length > 0 && <ul className="score-reasons" aria-label="Score reasons">{item.scoreReasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}</ul>}
            <p className="review-next-action"><strong>Next action</strong> {nextActionCopy(status)}</p>
            <div className="card-meta"><span>{item.metric}</span><span>{item.updated}</span><span>{savedDateLabel(item.savedAt)}</span><span className={`status-pill status-${status}`}>{statusLabel(status)}</span><span className="quality-marker" aria-label={`Signal fit score ${score}`}>Signal fit {score}</span></div>
            <div className="review-meta-editor">
                <label><span>Saved reason</span><input type="text" data-review-reason value={editor.reason} onChange={(event) => onEditorChange("reason", event.target.value)} /></label>
                <label><span>Tag</span><input type="text" data-review-tag value={editor.tag} onChange={(event) => onEditorChange("tag", event.target.value)} /></label>
                <label><span>Note</span><textarea data-review-note value={editor.note} onChange={(event) => onEditorChange("note", event.target.value)} /></label>
                <button type="button" data-review-meta-id={item.savedRecordId} onClick={onSaveMeta}>Save metadata</button>
            </div>
            <div className="review-actions">
                {href === "#" ? <span>Original link unavailable</span> : <a href={href} target="_blank" rel="noopener noreferrer">Open item</a>}
                <button type="button" data-review-status-id={item.savedRecordId} data-review-status="read" aria-label={`Mark ${item.title} read`} onClick={() => onStatus("read")}>Mark read</button>
                <button type="button" data-review-status-id={item.savedRecordId} data-review-status="done" aria-label={`Mark ${item.title} done`} onClick={() => onStatus("done")}>Mark done</button>
                <button type="button" data-review-remove-id={item.savedRecordId} aria-label={`Remove ${item.title} from Review`} onClick={onRemove}>Remove</button>
                <a href={similarExploreHref(item, prefix)}>Find similar in Explore</a>
                {noteHref && <a href={noteHref}>Open topic notes</a>}
            </div>
        </article>
    );
}

export default function ReviewIsland({ prefix = "../", dataPaths }) {
    const [hydrated, setHydrated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [items, setItems] = useState([]);
    const [records, setRecords] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedId, setSelectedId] = useState("");
    const [editor, setEditor] = useState({ reason: "", tag: "", note: "" });
    const [importText, setImportText] = useState("");
    const [portabilityStatus, setPortabilityStatus] = useState("Review JSON stays local.");
    const [clearPending, setClearPending] = useState(false);
    const fileInput = useRef(null);

    useEffect(() => {
        setHydrated(true);
        setRecords(readSavedRecords(browserStorage()));
        let cancelled = false;
        Promise.all(Object.entries(dataPaths).map(async ([key, path]) => {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`${key} failed`);
            return [key, await response.json()];
        })).then((entries) => {
            if (cancelled) return;
            const data = Object.fromEntries(entries);
            setItems(normalizeExploreData(data, { signalPolicy: data.signalPolicy }));
        }).catch(() => {
            if (!cancelled) setLoadError(true);
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [dataPaths]);

    const matched = useMemo(() => matchSavedItems(items, records), [items, records]);
    const visible = useMemo(() => filterReviewItems(matched.items, statusFilter), [matched.items, statusFilter]);
    const selected = useMemo(() => selectedReviewItem(visible, selectedId), [selectedId, visible]);
    const stats = useMemo(() => reviewStats(visible), [visible]);
    const workflow = useMemo(() => workflowStats(matched.items), [matched.items]);

    useEffect(() => {
        setEditor({ reason: selected?.savedReason || "", tag: selected?.savedTag || "", note: selected?.savedNote || "" });
    }, [selected?.savedRecordId]);

    if (!hydrated) return (
        <section className="module-detail" data-review-static-guidance>
            <h2>Review is browser-local.</h2>
            <p>Saved items require JavaScript and localStorage, so this static page cannot inspect or claim your queue is empty.</p>
            <p>Open <a href={`${prefix}explore/index.html`}>Explore</a> with JavaScript enabled to save signals, then return here to review them.</p>
        </section>
    );

    if (loading) return <section className="module-detail" data-review-loading><h2>Loading browser-local Review.</h2><p>Reading saved records and current signal data.</p></section>;

    function saveMeta() {
        if (!selected) return;
        setRecords(setSavedItemMeta(browserStorage(), selected.savedRecordId, editor));
        setPortabilityStatus("Metadata saved locally.");
    }

    function setStatus(status) {
        if (!selected) return;
        setRecords(setSavedItemStatus(browserStorage(), selected.savedRecordId, status));
    }

    function removeSelected() {
        if (!selected) return;
        setRecords(removeSavedItem(browserStorage(), selected.savedRecordId));
        setSelectedId("");
    }

    function previewText(text) {
        const incoming = reviewImportRecords(text);
        if (!incoming.length) return "No valid Review items to import.";
        const preview = reviewImportPreview(incoming, records);
        return `Import preview: ${preview.added} new, ${preview.skipped} existing or duplicate.`;
    }

    function importPasted() {
        if (!importText) return setPortabilityStatus("Paste Review JSON first.");
        const incoming = reviewImportRecords(importText);
        if (!incoming.length) return setPortabilityStatus("No valid Review items to import.");
        const result = mergeSavedRecords(browserStorage(), incoming);
        setRecords(result.records);
        setImportText("");
        setPortabilityStatus(`Imported ${result.added} items. Kept ${result.skipped} existing.`);
    }

    function clearReview() {
        if (!clearPending) {
            setClearPending(true);
            setPortabilityStatus("Press Confirm clear to remove every local Review item.");
            return;
        }
        setRecords(clearSavedItems(browserStorage()));
        setSelectedId("");
        setStatusFilter("all");
        setClearPending(false);
        setPortabilityStatus("Review queue cleared.");
    }

    return (
        <>
            <section className="module-detail"><h2>Saved locally in this browser.</h2><p>Items saved from Explore appear here when they still exist in current data.</p>{loadError && <p role="status">Current signal data could not be loaded. Local records remain available for JSON export.</p>}{matched.staleRecords.length > 0 && <p role="status" data-review-stale-count={matched.staleRecords.length}>{staleSavedCopy(matched.staleRecords.length)}</p>}</section>

            <section className="stats-grid review-stats" aria-label="Review stats">
                <article className="stat-card"><span>Visible</span><strong data-review-total>{stats.visible}</strong></article>
                <article className="stat-card"><span>Unread</span><strong data-review-unread>{workflow.unread}</strong></article>
                <article className="stat-card"><span>Read</span><strong data-review-read>{workflow.read}</strong></article>
                <article className="stat-card"><span>Done</span><strong data-review-done>{workflow.done}</strong></article>
                <article className="stat-card"><span>Focus areas</span><strong data-review-focus-count>{stats.focusAreas}</strong></article>
                <article className="stat-card"><span>Sources</span><strong data-review-source-count>{stats.sources}</strong></article>
            </section>

            <section className="review-filters" aria-label="Review status filters">
                {filters.map((filter) => <button type="button" key={filter} data-review-filter={filter} aria-pressed={statusFilter === filter} onClick={() => { setStatusFilter(filter); setSelectedId(""); }}>{filter[0].toUpperCase() + filter.slice(1)}</button>)}
                <button type="button" data-review-export onClick={() => { download(reviewJsonPayload(records), "application/json", "anothel-review.json"); setPortabilityStatus("Review JSON exported."); }}>Export JSON</button>
                <button type="button" data-review-export-markdown onClick={() => { download(reviewMarkdownPayload(matched.items), "text/markdown", "anothel-review.md"); setPortabilityStatus("Review Markdown exported."); }}>Export Markdown</button>
                <button type="button" data-review-clear aria-pressed={clearPending} onClick={clearReview}>{clearPending ? "Confirm clear" : "Clear Review"}</button>
                <button type="button" data-review-import onClick={() => fileInput.current?.click()}>Import JSON</button>
                <textarea data-review-import-text aria-label="Review JSON to import" placeholder="Paste Review JSON" value={importText} onChange={(event) => { setImportText(event.target.value); setPortabilityStatus(event.target.value ? previewText(event.target.value) : "Review JSON stays local."); }} />
                <button type="button" data-review-import-paste onClick={importPasted}>Import pasted JSON</button>
                <input ref={fileInput} type="file" accept="application/json,.json" data-review-import-file hidden onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const text = await file.text(); setImportText(text); setPortabilityStatus(previewText(text)); } catch { setPortabilityStatus("Review file could not be read."); } event.target.value = ""; }} />
                <span data-review-portability-status role="status">{portabilityStatus}</span>
            </section>

            <section className="review-workspace" aria-label="Review workspace">
                <aside className="review-queue-panel" aria-labelledby="review-queue-title"><div className="panel-heading"><h2 id="review-queue-title">Queue</h2><p>Unread first. Pick one saved signal, then open, annotate, mark done, or remove.</p></div><div className="review-queue" data-review-queue>{visible.length ? visible.map((item) => <button className="review-queue-item" type="button" key={item.id} data-review-select-id={item.id} aria-selected={selected?.id === item.id} aria-label={`Select ${item.title}`} onClick={() => setSelectedId(item.id)}><strong>{item.title}</strong><span>{[item.module, item.metric, item.category].filter(Boolean).join(" / ")}</span>{(item.savedReason || item.savedTag) && <span>{[item.savedTag, item.savedReason].filter(Boolean).join(" / ")}</span>}<small>{statusLabel(item.savedStatus)} / {savedDateLabel(item.savedAt)}</small></button>) : <p className="saved-empty">{matched.staleRecords.length ? staleSavedCopy(matched.staleRecords.length) : statusFilter !== "all" ? `No ${statusFilter} items match this filter.` : "No saved items in current data."}</p>}</div></aside>
                <section className="review-detail" aria-labelledby="review-detail-title"><div className="panel-heading"><h2 id="review-detail-title">Selected item</h2><p>Next action changes with status.</p></div><div data-review-detail>{selected ? <ReviewDetail item={selected} editor={editor} prefix={prefix} onEditorChange={(field, value) => setEditor((current) => ({ ...current, [field]: value }))} onSaveMeta={saveMeta} onStatus={setStatus} onRemove={removeSelected} /> : <EmptyReview prefix={prefix} staleCount={matched.staleRecords.length} statusFilter={statusFilter} />}</div></section>
            </section>
        </>
    );
}
