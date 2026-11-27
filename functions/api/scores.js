export async function onRequest({ env }) {
  const url =
    "https://api.cricapi.com/v1/currentMatches?apikey=" +
    encodeURIComponent(env.CRICKET_API_KEY) +
    "&offset=0";

  const response = await fetch(url);
  const data = await response.text();

  return new Response(data, {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60"
    }
  });
}
