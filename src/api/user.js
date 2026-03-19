import request from '@/utils/request'

export const getUserCount = () =>
  request.get('/user/admin/count')

export const getUserList = (params) =>
  request.get('/user/admin/list', { params })

export const updateUserStatus = (userId, status) =>
  request.put(`/user/admin/${userId}/status`, null, { params: { status } })

export const updateUserRole = (userId, data) =>
  request.put(`/user/admin/${userId}/role`, data)

export const deleteUser = (userId) =>
  request.delete(`/user/admin/${userId}`)
