"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import ChatBox from "@/components/chat/ChatBox";
import ContactsList from "@/components/chat/ContactsList";
import { useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen">
      <div className="w-1/4 border-r border-gray-200">
        <ContactsList
          onSelectContact={setSelectedContact}
          currentUser={session?.user?.id}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <ChatBox recipientId={selectedContact} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-700">
                Select a contact to start chatting
              </h2>
              <p className="text-gray-500 mt-2">
                Your messages are end-to-end encrypted
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
