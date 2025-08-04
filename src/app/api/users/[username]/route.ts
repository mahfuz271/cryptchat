import { NextResponse } from "next/server";
import User from "@/models/User";
import dbConnect from "@/lib/db";

//id passed username because dual dynamic route not possible on same folder
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  await dbConnect();
  const { username } = await params;

  try {
    const user = await User.findById(username, {
      password: 0,
      privateKey: 0,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching public key" },
      { status: 500 }
    );
  }
}
