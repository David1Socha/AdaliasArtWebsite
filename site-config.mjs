export function siteConfig(defaultUrl) {
  const url = new URL(process.env.SITE_URL || defaultUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.search || url.hash) {
    throw new Error('SITE_URL must be an HTTP(S) site URL without a query or fragment.');
  }
  const basePath = url.pathname.replace(/\/$/, '');
  const siteUrl = url.origin + basePath;
  const localUrl = value => value.startsWith('/') && !value.startsWith('//') ? basePath + value : value;
  return {basePath, siteUrl, localUrl};
}
