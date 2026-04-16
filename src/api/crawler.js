import request from '@/utils/request'

/**
 * 启动 CourtListener 全量采集
 * @param {number} [maxPages] - 每个关键词最多爬取页数；不传则由后端使用配置文件默认值
 */
export const startCrawler = (maxPages) => {
  const params = {}
  if (maxPages != null && maxPages !== '') params.maxPages = maxPages
  return request.post('/admin/crawler/start', null, { params })
}

/**
 * 按单个关键词采集 CourtListener
 * @param {string} keyword
 * @param {number} [maxPages] - 该关键词最多爬取页数；不传则后端用配置默认值
 */
export const queryCrawler = (keyword, maxPages) => {
  const params = { keyword }
  if (maxPages != null && maxPages !== '') params.maxPages = maxPages
  return request.post('/admin/crawler/query', null, { params })
}

export const getCrawlerStatus = () =>
  request.get('/admin/crawler/status')

export const startPythonCrawler = (crawler) =>
  request.post('/admin/crawler/python/start', null, { params: { crawler } })

export const stopPythonCrawler = (crawler) =>
  request.post('/admin/crawler/python/stop', null, { params: { crawler } })

export const getPythonCrawlerStatus = () =>
  request.get('/admin/crawler/python/status')

export const getKeywords = () =>
  request.get('/admin/crawler/keywords')

export const addKeyword = (keyword) =>
  request.post('/admin/crawler/keywords', null, { params: { keyword } })

export const removeKeyword = (keyword) =>
  request.delete('/admin/crawler/keywords', { params: { keyword } })

export const setKeywords = (keywords) =>
  request.put('/admin/crawler/keywords', keywords)

// ── 日本裁判所专属爬虫 ──────────────────────────────────────────────────────

/**
 * 启动日本裁判所爬虫
 * @param {Object} params - 检索参数
 * @param {string} params.query1          - 第1关键词（必填）
 * @param {string} [params.query2]        - 第2关键词
 * @param {string} [params.judgeGengoFrom] - 判决日期起·元号
 * @param {string} [params.judgeYearFrom]  - 判决日期起·年
 * @param {string} [params.judgeMonthFrom] - 判决日期起·月
 * @param {string} [params.judgeDayFrom]   - 判决日期起·日
 * @param {string} [params.judgeGengoTo]   - 判决日期止·元号
 * @param {string} [params.judgeYearTo]    - 判决日期止·年
 * @param {string} [params.judgeMonthTo]   - 判决日期止·月
 * @param {string} [params.judgeDayTo]     - 判决日期止·日
 * @param {string} [params.courtType]      - 裁判所种别
 * @param {string} [params.courtName]      - 裁判所名
 * @param {string} [params.branchName]     - 支部名
 * @param {number} [params.maxPages]       - 最大爬取页数
 */
export const startJapanCrawler = (params) =>
  request.post('/admin/crawler/python/start-japan', params)

export const stopJapanCrawler = () =>
  request.post('/admin/crawler/python/stop-japan')

export const getJapanCrawlerStatus = () =>
  request.get('/admin/crawler/python/status-japan')
