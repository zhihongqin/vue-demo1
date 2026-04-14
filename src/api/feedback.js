import request from '@/utils/request'

/** 仪表盘：未处理条数、反馈总数 */
export const getFeedbackStats = () => request.get('/admin/feedback/stats')

/** 管理员分页查询反馈 */
export const getFeedbackPage = (params) =>
  request.get('/admin/feedback', { params })

/** 管理员更新处理状态 */
export const processFeedback = (id, data) =>
  request.put(`/admin/feedback/${id}/process`, data)
