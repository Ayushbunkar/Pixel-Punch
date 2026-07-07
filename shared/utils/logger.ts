
// shared/utils/logger.ts

if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  // Keep console.error for production
}
