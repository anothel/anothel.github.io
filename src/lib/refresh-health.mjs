import { createRequire } from "node:module";

const { validSourceTimestamp } = createRequire(import.meta.url)("../../js/data-health.js");

// Daily generation plus twelve hours of scheduler/processing grace. This is a
// published-output clock, not evidence that GitHub's scheduler is enabled.
export const refreshMaxAgeHours = 36;
const futureToleranceMs = 5 * 60 * 1000;

export function pipelineFreshness(generatedAt, now = new Date()) {
    const nowMs = new Date(now).getTime();
    const valid = validSourceTimestamp(generatedAt);
    const generatedMs = valid ? Date.parse(generatedAt) : NaN;
    const age = nowMs - generatedMs;
    if (!Number.isFinite(age) || age < -futureToleranceMs) {
        return { state: "unknown", ageHours: null, generatedAt: null, detail: "Generation timestamp is missing, invalid, or in the future." };
    }
    const state = age > refreshMaxAgeHours * 3600000 ? "overdue" : "current";
    return {
        state,
        ageHours: Math.max(0, Math.floor(age / 3600000)),
        generatedAt,
        detail: state === "overdue"
            ? "No published generation within 36 hours. Inspect Update data and deployment history; the cause is unconfirmed."
            : "Generation is within 36 hours. This does not confirm source freshness or scheduler enablement."
    };
}
