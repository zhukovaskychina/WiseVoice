import request from 'umi-request';

export async function queryTags() {
  return request('/api/tags');
}

export async function updateWavFile(data:any) {
  return request('/api/submitVoiceQuery', {
    method: 'POST',
    data,
  });
}
