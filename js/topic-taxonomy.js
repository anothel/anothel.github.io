(function attachTopicTaxonomy(root, factory) {
    const taxonomy = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = taxonomy;
    }
    root.TopicTaxonomy = taxonomy;
})(typeof globalThis !== "undefined" ? globalThis : this, function createTopicTaxonomy() {
    const topicDefinitions = [
        {
            label: "AI agents",
            slug: "ai-agents",
            routePath: "topics/ai-agents/index.html",
            description: "Coding agents, workflow automation, and agent runtime movement.",
            lensDescription: "Coding agents, agent runtimes, and workflow automation.",
            signalLabel: "AI agent",
            reason: "Coding-agent ecosystem signal with practical workflow value.",
            boost: 34,
            whyPrefix: "Agent tooling is moving from demos into daily coding workflow.",
            patterns: [/\bai agents?\b/, /\bagentic\b/, /\bcoding agents?\b/, /\bcoding agent\b/, /\bclaude code\b/, /\bcodex\b/, /\bcopilot\b/, /\bworkflow automation\b/, /\bagent framework\b/],
            note: {
                title: "Agent workflow is becoming a daily engineering surface.",
                body: "Track this when coding agents, orchestration frameworks, or automation tools show signs of changing how work is planned, edited, reviewed, or tested.",
                readWhen: "Open this topic when repo traction and package demand point to repeatable agent workflow, not one-off demos."
            },
            guidance: {
                whatToWatch: "Coding agents, local CLIs, orchestration frameworks, and agent runtime patterns.",
                whenToOpen: "Open when a tool changes how code gets written, reviewed, tested, or automated.",
                nextAction: "Compare the strongest repo and package signals before saving follow-up items."
            },
            actions: [
                ["Open focused Explore", "explore/index.html?focus=AI%20agents", "AI agents lens"],
                ["Repos", "repos/index.html", "Coding-agent traction"],
                ["Packages", "packages/index.html", "Agent framework demand"]
            ]
        },
        {
            label: "Agent skills",
            slug: "agent-skills",
            routePath: "topics/agent-skills/index.html",
            description: "Reusable instructions, skill specs, and agent workflow examples.",
            lensDescription: "Reusable instructions, skills repos, and agent patterns.",
            signalLabel: "agent skill",
            reason: "Agent skills reference for reusable tool instructions.",
            boost: 42,
            whyPrefix: "Reusable instruction patterns are becoming a practical layer above one-off prompting.",
            patterns: [/\bagent skills?\b/, /\bskills? for (?:coding )?agents?\b/, /\bclaude skills?\b/, /\bmattpocock[\/\s]skills\b/, /\banthropics[\/\s]skills\b/, /\bcoding agent skills?\b/],
            note: {
                title: "Reusable instructions are becoming operational assets.",
                body: "Track this when skill specs, examples, and workflow repos show patterns that can be reused instead of rewritten per task.",
                readWhen: "Open this topic when a reusable pattern looks durable enough to save, adapt, or compare against your own agent workflow."
            },
            guidance: {
                whatToWatch: "Skill specs, reusable instructions, examples, and workflow checklists.",
                whenToOpen: "Open when a skill pattern can become repeatable work instead of one-off prompting.",
                nextAction: "Start from stable references, then save repos that look reusable."
            },
            actions: [
                ["Open focused Explore", "explore/index.html?focus=Agent%20skills", "Agent skills lens"],
                ["Links", "links/index.html", "Skill specs and docs"],
                ["Review", "review/index.html", "Saved reusable patterns"]
            ]
        },
        {
            label: "MCP",
            slug: "mcp",
            routePath: "topics/mcp/index.html",
            description: "Protocol, SDK, server, and client signals for agent tooling.",
            lensDescription: "Protocol, SDK, server, and client signals.",
            signalLabel: "MCP",
            reason: "MCP infrastructure worth tracking for agent workflows.",
            boost: 40,
            whyPrefix: "Protocol and server adoption is moving across SDKs, packages, and reference repos.",
            patterns: [/\bmcp\b/, /\bmodel context protocol\b/, /\bmodelcontextprotocol\b/],
            note: {
                title: "MCP is the protocol layer to keep checking.",
                body: "Track this when protocol, SDK, registry, inspector, and server signals move together across packages, repos, and reference links.",
                readWhen: "Open this topic when a source suggests agents may connect to tools differently."
            },
            guidance: {
                whatToWatch: "SDKs, reference servers, registries, inspector tools, and server packages.",
                whenToOpen: "Open when a protocol or server signal could change how agents connect to tools.",
                nextAction: "Check packages for adoption, then keep stable server references nearby."
            },
            actions: [
                ["Open focused Explore", "explore/index.html?focus=MCP", "MCP lens"],
                ["Packages", "packages/index.html", "SDK and server demand"],
                ["Links", "links/index.html", "Stable protocol references"]
            ]
        },
        {
            label: "AI evals",
            slug: "ai-evals",
            description: "Evaluation, observability, and test harness tools.",
            signalLabel: "AI eval",
            reason: "Evaluation signal for measuring agent and model behavior.",
            boost: 30,
            patterns: [/\bevals?\b/, /\bevaluation\b/, /\bbenchmarks?\b/, /\bharness\b/, /\bobservability\b/, /\bbraintrust\b/, /\bevalite\b/],
            requires: [/\bai\b/, /\bllm\b/, /\bmodel\b/, /\bagents?\b/, /\bcoding\b/]
        },
        {
            label: "AI engineering",
            slug: "ai-engineering",
            description: "Model training, inference, and practical AI systems.",
            signalLabel: "AI engineering",
            reason: "AI engineering reference with practical implementation value.",
            boost: 26,
            patterns: [/\bai engineering\b/, /\bnanogpt\b/, /\bnanochat\b/, /\bllm\.c\b/, /\bllama2\.c\b/, /\btraining\b/, /\binference\b/, /\bgpt\b/, /\bllm\b/, /\bllama\b/, /\bcuda\b/, /\bmodel\b/],
            requires: [/\bai\b/, /\bllm\b/, /\bgpt\b/, /\bnanogpt\b/, /\bnanochat\b/, /\bmodel\b/, /\bkarpathy\b/, /\bllama\b/]
        },
        {
            label: "Workflow automation",
            slug: "workflow-automation",
            description: "Durable workflows, integrations, and local automation.",
            signalLabel: "workflow automation",
            reason: "Workflow automation signal connected to agent-style work.",
            boost: 22,
            patterns: [/\bworkflow automation\b/, /\bdurable workflow\b/, /\binngest\b/, /\bn8n\b/, /\bautomation\b/, /\bintegration\b/]
        },
        {
            label: "Developer tooling",
            slug: "developer-tooling",
            description: "Tools that affect coding, testing, and build flow.",
            signalLabel: "developer tooling",
            reason: "Developer tooling signal worth keeping nearby.",
            boost: 8,
            patterns: [/\bdeveloper tools?\b/, /\btooling\b/, /\btypescript\b/, /\bjavascript\b/, /\bnode\b/, /\bnpm\b/, /\bbun\b/, /\bdeno\b/, /\breact\b/, /\bvite\b/, /\bplaywright\b/, /\beslint\b/, /\bprettier\b/, /\bzod\b/, /\bbuild tool\b/, /\btesting\b/, /\bbrowser automation\b/]
        }
    ];

    const classificationOrder = [
        "Agent skills",
        "MCP",
        "AI evals",
        "AI engineering",
        "AI agents",
        "Workflow automation",
        "Developer tooling"
    ];
    const byLabel = new Map(topicDefinitions.map((topic) => [topic.label, topic]));
    const bySlug = new Map(topicDefinitions.map((topic) => [topic.slug, topic]));

    function encodeFocus(label) {
        return encodeURIComponent(label);
    }

    function withPrefix(prefix, path) {
        return `${prefix || ""}${path}`;
    }

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
            input.source,
            input.kind,
            input.url,
            ...(Array.isArray(input.topics) ? input.topics : [])
        ].filter(Boolean).join(" ").toLowerCase();
    }

    function hasAny(text, patterns = []) {
        return patterns.some((pattern) => pattern.test(text));
    }

    function topicByLabel(label) {
        return byLabel.get(label) || bySlug.get(label);
    }

    function explorePath(label) {
        return `explore/index.html?focus=${encodeFocus(label)}`;
    }

    function routeForTopic(label, prefix = "") {
        const topic = topicByLabel(label);
        if (!topic) return withPrefix(prefix, "explore/index.html");
        return withPrefix(prefix, topic.routePath || explorePath(topic.label));
    }

    function exploreRouteForTopic(label, prefix = "") {
        const topic = topicByLabel(label);
        return withPrefix(prefix, explorePath(topic?.label || label || "all"));
    }

    function matchesTopic(input, label) {
        const topic = topicByLabel(label);
        if (!topic) return false;
        const text = normalizeInput(input);
        const category = String(input?.category || "").toLowerCase();
        return category === topic.label.toLowerCase()
            || (hasAny(text, topic.patterns) && (!topic.requires || hasAny(text, topic.requires)));
    }

    function classifyTopic(input = "") {
        const text = normalizeInput(input);
        for (const label of classificationOrder) {
            const topic = topicByLabel(label);
            if (hasAny(text, topic.patterns) && (!topic.requires || hasAny(text, topic.requires))) {
                return topic.label;
            }
        }
        return "";
    }

    function topicLensDefinitions(prefix = "") {
        return topicDefinitions.map((topic) => ({
            focus: topic.label,
            label: topic.label,
            description: topic.lensDescription || topic.description,
            route: routeForTopic(topic.label, prefix)
        }));
    }

    function topicPageConfig(label) {
        const topic = topicByLabel(label) || topicDefinitions[0];
        return {
            ...topic,
            route: routeForTopic(topic.label, "../../"),
            actions: (topic.actions || []).map(([actionLabel, href, description]) => [
                actionLabel,
                withPrefix("../../", href),
                description
            ])
        };
    }

    return {
        topicDefinitions,
        trackedTopicLabels: topicDefinitions.map((topic) => topic.label),
        topicPageLabels: ["AI agents", "MCP", "Agent skills"],
        topicByLabel,
        routeForTopic,
        exploreRouteForTopic,
        matchesTopic,
        classifyTopic,
        topicLensDefinitions,
        topicPageConfig
    };
});
