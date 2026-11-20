import {readFileSync} from 'node:fs';

// Compatibility for cached pages and the former publishing hostname's asset redirects.
// Exact inventoried paths only: never proxy requests back to Lovable or accept arbitrary destinations.
const media=JSON.parse(readFileSync(new URL('./docs/lovable-media-manifest.json',import.meta.url),'utf8'));
export default {
 async redirects(){
  return Object.values(media).map(asset=>({
   source:new URL(asset.url).pathname,
   destination:asset.localUrl,
   permanent:false,
  }));
 },
};
