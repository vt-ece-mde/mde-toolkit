import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";


const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/drive",
    // "https://www.googleapis.com/auth/drive.file",
    // "https://www.googleapis.com/auth/drive.readonly",
    // "https://www.googleapis.com/auth/drive.metadata.readonly",
    // "https://www.googleapis.com/auth/drive.appdata",
    // "https://www.googleapis.com/auth/drive.metadata",
    // "https://www.googleapis.com/auth/drive.photos.readonly",
];

async function refreshAccessToken(token) {
    try {
        const url = "https://oauth2.googleapis.com/token?" + new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: token.refresh_token,
        })

        const res = await fetch(url, {
            headers: {
                "Content-Type": "application/x-www-form-url-encoded",
            },
            method: "POST",
        })

        const refreshed_tokens = await res.json()

        if (!res.ok) {
            throw refreshed_tokens
        }

        const { error, ...rest } = token; // Destruct token and remove any previous error messages.

        const t = {
            ...rest, // was `token`
            access_token: refreshed_tokens.access_token,
            access_token_expires: Date.now() + refreshed_tokens.expires_in * 1_000 - 10_000, // 10 second buffer
            refresh_token: refreshed_tokens.refresh_token ?? token.refresh_token, // Fall back to old refresh token.
        }
        console.log(`t? ${JSON.stringify(t)}`)
        return t
    } catch (error) {
        console.log(`ERROR: ${JSON.stringify(error)}`)

        return {
            ...token,
            error: "RefreshAccessTokenError",
        }
    }
}

export const authOptions = {
    // Configure one or more authentication providers
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: scopes.join(" "),
                }
            }
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    jwt: {
        encryption: true,
        secret: process.env.NEXTAUTH_SECRET,
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    callbacks: {
        async signIn({ account, profile }) {
            if (account.provider === 'google') {
                return profile.email_verified && profile.email.endsWith("@vt.edu")
            }
            return true
        },
        async jwt({ token, user, account, profile, isNewUser }) {

            // console.log(`token? ${JSON.stringify(token)}`)
            // console.log(`user? ${JSON.stringify(user)}`)
            // console.log(`account? ${JSON.stringify(account)}`)
            // console.log(`profile? ${JSON.stringify(profile)}`)
            // console.log(`isNewUser? ${JSON.stringify(isNewUser)}`)

            // Initial sign in.
            if (account && user) {
                return {
                    access_token: account.access_token,
                    access_token_expires: Date.now() + account.expires_in * 1_000 -  10_000, // 10 second buffer
                    refresh_token: account.refresh_token,
                    user,
                }
            }

            // Return previous token if the access has not expired yet.
            if (Date.now() < token.access_token_expires) {
                return token
            }

            // Access token has expired, try to update it.
            return refreshAccessToken(token)
        },
        async session({ session, token }) {
            // Add properties to session, like an access_token from a provider.
            session.user = token.user
            session.access_token = token.access_token
            session.refresh_token = token.refresh_token
            session.error = token.error
            return session
        }
    },
}

export default NextAuth(authOptions)