// Centralized API client for Q-Sage backend
const BASE_URL = '/api';

function getToken(): string | null {
    return localStorage.getItem('qsage_token');
}

function headers(isFormData = false): HeadersInit {
    const token = getToken();
    const h: HeadersInit = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (!isFormData) h['Content-Type'] = 'application/json';
    return h;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
    return data as T;
}

// ──────────────────────────────
// Auth
// ──────────────────────────────
export const api = {
    auth: {
        signup: (body: { name: string; email: string; password: string; role: string }) =>
            request<{ token: string; user: any }>('/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }),

        login: (body: { email: string; password: string; role: string }) =>
            request<{ token: string; user: any }>('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }),
    },

    // ──────────────────────────────
    // Users (admin)
    // ──────────────────────────────
    users: {
        list: (role?: string) =>
            request<any[]>(`/users${role ? `?role=${role}` : ''}`, { headers: headers() }),
        stats: () =>
            request<{ faculty_count: number; student_count: number }>('/users', { headers: headers() }),
        delete: (id: number) =>
            request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE', headers: headers() }),
        setCoordinator: (id: number, is_coordinator: boolean) =>
            request<{ success: boolean; is_coordinator: boolean }>(`/users/${id}/coordinator`, {
                method: 'PATCH', headers: headers(), body: JSON.stringify({ is_coordinator }),
            }),
    },

    // ──────────────────────────────
    // Syllabi
    // ──────────────────────────────
    syllabi: {
        upload: (formData: FormData) =>
            request<any>('/syllabi', { method: 'POST', headers: headers(true), body: formData }),
        list: () =>
            request<any[]>('/syllabi', { headers: headers() }),
        get: (id: number) =>
            request<any>(`/syllabi/${id}`, { headers: headers() }),
        approve: (id: number) =>
            request<{ success: boolean }>(`/syllabi/${id}/approve`, { method: 'PATCH', headers: headers() }),
        reject: (id: number) =>
            request<{ success: boolean }>(`/syllabi/${id}/reject`, { method: 'PATCH', headers: headers() }),
    },

    // ──────────────────────────────
    // Questions
    // ──────────────────────────────
    questions: {
        save: (questions: any[]) =>
            request<any[]>('/questions', {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify(questions),
            }),
        list: (syllabusId?: number) =>
            request<any[]>(`/questions${syllabusId ? `?syllabusId=${syllabusId}` : ''}`, { headers: headers() }),
        listAll: () =>
            request<any[]>('/questions/all', { headers: headers() }),
        approve: (id: number) =>
            request<{ success: boolean }>(`/questions/${id}/approve`, { method: 'PATCH', headers: headers() }),
        reject: (id: number) =>
            request<{ success: boolean }>(`/questions/${id}/reject`, { method: 'PATCH', headers: headers() }),
        delete: (id: number) =>
            request<{ success: boolean }>(`/questions/${id}`, { method: 'DELETE', headers: headers() }),
    },

    // ──────────────────────────────
    // Papers
    // ──────────────────────────────
    papers: {
        create: (paper: any) =>
            request<any>('/papers', { method: 'POST', headers: headers(), body: JSON.stringify(paper) }),
        list: () =>
            request<any[]>('/papers', { headers: headers() }),
        listAll: () =>
            request<any[]>('/papers/all', { headers: headers() }),
        get: (id: number) =>
            request<any>(`/papers/${id}`, { headers: headers() }),
        save: (body: any) =>
            request<any>('/papers', { method: 'POST', headers: headers(), body: JSON.stringify(body) }),
        submit: (id: number) =>
            request<any>(`/papers/${id}/submit`, { method: 'POST', headers: headers() }),
        approve: (id: number) =>
            request<{ success: boolean }>(`/papers/${id}/approve`, { method: 'PATCH', headers: headers() }),
        reject: (id: number) =>
            request<{ success: boolean }>(`/papers/${id}/reject`, { method: 'PATCH', headers: headers() }),
        fileUrl: (id: number) => `/api/papers/${id}/file`,
    },

    // ──────────────────────────────
    // AI
    // ──────────────────────────────
    ai: {
        ragChat: (body: { prompt: string; syllabusContext?: string; conversationHistory?: any[] }) =>
            request<{ response: string }>('/ai/rag-chat', {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify(body),
            }),
    },

    // ──────────────────────────────
    // Logs
    // ──────────────────────────────
    logs: {
        list: () =>
            request<any[]>('/logs', { headers: headers() }),
    },

    // ──────────────────────────────
    // Q-Bank Documents
    // ──────────────────────────────
    qbanks: {
        save: (body: any) =>
            request<any>('/qbanks', { method: 'POST', headers: headers(), body: JSON.stringify(body) }),
        submit: (id: number) =>
            request<any>(`/qbanks/${id}/submit`, { method: 'POST', headers: headers() }),
        list: () =>
            request<any[]>('/qbanks', { headers: headers() }),
        listAll: () =>
            request<any[]>('/qbanks/all', { headers: headers() }),
        approve: (id: number) =>
            request<{ success: boolean }>(`/qbanks/${id}/approve`, { method: 'PATCH', headers: headers() }),
        reject: (id: number) =>
            request<{ success: boolean }>(`/qbanks/${id}/reject`, { method: 'PATCH', headers: headers() }),
        fileUrl: (id: number) => `/api/qbanks/${id}/file`,
    },

    // ──────────────────────────────
    // Year Coordinator
    // ──────────────────────────────
    coordinator: {
        // Q-Bank routes
        listQBanks: () =>
            request<any[]>('/coordinator/qbanks', { headers: headers() }),
        getReviews: (qbId: number) =>
            request<any[]>(`/coordinator/qbanks/${qbId}/reviews`, { headers: headers() }),
        reviewQBank: (qbId: number, action: 'approve' | 'reject' | 'forward', remarks: string) =>
            request<any>(`/coordinator/qbanks/${qbId}/review`, {
                method: 'POST', headers: headers(), body: JSON.stringify({ action, remarks }),
            }),
        // Paper routes
        listPapers: () =>
            request<any[]>('/coordinator/papers', { headers: headers() }),
        reviewPaper: (paperId: number, action: 'approve' | 'reject' | 'forward', remarks: string) =>
            request<any>(`/coordinator/papers/${paperId}/review`, {
                method: 'POST', headers: headers(), body: JSON.stringify({ action, remarks }),
            }),
    },
};

export function saveToken(token: string) {
    localStorage.setItem('qsage_token', token);
}

export function clearToken() {
    localStorage.removeItem('qsage_token');
}
