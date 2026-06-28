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

    function safeLinkAttrs(value) {
        const href = safeHref(value);
        if (href === "#") return 'href="#"';

        try {
            const parsed = new URL(String(value || "").trim(), "https://anothel.github.io");
            if (parsed.origin !== "https://anothel.github.io") {
                return `href="${href}" rel="noopener noreferrer"`;
            }
        } catch {
            return 'href="#"';
        }

        return `href="${href}"`;
    }

    global.AnothelDom = {
        escapeHtml,
        safeHref,
        safeLinkAttrs
    };
})(globalThis);
