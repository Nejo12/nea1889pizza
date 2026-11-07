// Single source of trusted browser origins (AUTHORIZED_ORIGINS). Deliberately free of any auth-provider code,
// so the guest API (and its vendored copy) can use it without importing a provider module.
export function authorizedOrigins(){
 const origins=(process.env.AUTHORIZED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(process.env.VERCEL_ENV==='preview'&&process.env.VERCEL_URL)origins.push(`https://${process.env.VERCEL_URL}`);
 if(process.env.NODE_ENV==='development')origins.push('http://localhost:3000');
 return [...new Set(origins)];
}
