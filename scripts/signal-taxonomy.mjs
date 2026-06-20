export const trackedTopicLabels = [
    "AI agents",
    "Agent skills",
    "MCP",
    "AI evals",
    "AI engineering",
    "Workflow automation",
    "Developer tooling"
];

const topicRules = [
    {
        label: "Agent skills",
        patterns: [/\bagent skills?\b/, /\bskills? for (?:coding )?agents?\b/, /\bclaude skills?\b/, /\bmattpocock[\/\s]skills\b/, /\banthropics[\/\s]skills\b/]
    },
    {
        label: "MCP",
        patterns: [/\bmcp\b/, /\bmodel context protocol\b/, /\bmodelcontextprotocol\b/]
    },
    {
        label: "AI evals",
        patterns: [/\bevals?\b/, /\bevaluation\b/, /\bbenchmarks?\b/, /\bharness\b/],
        requires: [/\bai\b/, /\bllm\b/, /\bmodel\b/, /\bagents?\b/, /\bcoding\b/]
    },
    {
        label: "AI engineering",
        patterns: [/\bnanogpt\b/, /\bnanochat\b/, /\bllm\.c\b/, /\bllama2\.c\b/, /\btraining\b/, /\binference\b/],
        requires: [/\bai\b/, /\bllm\b/, /\bgpt\b/, /\bnanogpt\b/, /\bnanochat\b/, /\bmodel\b/, /\bkarpathy\b/, /\bllama\b/]
    },
    {
        label: "AI agents",
        patterns: [/\bai agents?\b/, /\bagentic\b/, /\bcoding agents?\b/, /\bclaude code\b/, /\bcodex\b/, /\bcopilot\b/, /\bagents?\b/]
    },
    {
        label: "Workflow automation",
        patterns: [/\bworkflow automation\b/, /\bdurable workflow\b/, /\binngest\b/, /\bn8n\b/]
    },
    {
        label: "Developer tooling",
        patterns: [/\btypescript\b/, /\bjavascript\b/, /\bnode\b/, /\bnpm\b/, /\bbun\b/, /\bdeno\b/, /\breact\b/, /\bvite\b/, /\bplaywright\b/, /\beslint\b/, /\bprettier\b/, /\bzod\b/]
    }
];

const baselineTitles = new Set([
    "typescript",
    "eslint",
    "prettier",
    "react",
    "react/react",
    "zod",
    "tailwindcss",
    "vite",
    "vitejs/vite",
    "next",
    "next.js",
    "vercel/next.js"
]);

function normalizeInput(input = "") {
    if (typeof input === "string") return input.toLowerCase();
    return [
        input.title,
        input.name,
        input.fullName,
        input.full_name,
        input.module,
        input.origin,
        input.category,
        input.metric,
        input.reason,
        input.focus,
        input.summary,
        input.description,
        input.url,
        ...(Array.isArray(input.topics) ? input.topics : [])
    ].filter(Boolean).join(" ").toLowerCase();
}

function hasAny(text, patterns) {
    return patterns.some((pattern) => pattern.test(text));
}

export function classifySignal(input = "") {
    const text = normalizeInput(input);

    for (const rule of topicRules) {
        if (hasAny(text, rule.patterns) && (!rule.requires || hasAny(text, rule.requires))) {
            return rule.label;
        }
    }

    if (/(database|sqlite|postgres|storage|sync|local-first)/.test(text)) return "Database";
    if (/(security|vulnerability|auth|oauth|supply chain)/.test(text)) return "Security";
    if (/(css|design|ui|frontend|browser|web)/.test(text)) return "Frontend";
    return "Developer tools";
}

export function isBaselineSignal(input = "") {
    const text = normalizeInput(input);
    const direct = text.trim();
    const firstToken = direct.split(/\s+/)[0] || direct;
    const repoName = firstToken.includes("/") ? firstToken.split("/").at(-1) : firstToken;

    return baselineTitles.has(direct)
        || baselineTitles.has(firstToken)
        || baselineTitles.has(repoName);
}

export function signalReason(input = "") {
    const category = classifySignal(input);

    if (category === "MCP") {
        return "MCP infrastructure worth tracking for agent workflows.";
    }
    if (category === "Agent skills") {
        return "Agent skills reference for reusable tool instructions.";
    }
    if (category === "AI evals") {
        return "Evaluation signal for measuring agent and model behavior.";
    }
    if (category === "AI engineering") {
        return "AI engineering reference with practical implementation value.";
    }
    if (category === "Workflow automation") {
        return "Workflow automation signal connected to agent-style work.";
    }
    if (category === "AI agents") {
        return "Coding-agent ecosystem signal with practical workflow value.";
    }
    return "Developer tooling signal worth keeping nearby.";
}

export function qualityBoost(input = "") {
    const category = classifySignal(input);
    const baselinePenalty = isBaselineSignal(input) ? -26 : 0;
    const boosts = {
        "Agent skills": 42,
        MCP: 40,
        "AI agents": 34,
        "AI evals": 30,
        "AI engineering": 26,
        "Workflow automation": 22,
        "Developer tooling": 8
    };

    return (boosts[category] || 0) + baselinePenalty;
}
