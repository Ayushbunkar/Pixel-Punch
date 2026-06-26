"use client";

import { Phone, Mail, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

interface ContactBarProps {
  className?: string;
  containerClassName?: string;
}

export function ContactBar({ className = "", containerClassName = "" }: ContactBarProps) {
  const handleEmailClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Copy the email to clipboard as a fallback/helper
    navigator.clipboard.writeText("contact@pixelpunch.org")
      .then(() => {
        toast.success("Email copied to clipboard! Opening mail client...", {
          id: "email-toast",
        });
      })
      .catch(() => {
        toast.success("Opening mail client...", {
          id: "email-toast",
        });
      });
      
    // Programmatically open the mail client
    window.location.href = "mailto:contact@pixelpunch.org";
  };

  return (
    <div className={`bg-[#0d6efd] text-white text-xs py-2 px-6 ${className}`}>
      <div className={`mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-6 ${containerClassName}`}>
        <a 
          href="tel:+16572001336" 
          className="flex items-center gap-1.5 hover:text-blue-200 transition-colors"
        >
          <Phone className="w-3.5 h-3.5" /> +1 (657) 200-1336
        </a>
        <a 
          href="mailto:contact@pixelpunch.org" 
          onClick={handleEmailClick}
          className="flex items-center gap-1.5 hover:text-blue-200 transition-colors cursor-pointer"
        >
          <Mail className="w-3.5 h-3.5" /> contact@pixelpunch.org
        </a>
        <a 
          href="https://wa.me/16572001336" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1.5 hover:text-blue-200 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
        </a>
      </div>
    </div>
  );
}
