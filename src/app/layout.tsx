import type { Metadata } from "next";
import React from "react";
import { Inter, Montserrat, Share_Tech } from "next/font/google";
import "@/styles/global.css";
import { StarknetProvider } from "../context/StarknetProvider";
import { Header } from "@/components/LayoutComponents";
import TransactionProvider from "@/context/TransactionProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import Footer from "@/components/LayoutComponents/Footer";
import ProtocolProvider from "@/context/ProtocolProvider";
import { AppProps } from "next/app";
import QueryProvider from "@/components/Providers/queryProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--mainFont",
});

const shareTech = Share_Tech({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--mainFont",
});

export const metadata: Metadata = {
  title: "Pitchlake",
  description: "Gas Options Market",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${montserrat.variable}`} lang="en">
      <body className="flex flex-col min-h-[100vh] text-white bg-black">
        <QueryProvider>
          <StarknetProvider>
            <TransactionProvider>
              <ProtocolProvider>
                <Header />
                <div className="mt-[84px] flex flex-grow bg-bg-color">{children}</div>
                <div className="flex flex-col-reverse">
                  <Footer />
                </div>
              </ProtocolProvider>
            </TransactionProvider>
          </StarknetProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
