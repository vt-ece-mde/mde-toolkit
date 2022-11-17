
import NextAuth from "next-auth"


// https://next-auth.js.org/getting-started/typescript#module-augmentation
declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        access_token: string,
        access_token_expires: number;
        refresh_token: string,
        error: string,
    }
}