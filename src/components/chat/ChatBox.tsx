"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { decryptMessage, encryptMessage } from "@/lib/crypto";
import { User } from "next-auth";

interface Message {
  id: string;
  recipient: string;
  sender: string;
  contentForRecipient: string;
  contentForSender: string;
  content?: string;
  timestamp: Date;
  isEncrypted: boolean;
}

interface ChatBoxProps {
  recipientId: string;
}

export default function ChatBox({ recipientId }: ChatBoxProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState<User>();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRecipient = async () => {
      try {
        const response = await fetch(`/api/users/${recipientId}`);
        const data = await response.json();
        setRecipient(data);
      } catch (error) {
        console.error("Error fetching recipient:", error);
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/messages?recipientId=${recipientId}`
        );
        const data = await response.json();

        const processedMessages = await Promise.all(
          data.map(async (msg: Message) => {
            // For sender's own messages
            if (msg.sender === session?.user?.id && session?.user?.privateKey) {
              try {
                const decrypted = await decryptMessage(
                  msg.contentForSender,
                  session.user.privateKey
                );
                return { ...msg, content: decrypted, isEncrypted: false };
              } catch (error) {
                console.error("Decryption failed:", error);
                return { ...msg, content: "[Your message]" };
              }
            }

            // For received messages
            if (
              msg.recipient === session?.user?.id &&
              session?.user?.privateKey
            ) {
              try {
                const decrypted = await decryptMessage(
                  msg.contentForRecipient,
                  session.user.privateKey
                );
                return { ...msg, content: decrypted, isEncrypted: false };
              } catch (error) {
                console.error("Decryption failed:", error);
                return { ...msg, content: "[Encrypted message]" };
              }
            }

            return msg;
          })
        );

        setMessages(processedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    if (recipientId) {
      fetchRecipient();
      fetchMessages();
    }
  }, [recipientId, session?.user?.privateKey]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !recipient?.publicKey) return;

    try {
      setIsLoading(true);

      // Encrypt for recipient
      const encryptedForRecipient = await encryptMessage(
        newMessage,
        recipient.publicKey
      );

      // Encrypt for sender (using sender's own public key)
      const encryptedForSender = await encryptMessage(
        newMessage,
        session?.user?.publicKey
      );

      const messageData = {
        sender: session?.user?.id || "",
        recipient: recipientId,
        contentForRecipient: encryptedForRecipient,
        contentForSender: encryptedForSender,
        isEncrypted: true,
      };

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        const sentMessage = await response.json();

        setMessages([
          ...messages,
          {
            ...messageData,
            id: sentMessage._id,
            content: newMessage,
            timestamp: new Date(sentMessage.timestamp),
            isEncrypted: false,
          },
        ]);

        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!session?.user?.id) {
    return <div>Error: User session not available</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b border-gray-200 p-4 flex items-center space-x-3">
        <Avatar>
          <AvatarFallback>
            {recipient?.username?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{recipient?.username}</h3>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <p>Loading messages...</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === session?.user?.id
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                    message.sender === session?.user?.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <p>{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === session?.user?.id
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <Input
            className="flex-1"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || !recipient}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !recipient || !newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
