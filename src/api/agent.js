import request from '@/utils/request'

export const getAiProcessingCount = () =>
  request.get('/agent/processing-count')
