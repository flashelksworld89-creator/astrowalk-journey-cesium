import './globals.css';

export const metadata = {
  title: 'AstroWalk Journey',
  description: 'Sidereal astrology journey compass with natal, transit, route and live GPS interpretation.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

const chunkRecoveryScript = `
(() => {
  const key = 'astrowalk_chunk_retry';
  const recover = (value) => {
    const text = String(value?.message || value?.reason?.message || value?.reason || value || '');
    if (!/ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(text)) return;
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
    const url = new URL(window.location.href);
    url.searchParams.set('_aw_reload', Date.now().toString());
    window.location.replace(url.toString());
  };
  window.addEventListener('error', e => recover(e.error || e.message));
  window.addEventListener('unhandledrejection', e => recover(e.reason));
  window.addEventListener('pageshow', () => {
    if (!location.search.includes('_aw_reload=')) sessionStorage.removeItem(key);
  });
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: chunkRecoveryScript }} />
        {children}
      </body>
    </html>
  );
}
