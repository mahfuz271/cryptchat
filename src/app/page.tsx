"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { redirect } from "next/navigation";
import ChatBox from "@/components/chat/ChatBox";
import ContactsList from "@/components/chat/ContactsList";
import { useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading user session...</p>
      </div>
    );
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>
                {session.user.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{session.user.username}</h3>
              <p className="text-sm text-gray-500 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          <ContactsList
            currentUser={session.user.id}
            onSelectContact={setSelectedContact}
          />
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 cursor-pointer"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <ChatBox recipientId={selectedContact} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 max-w-md">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Select a contact to start chatting
              </h2>
              <p className="text-gray-500">
                Your messages are end-to-end encrypted for maximum privacy.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
