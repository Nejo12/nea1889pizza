import {supabaseAuthConfig} from '@/lib/supabase/config';
import Login from '../login/login';
export const dynamic='force-dynamic';
export default function Page(){const config=supabaseAuthConfig();return config?<Login supabaseUrl={config.url} supabaseKey={config.key} dashboard/>:<main className="login-shell"><h1>Restaurant-Login</h1><p>Der Zugang wird eingerichtet.</p><a href="/">Zurück</a></main>;}
