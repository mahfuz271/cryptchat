import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import dbConnect from "@/lib/db";
import { decryptPrivateKey } from "@/lib/crypto";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();

        const user = await User.findOne({ username: credentials?.username });
        if (!user) throw new Error("No user found");

        const isValid = await user.comparePassword(credentials?.password || "");
        if (!isValid) throw new Error("Invalid password");

        const privateKey = decryptPrivateKey(
          user.privateKey,
          credentials?.password || ""
        );

        return {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          privateKey,
          publicKey: user.publicKey,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.privateKey = user.privateKey;
        token.publicKey = user.publicKey;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.privateKey = token.privateKey;
        session.user.publicKey = token.publicKey;
      }
      return session;
    },
  },
};
