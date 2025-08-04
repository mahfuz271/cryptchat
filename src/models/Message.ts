import mongoose, { Document } from "mongoose";

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  contentForRecipient: string;
  contentForSender: string;
  isEncrypted: boolean;
  timestamp: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  contentForRecipient: { type: String, required: true },
  contentForSender: { type: String, required: true },
  isEncrypted: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);
