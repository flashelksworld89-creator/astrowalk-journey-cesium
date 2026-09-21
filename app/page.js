'use client';

import dynamic from 'next/dynamic';

const AstroWalkClient = dynamic(() => import('../src/AstroWalkClient'), {
  ssr: false,
  loading: () => <main className="app"><section className="card loading-chart">Loading AstroWalk Journey…</section></main>,
});

export default function HomePage() {
  return <AstroWalkClient />;
}
