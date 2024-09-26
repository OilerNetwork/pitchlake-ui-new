"use client";
import React from "react";
import Link from "next/link";
import {
  ExternalLinkIcon,
  XIcon,
  MessagesSquareIcon,
  SendIcon,
} from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className=" w-full bg-black h-[82px] pt-8 justify-between items-start text-white py-6 px-8 border-t border-greyscale-800 opacity-90">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm mb-4 md:mb-0">
          Copyright © {new Date().getFullYear()} by Oiler
        </div>
        <div className="flex flex-wrap justify-center md:justify-end items-center gap-4">
          <Link
            href="/terms"
            className="text-sm hover:text-greyscale flex items-center"
          >
            Terms of Service <ExternalLinkIcon className="ml-1 h-4 w-4" />
          </Link>
          <Link
            href="/legal"
            className="text-sm hover:text-greyscale flex items-center"
          >
            Legal & Risk Disclosure{" "}
            <ExternalLinkIcon className="ml-1 h-4 w-4" />
          </Link>
          <Link
            href="/privacy"
            className="text-sm hover:text-greyscale flex items-center"
          >
            Privacy Policy <ExternalLinkIcon className="ml-1 h-4 w-4" />
          </Link>
          <Link
            href="/docs"
            className="text-sm hover:text-greyscale flex items-center"
          >
            Documentation <ExternalLinkIcon className="ml-1 h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <XIcon className="h-5 w-5 cursor-pointer hover:text-greyscale" />
            <MessagesSquareIcon className="h-5 w-5 cursor-pointer hover:text-greyscale" />
            <SendIcon className="h-5 w-5 cursor-pointer hover:text-greyscale" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
