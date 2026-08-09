function debounceAsync(fn, delay = 1000) {
  let timeout;
  return async (...args) =>
    new Promise((resolve) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const result = await fn(...args);
        resolve(result);
      }, delay);
    });
}

export default {
  debounceAsync,
};
