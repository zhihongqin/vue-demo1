import request from '@/utils/request'

/** 分页条件查询 */
export const getHotKeywordPage = (params) =>
  request.get('/admin/hot-keywords', { params })

export const createHotKeyword = (data) =>
  request.post('/admin/hot-keywords', data)

export const updateHotKeyword = (id, data) =>
  request.put(`/admin/hot-keywords/${id}`, data)

export const deleteHotKeyword = (id) =>
  request.delete(`/admin/hot-keywords/${id}`)

export const refreshHotKeywords = () =>
  request.post('/admin/hot-keywords/refresh')

export const batchDeleteHotKeywords = (ids) =>
  request.post('/admin/hot-keywords/batch-delete', ids)
