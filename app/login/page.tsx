import {authConfig} from '@/lib/auth-config';
import Login from './login';
export const dynamic='force-dynamic';
export default function Page(){const config=authConfig();return config?<Login publishableKey={config.publishableKey}/>:<main className="login-shell"><h1>Restaurant-Login</h1><p>Der Zugang wird eingerichtet.</p><a href="/">Zurück</a></main>;}
