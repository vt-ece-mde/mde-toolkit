import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";


const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/drive",
];
export default NextAuth({
    // Configure one or more authentication providers
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            scope: scopes.join(" "),
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
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

            // Add access_token to the token right after signin.
            if (account?.access_token) {
                token.access_token = account.access_token
            }
            // Add refresh_token to the token right after signin.
            if (account?.refresh_token) {
                token.refresh_token = account.refresh_token
            }
            return token;
          },
        async session({ session, token, user }) {
            // Add properties to session, like an access_token from a provider.
            session.access_token = token.access_token
            session.refresh_token = token.refresh_token
            return session
        }
    },
})