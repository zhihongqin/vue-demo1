import request from '@/utils/request'

export const startCrawler = () =>
  request.post('/admin/crawler/start')

export const queryCrawler = (keyword) =>
  request.post('/admin/crawler/query', null, { params: { keyword } })

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
