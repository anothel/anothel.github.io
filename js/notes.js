(function attachNotes(global) {
    const topicTaxonomy = global.TopicTaxonomy;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");
    }

    function safeHref(value) {
        const href = String(value || "").trim();
        if (!href || href.startsWith("//") || /[\u0000-\u001F\u007F]/.test(href)) return "#";

        try {
            const parsed = new URL(href, "https://anothel.github.io");
            const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(href);
            if (hasScheme && parsed.protocol !== "http:" && parsed.protocol !== "https:") return "#";
            if (!hasScheme && parsed.origin !== "https://anothel.github.io") return "#";
            return escapeHtml(href);
        } catch {
            return "#";
        }
    }

    function noteItems() {
        if (!topicTaxonomy) return [];
        return topicTaxonomy.topicPageLabels
            .map((label) => {
                const topic = topicTaxonomy.topicByLabel(label);
                return {
                    topic: label,
                    description: topic?.description || "",
                    route: topicTaxonomy.routeForTopic(label, "../"),
                    exploreRoute: topicTaxonomy.exploreRouteForTopic(label, "../"),
                    note: topic?.note
                };
            })
            .filter((item) => item.note);
    }

    function renderNotes(notes) {
        if (!notes.length) {
            return '<p class="saved-empty">No topic notes yet.</p>';
        }

        return notes.map((item) => `
            <article class="topic-note-card">
                <div>
                    <span>${escapeHtml(item.topic)}</span>
                    <h2>${escapeHtml(item.note.title)}</h2>
                    <p>${escapeHtml(item.note.body)}</p>
                    <small>${escapeHtml(item.note.readWhen)}</small>
                </div>
                <aside>
                    <span>${escapeHtml(item.description)}</span>
                    <div class="topic-support-list">
                        <a href="${safeHref(item.route)}">
                            <strong>Open topic</strong>
                            <span>${escapeHtml(item.topic)}</span>
                        </a>
                        <a href="${safeHref(item.exploreRoute)}">
                            <strong>Explore lens</strong>
                            <span>${escapeHtml(item.topic)}</span>
                        </a>
                    </div>
                </aside>
            </article>
        `).join("");
    }

    function init() {
        const notes = noteItems();
        const count = document.querySelector("[data-notes-count]");
        const list = document.querySelector("[data-notes-list]");

        if (count) count.textContent = String(notes.length);
        if (list) list.innerHTML = renderNotes(notes);
    }

    global.NotesApp = { noteItems, renderNotes };

    if (typeof document !== "undefined") {
        init();
    }
})(globalThis);
