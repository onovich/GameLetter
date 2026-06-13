export function requestJson(url, options = {}) {
  return fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `请求失败：${response.status}`);
    }
    return payload;
  });
}
