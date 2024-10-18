import type { Metadata } from "next";
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

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400"],
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
      <body className="flex flex-col min-h-[100vh]">
        <StarknetProvider>
          <TransactionProvider>
            <ProtocolProvider>
            <Header />
            <div className="mt-24">
            {children}
            </div>
            <div className="flex flex-grow flex-col-reverse">
            <Footer />
            </div>
            </ProtocolProvider>
          </TransactionProvider>
        </StarknetProvider>
      </body>
    </html>
  );
}
