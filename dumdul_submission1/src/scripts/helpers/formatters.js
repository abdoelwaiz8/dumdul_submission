export function formatDate(dateString, locale = 'id-ID', options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Date(dateString).toLocaleDateString(locale, {
    ...defaultOptions,
    ...options,
  });
}

export function delay(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}