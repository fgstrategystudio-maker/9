import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001/api'
})

// Profile
export const getProfile = () => api.get('/profile').then(r => r.data)
export const updateProfile = (data) => api.put('/profile', data).then(r => r.data)
export const addAllergy = (data) => api.post('/profile/allergies', data).then(r => r.data)
export const deleteAllergy = (id) => api.delete(`/profile/allergies/${id}`).then(r => r.data)
export const addMedication = (data) => api.post('/profile/medications', data).then(r => r.data)
export const deleteMedication = (id) => api.delete(`/profile/medications/${id}`).then(r => r.data)
export const addCondition = (data) => api.post('/profile/conditions', data).then(r => r.data)
export const updateCondition = (id, data) => api.put(`/profile/conditions/${id}`, data).then(r => r.data)
export const deleteCondition = (id) => api.delete(`/profile/conditions/${id}`).then(r => r.data)
export const addVaccination = (data) => api.post('/profile/vaccinations', data).then(r => r.data)
export const deleteVaccination = (id) => api.delete(`/profile/vaccinations/${id}`).then(r => r.data)

// Episodes
export const getEpisodes = () => api.get('/episodes').then(r => r.data)
export const getEpisode = (id) => api.get(`/episodes/${id}`).then(r => r.data)
export const createEpisode = (data) => api.post('/episodes', data).then(r => r.data)
export const updateEpisode = (id, data) => api.put(`/episodes/${id}`, data).then(r => r.data)
export const deleteEpisode = (id) => api.delete(`/episodes/${id}`).then(r => r.data)
export const addEpisodeMedication = (episodeId, data) => api.post(`/episodes/${episodeId}/medications`, data).then(r => r.data)
export const deleteEpisodeMedication = (episodeId, mid) => api.delete(`/episodes/${episodeId}/medications/${mid}`).then(r => r.data)

// Exams
export const getExams = (episodeId) => api.get('/exams', { params: episodeId ? { episode_id: episodeId } : {} }).then(r => r.data)
export const createExam = (formData) => api.post('/exams', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
export const updateExam = (id, data) => api.put(`/exams/${id}`, data).then(r => r.data)
export const deleteExam = (id) => api.delete(`/exams/${id}`).then(r => r.data)

// Family
export const getFamily = () => api.get('/family').then(r => r.data)
export const createFamily = (data) => api.post('/family', data).then(r => r.data)
export const updateFamily = (id, data) => api.put(`/family/${id}`, data).then(r => r.data)
export const deleteFamily = (id) => api.delete(`/family/${id}`).then(r => r.data)
export const getLifestyle = () => api.get('/family/lifestyle').then(r => r.data)
export const updateLifestyle = (data) => api.put('/family/lifestyle', data).then(r => r.data)

// Extract
export const extractDocument = (file) => {
  const formData = new FormData()
  formData.append('document', file)
  return api.post('/extract', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
}
