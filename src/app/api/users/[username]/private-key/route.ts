import { NextResponse } from "next/server";
import User from "@/models/User";
import dbConnect from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  await dbConnect();
  const { username } = await params;

  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      encryptedPrivateKey: user.privateKey,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching private key" },
      { status: 500 }
    );
  }
}
