import request from '@/utils/request'

/**
 * 分页查询爬取任务历史
 * @param {Object} params - crawlType, status, pageNum, pageSize
 */
export const getCrawlJobPage = (params) =>
  request.get('/admin/crawl-jobs', { params })
