const tmdbKey = "bc96f3d21bf9384fe03ffe84bace0ac1";

async function run() {
  console.log("Checking TMDB...");
  const tRes = await fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${tmdbKey}`);
  const tData = await tRes.json();
  console.log("TMDB items:", tData.results?.length, tData.results?.[0]?.title);

  // Check David Cyril endpoints mentioned by user:
  // 1. /endpoints/movies/search?query=Avatar
  // 2. /endpoints/movies/moviebox-download-by-id-or-title?id=...
  // 3. /endpoints/movies/stream-x-search-stream-links?query=...
  const urls = [
    "https://apis.davidcyril.name.ng/endpoints/movies/search?query=Avatar",
    "https://apis.davidcyril.name.ng/endpoints/movies/stream-x-search-stream-links?query=Avatar",
    "https://apis.davidcyril.name.ng/endpoints/movies/moviebox-download-by-id-or-title?id=Avatar",
    "https://apis.davidcyril.name.ng/movie/search?query=Avatar",
    "https://apis.davidcyril.name.ng/api/movie/search?query=Avatar"
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u);
      console.log(u, "=> status:", res.status, "type:", res.headers.get("content-type"));
      if (res.ok) {
        const d = await res.json();
        console.log("Response:", JSON.stringify(d).slice(0, 200));
      }
    } catch (e) {
      console.log(u, "=> error:", e.message);
    }
  }
}

run();
