import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export default NextAuth({
    // Configure one or more authentication providers
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // authorizationUrl: "https://accounts.google.com/o/oauth2/auth?response_type=code&hd=vt.edu", // hosted domain is vt.edu
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
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
    },
})