import api from './api';

export const getTasks = async (projectId) => {
    const url = projectId ? `/projects/${projectId}/tasks` : '/tasks';
    const response = await api.get(url);
    return response.data;
};

export const createTask = async (projectId, taskData) => {
    const url = projectId ? `/projects/${projectId}/tasks` : '/tasks';
    const response = await api.post(url, taskData);
    return response.data;
};

export const updateTask = async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
};

export const deleteTask = async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
};
