"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestDraft = requestDraft;
exports.waitDraft = waitDraft;
const API = process.env.DRAFT_API_URL || 'http://localhost:4005';
const KEY = process.env.DRAFT_API_KEY || 'CHANGE_ME_SECRET';
async function api(path, init) {
    const res = await fetch(`${API}${path}`, {
        ...init,
        headers: {
            'x-api-key': KEY,
            'content-type': 'application/json',
            ...(init?.headers || {})
        }
    });
    if (res.status === 202) {
        // Réponse "pending" (BullMQ job pas encore terminé)
        return { status: 'pending' };
    }
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${res.status} ${text || res.statusText}`);
    }
    return res.json();
}
async function requestDraft(blueName, redName) {
    const r = await api('/drafts', {
        method: 'POST',
        body: JSON.stringify({ blueName, redName }),
    });
    return r.id;
}
async function waitDraft(id, timeoutMs = 90000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const r = await api(`/drafts/${id}`);
        if (r.status === 'ready' && r.links)
            return r.links;
        if (r.status === 'error')
            throw new Error(r.message || 'draft error');
        await new Promise((res) => setTimeout(res, 2000));
    }
    throw new Error('draft timeout');
}
