import apiClient from './apiClient';

export interface MeetingQueryParams {
  status?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  related_lead_id?: string;
  related_project_id?: string;
  page?: number;
  limit?: number;
}

export interface CalendarQueryParams {
  start_date?: string;
  end_date?: string;
  timezone?: string;
  filter?: string;
}

export const meetingApi = {
  // 1. Unified Calendar (Single source of truth)
  getCalendar: (params?: CalendarQueryParams) => apiClient.get('/meetings/calendar', { params }),

  // 2. Meeting CRUD & Listing
  getMeetings: (params?: MeetingQueryParams) => apiClient.get('/meetings', { params }),
  getMeetingById: (id: string | number) => apiClient.get(`/meetings/${id}`),
  createMeeting: (data: any) => apiClient.post('/meetings', data),
  createInstantMeeting: (data?: any) => apiClient.post('/meetings/instant', data || {}),
  updateMeeting: (id: string | number, data: any) => apiClient.put(`/meetings/${id}`, data),
  deleteMeeting: (id: string | number) => apiClient.delete(`/meetings/${id}`),
  cancelMeeting: (id: string | number) => apiClient.post(`/meetings/${id}/cancel`),

  // 3. Lifecycle Operations
  joinMeeting: (id: string | number) => apiClient.post(`/meetings/${id}/join`),
  leaveMeeting: (id: string | number) => apiClient.post(`/meetings/${id}/leave`),
  endMeeting: (id: string | number) => apiClient.post(`/meetings/${id}/end`),

  // 4. Invitations
  inviteParticipant: (id: string | number, data: { user_id?: number; email?: string; name?: string }) => 
    apiClient.post(`/meetings/${id}/invite`, data),
  respondInvitation: (id: string | number, response_status: 'ACCEPTED' | 'DECLINED' | 'MAYBE') => 
    apiClient.post(`/meetings/${id}/respond`, { response_status }),

  // 5. Outcome Recording
  recordOutcome: (id: string | number, data: { outcome: string; notes?: string; next_action?: string; next_action_date?: string; lead_id?: string }) =>
    apiClient.post(`/meetings/${id}/outcome`, data),

  // 6. Notes, Docs, Polls & Recordings
  getNotes: (id: string | number) => apiClient.get(`/meetings/${id}/notes`),
  updateNotes: (id: string | number, data: { content: string; note_type?: string }) => apiClient.put(`/meetings/${id}/notes`, data),
  getDocuments: (id: string | number) => apiClient.get(`/meetings/${id}/documents`),
  uploadDocument: (id: string | number, formData: FormData) => 
    apiClient.post(`/meetings/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getPolls: (id: string | number) => apiClient.get(`/meetings/${id}/polls`),
  createPoll: (id: string | number, data: { question: string; options: string[]; allow_multiple?: boolean }) => 
    apiClient.post(`/meetings/${id}/polls`, data),
  getRecordings: (id?: string | number) => apiClient.get(id ? `/meetings/${id}/recordings` : '/meetings/recordings'),
};

export default meetingApi;
