import request from '@/utils/request'

export const adminLogin = (data) =>
  request.post('/user/admin/login', data)

export const adminLogout = () =>
  request.post('/user/admin/logout')

export const changePassword = (data) =>
  request.put('/user/admin/password', data)
