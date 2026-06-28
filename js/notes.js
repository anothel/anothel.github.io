(function attachNotes(global) {
    const topicTaxonomy = global.TopicTaxonomy;
    const { escapeHtml, safeLinkAttrs } = global.AnothelDom;

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
                        <a ${safeLinkAttrs(item.route)}>
                            <strong>Open topic</strong>
                            <span>${escapeHtml(item.topic)}</span>
                        </a>
                        <a ${safeLinkAttrs(item.exploreRoute)}>
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
