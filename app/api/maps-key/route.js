export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Response.json({ error: 'Google Maps API key is not configured.' }, { status: 500 });
  }
  return Response.json(
    { key },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
