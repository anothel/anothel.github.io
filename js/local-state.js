(function attachLocalState(global) {
    const keys = {
        savedItems: "anothel.explore.saved.v1",
        pinnedTopics: "anothel.preferences.pinnedTopics.v1"
    };
    const validStatuses = new Set(["unread", "read", "done"]);

    function nowIso(options = {}) {
        return typeof options.now === "function" ? options.now() : new Date().toISOString();
    }

    function normalizeRecord(record, options = {}) {
        if (!record || typeof record.id !== "string") return null;
        return {
            id: record.id,
            savedAt: typeof record.savedAt === "string" ? record.savedAt : nowIso(options),
            status: validStatuses.has(record.status) ? record.status : "unread"
        };
    }

    function savedRecordsFromRaw(rawValue, options = {}) {
        try {
            const parsed = JSON.parse(rawValue || "[]");
            if (Array.isArray(parsed)) {
                return parsed
                    .filter((id) => typeof id === "string")
                    .map((id) => ({ id, savedAt: nowIso(options), status: "unread" }));
            }
            if (parsed?.version === 2 && Array.isArray(parsed.items)) {
                return parsed.items.map((item) => normalizeRecord(item, options)).filter(Boolean);
            }
        } catch {
            return [];
        }
        return [];
    }

    function createSavedItemStore(storage, options = {}) {
        function readRecords() {
            try {
                return savedRecordsFromRaw(storage?.getItem(keys.savedItems) || "[]", options);
            } catch {
                return [];
            }
        }

        function writeRecords(records) {
            try {
                storage?.setItem(keys.savedItems, JSON.stringify({
                    version: 2,
                    items: records.map((record) => normalizeRecord(record, options)).filter(Boolean)
                }));
            } catch {
                // Storage can be disabled in private or local file contexts.
            }
        }

        function read() {
            return new Set(readRecords().map((record) => record.id));
        }

        function recordsById() {
            return new Map(readRecords().map((record) => [record.id, record]));
        }

        return {
            read,
            readRecords,
            recordsById,
            toggle(id) {
                const records = readRecords();
                const index = records.findIndex((record) => record.id === id);
                if (index >= 0) records.splice(index, 1);
                else records.push({ id, savedAt: nowIso(options), status: "unread" });
                writeRecords(records);
                return new Set(records.map((record) => record.id));
            },
            remove(id) {
                const records = readRecords().filter((record) => record.id !== id);
                writeRecords(records);
                return new Set(records.map((record) => record.id));
            },
            setStatus(id, status) {
                if (!validStatuses.has(status)) return read();
                const records = readRecords();
                const record = records.find((item) => item.id === id);
                if (record) {
                    record.status = status;
                    writeRecords(records);
                }
                return new Set(records.map((item) => item.id));
            }
        };
    }

    function savedSummaryFromRaw(rawValue, validIds = null, options = {}) {
        function isCurrent(id) {
            return !validIds || validIds.has(id);
        }

        const records = savedRecordsFromRaw(rawValue, options)
            .filter((record) => isCurrent(record.id));
        return {
            saved: records.length,
            unread: records.filter((record) => record.status === "unread").length
        };
    }

    function createPinnedTopicStore(storage, validTopics = []) {
        const validTopicSet = new Set(validTopics);
        const maxPinnedTopics = 3;

        function normalize(topics) {
            return [...new Set((topics || []).filter((topic) => validTopicSet.has(topic)))].slice(0, maxPinnedTopics);
        }

        function read() {
            try {
                const parsed = JSON.parse(storage?.getItem(keys.pinnedTopics) || "[]");
                if (Array.isArray(parsed)) return normalize(parsed);
                if (parsed?.version === 1 && Array.isArray(parsed.topics)) return normalize(parsed.topics);
            } catch {
                return [];
            }
            return [];
        }

        function write(topics) {
            const normalized = normalize(topics);
            try {
                storage?.setItem(keys.pinnedTopics, JSON.stringify({ version: 1, topics: normalized }));
            } catch {
                // Storage can be disabled in private or local file contexts.
            }
            return normalized;
        }

        return {
            read,
            toggle(topic) {
                if (!validTopicSet.has(topic)) return read();
                const topics = read();
                const next = topics.includes(topic)
                    ? topics.filter((item) => item !== topic)
                    : [...topics, topic].slice(-maxPinnedTopics);
                return write(next);
            }
        };
    }

    global.AnothelState = {
        keys,
        createPinnedTopicStore,
        createSavedItemStore,
        savedRecordsFromRaw,
        savedSummaryFromRaw
    };
})(globalThis);
