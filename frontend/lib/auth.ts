import type { Session } from 'next-auth';


export interface AuthSession extends Session {
    access_token?: string;
    refresh_token?: string;
}