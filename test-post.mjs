async function inspectPost() {
  const res = await fetch('https://thenkiri.com/wp-json/wp/v2/posts?search=Spider');
  const posts = await res.json();
  const post = posts[0];
  console.log('Post Title:', post.title?.rendered);
  console.log('Post Link:', post.link);
  const content = post.content?.rendered || '';
  console.log('Content length:', content.length);
  
  // Find all links in content
  const matches = [...content.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  console.log('Found links in content:', matches.length);
  const downloadLinks = matches.filter(l => l.includes('downloadwella') || l.includes('download') || l.includes('.mkv') || l.includes('.mp4'));
  console.log('Filtered download links:', downloadLinks);
}
inspectPost();
