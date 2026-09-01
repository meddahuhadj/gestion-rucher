import client, { unwrap } from './client';

export const authApi = {
  login: (data) => client.post('/auth/login', data).then(unwrap),
  register: (data) => client.post('/auth/register', data).then(unwrap),
  me: () => client.get('/auth/me').then(unwrap),
  updateProfile: (data) => client.put('/user/profile', data).then(unwrap),
};

export const workspaceApi = {
  current: () => client.get('/workspaces').then(unwrap),
  create: (data) => client.post('/workspaces', data).then(unwrap),
  join: (data) => client.post('/workspaces/join', data).then(unwrap),
  setActive: (workspaceId) => client.put('/workspaces/active', { workspaceId }).then(unwrap),
  removeMember: (workspaceId, userId) => client.delete(`/workspaces/${workspaceId}/members/${userId}`).then(unwrap),
  leave: (workspaceId) => client.delete(`/workspaces/${workspaceId}/leave`).then(unwrap),
  transferOwner: (workspaceId, userId) => client.post(`/workspaces/${workspaceId}/transfer/${userId}`).then(unwrap),
};

export const apiaryApi = {
  list: () => client.get('/apiaries').then(unwrap),
  get: (id) => client.get(`/apiaries/${id}`).then(unwrap),
  create: (data) => client.post('/apiaries', data).then(unwrap),
  update: (id, data) => client.put(`/apiaries/${id}`, data).then(unwrap),
  remove: (id) => client.delete(`/apiaries/${id}`).then(unwrap),
};

export const hiveApi = {
  list: (params) => client.get('/hives', { params }).then(unwrap),
  get: (id) => client.get(`/hives/${id}`).then(unwrap),
  create: (data) => client.post('/hives', data).then(unwrap),
  update: (id, data) => client.put(`/hives/${id}`, data).then(unwrap),
  remove: (id) => client.delete(`/hives/${id}`).then(unwrap),
};

export const inspectionApi = {
  list: (params) => client.get('/inspections', { params }).then(unwrap),
  get: (id) => client.get(`/inspections/${id}`).then(unwrap),
  create: (data) => client.post('/inspections', data).then(unwrap),
  update: (id, data) => client.put(`/inspections/${id}`, data).then(unwrap),
  remove: (id) => client.delete(`/inspections/${id}`).then(unwrap),
};

export const taskApi = {
  list: (params) => client.get('/tasks', { params }).then(unwrap),
  get: (id) => client.get(`/tasks/${id}`).then(unwrap),
  create: (data) => client.post('/tasks', data).then(unwrap),
  update: (id, data) => client.put(`/tasks/${id}`, data).then(unwrap),
  remove: (id) => client.delete(`/tasks/${id}`).then(unwrap),
};

export const queenApi = {
  list: (params) => client.get('/queens', { params }).then(unwrap),
  get: (id) => client.get(`/queens/${id}`).then(unwrap),
  create: (data) => client.post('/queens', data).then(unwrap),
  update: (id, data) => client.put(`/queens/${id}`, data).then(unwrap),
  remove: (id) => client.delete(`/queens/${id}`).then(unwrap),
};

export const harvestApi = {
  list: (params) => client.get('/harvests', { params }).then(unwrap),
  get: (id) => client.get(`/harvests/${id}`).then(unwrap),
  create: (data) => client.post('/harvests', data).then(unwrap),
  update: (id, data) => client.put(`/harvests/${id}`, data).then(unwrap),
  remove: (id) => client.delete(`/harvests/${id}`).then(unwrap),
};

export const expenseApi = {
  list: (params) => client.get('/expenses', { params }).then(unwrap),
  get: (id) => client.get(`/expenses/${id}`).then(unwrap),
  create: (data) => client.post('/expenses', data).then(unwrap),
  update: (id, data) => client.put(`/expenses/${id}`, data).then(unwrap),
  remove: (id) => client.delete(`/expenses/${id}`).then(unwrap),
};

export const revenueApi = {
  list: (params) => client.get('/revenues', { params }).then(unwrap),
  get: (id) => client.get(`/revenues/${id}`).then(unwrap),
  create: (data) => client.post('/revenues', data).then(unwrap),
  update: (id, data) => client.put(`/revenues/${id}`, data).then(unwrap),
  remove: (id) => client.delete(`/revenues/${id}`).then(unwrap),
};

export const notificationApi = {
  list: (params) => client.get('/notifications', { params }).then(unwrap),
  markRead: (id) => client.put(`/notifications/${id}/read`).then(unwrap),
  markAllRead: () => client.put('/notifications/read-all').then(unwrap),
  remove: (id) => client.delete(`/notifications/${id}`).then(unwrap),
};

export const statsApi = {
  dashboard: () => client.get('/stats/dashboard').then(unwrap),
  overview: () => client.get('/stats/overview').then(unwrap),
};

export const uploadApi = {
  upload: (files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    return client
      .post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => res.data.data);
  },
};
