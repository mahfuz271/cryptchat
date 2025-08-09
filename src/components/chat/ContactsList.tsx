"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  _id: string;
  username: string;
  publicKey: string;
  email: string;
}

interface ContactsListProps {
  onSelectContact: (contactId: string) => void;
  currentUser: string;
}

export default function ContactsList({
  onSelectContact,
  currentUser,
}: ContactsListProps) {
  const [contacts, setContacts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch("/api/users");
        const data = await response.json();
        setContacts(data.filter((user: User) => user._id !== currentUser));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setLoading(false);
      }
    };

    fetchContacts();
  }, [currentUser]);

  if (loading) {
    return <div className="p-4">Loading contacts...</div>;
  }

  return (
    <div className="divide-y divide-gray-200 overflow-x-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Contacts</h2>
      </div>
      {contacts.map((contact) => (
        <div
          key={contact._id}
          className="p-4 hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
          onClick={() => onSelectContact(contact._id)}
        >
          <Avatar>
            <AvatarFallback>
              {contact.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-ellipsis">{contact?.username}</h3>
            <p className="text-sm text-gray-500 text-ellipsis">
              {contact.email}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
