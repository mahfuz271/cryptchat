import { NextResponse } from "next/server";
import Message from "@/models/Message";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const recipientId = searchParams.get("recipientId");

  try {
    const messages = await Message.find({
      $or: [
        { sender: session.user.id, recipient: recipientId },
        { sender: recipientId, recipient: session.user.id },
      ],
    }).sort({ timestamp: 1 });

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sender, recipient, contentForRecipient, contentForSender } =
      await request.json();

    const message = new Message({
      sender,
      recipient,
      contentForRecipient,
      contentForSender,
      timestamp: new Date(),
    });

    await message.save();

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json(
      { error: "Error sending message" },
      { status: 500 }
    );
  }
}
