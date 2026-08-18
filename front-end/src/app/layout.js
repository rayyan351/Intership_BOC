// src/app/layout.js
import "./globals.css";
import ReduxProvider from "@/redux/Providers";
import { AppProviders } from "@/components/providers/AppProviders";
import { App as AntApp } from 'antd';
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Setting";
import Setting from "@/models/Setting";

export const revalidate = 3600;

async function getGlobalSettings() {
  try {
    await dbConnect();
    const settings = await Setting.findOne().lean();
    if (!settings) return null;
    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to load settings in root layout:", error);
    return null;
  }
}

export async function generateMetadata() {
  const settings = await getGlobalSettings();

  const title = settings?.siteTitle || settings?.storeName || "Burger O'Clock";
  const favicon = settings?.favicon
    ? settings.favicon.startsWith('http')
      ? settings.favicon
      : `http://localhost:5000${settings.favicon.startsWith('/') ? '' : '/'}${settings.favicon}`
    : "/favicon.ico";

  return {
    // 💡 Setting title directly without a template removes the unwanted " | Burger O'Clock"
    title: {
      default: title,
      template: `%s`, 
    },
    description: "Order burgers, combo meals, sharing boxes, fries and beverages online.",
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ReduxProvider>
          <AppProviders>
            <AntApp>
              {children}
            </AntApp>
          </AppProviders>
        </ReduxProvider>
      </body>
    </html>
  );
}