import axios from 'axios';

const client = axios.create({
  baseURL: '/api'
});

export async function fetchExamples() {
  const { data } = await client.get('/examples');
  return data.examples;
}

export async function fetchLessons() {
  const { data } = await client.get('/lessons');
  return data.lessons;
}

export async function fetchLesson(id) {
  const { data } = await client.get(`/lessons/${id}`);
  return data;
}

export async function compileModel(payload, file) {
  if (file) {
    const form = new FormData();
    form.append('file', file);
    Object.entries(payload).forEach(([key, value]) => {
      if (value) {
        form.append(key, value);
      }
    });
    const { data } = await client.post('/model/compile', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  }
  const { data } = await client.post('/model/compile', payload);
  return data;
}

export async function runSelection(payload) {
  const { data } = await client.post('/selection/run', payload);
  return data;
}

export async function healthCheck() {
  const { data } = await client.get('/health');
  return data;
}
