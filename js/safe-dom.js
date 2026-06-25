(function attachSafeDom(global) {
    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");
    }

    function safeHref(value) {
        const href = String(value || "").trim();
        if (!href || href.startsWith("//") || /[\u0000-\u001F\u007F]/.test(href)) {
            return "#";
        }

        try {
            const parsed = new URL(href, "https://anothel.github.io");
            const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(href);
            if (hasScheme && parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                return "#";
            }
            if (!hasScheme && parsed.origin !== "https://anothel.github.io") {
                return "#";
            }
            return escapeHtml(href);
        } catch {
            return "#";
        }
    }

    global.AnothelDom = {
        escapeHtml,
        safeHref
    };
})(globalThis);
