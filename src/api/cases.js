import request from '@/utils/request'

export const getCaseList = (params) =>
  request.get('/cases', { params })

export const getCaseDetail = (id) =>
  request.get(`/cases/${id}`)

export const createCase = (data) =>
  request.post('/cases', data)

export const updateCase = (id, data) =>
  request.put(`/cases/${id}`, data)

export const softDeleteCase = (id) =>
  request.delete(`/cases/${id}`)

export const restoreCase = (id) =>
  request.put(`/cases/${id}/restore`)

export const hardDeleteCase = (id) =>
  request.delete(`/cases/${id}/permanent`)

export const triggerTranslation = (id) =>
  request.post(`/cases/${id}/translate`)

export const triggerEnrich = (id) =>
  request.post(`/cases/${id}/enrich`)

export const triggerSummary = (id) =>
  request.post(`/cases/${id}/summary`)

export const triggerScore = (id) =>
  request.post(`/cases/${id}/score`)

export const markAiCompleted = (id) =>
  request.put(`/cases/${id}/ai-complete`)

/** 推送案例至 FastGPT 知识库（管理员，异步） */
export const syncFastgptKnowledge = (id) =>
  request.post(`/cases/${id}/sync-fastgpt`)

export const getTranslationRecords = (id) =>
  request.get(`/cases/${id}/translations`)

export const getSummaryRecords = (id) =>
  request.get(`/cases/${id}/summaries`)

export const getScoreRecords = (id) =>
  request.get(`/cases/${id}/scores`)
