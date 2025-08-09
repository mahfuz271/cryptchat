import { NextResponse } from "next/server";
import User from "@/models/User";
import dbConnect from "@/lib/db";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, email, password, publicKey, privateKey } =
      await request.json();

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return NextResponse.json(
        { message: "Username or email already exists" },
        { status: 400 }
      );
    }

    const user = new User({
      username,
      email,
      password,
      publicKey,
      privateKey,
    });

    await user.save();

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Error creating user", error: message },
      { status: 500 }
    );
  }
}
