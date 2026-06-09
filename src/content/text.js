export function applyPanguSpacing(value = '') {
  return String(value)
    .replace(/([\u2e80-\u9fff])([A-Za-z0-9]+)/g, '$1 $2')
    .replace(/([A-Za-z0-9]+)([\u2e80-\u9fff])/g, '$1 $2');
}

export function renderText(value = '') {
  return applyPanguSpacing(value);
}

export function normalizeLineEndings(value = '') {
  return String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
