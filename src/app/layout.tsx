import type { Metadata } from "next";
import "./globals.css";
import { WorkoutSessionProvider } from "@/lib/WorkoutSessionContext";
import GlobalTimer from "@/components/workout/GlobalTimer";
import AICoachChat from "@/components/coach/AICoachChat";
import Navbar from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "FitScientific | 您的科學化健身專家",
  description: "全方位科學化健身追蹤，包含組間休息計時、營養宏量計算與 168 斷食紀錄。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        <WorkoutSessionProvider>
          <main>{children}</main>
          <Navbar />
          <GlobalTimer />
          <AICoachChat />
        </WorkoutSessionProvider>
      </body>
    </html>
  );
}
