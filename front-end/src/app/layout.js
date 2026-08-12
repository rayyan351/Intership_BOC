import "./globals.css";
import ReduxProvider from "@/redux/Providers";
import { AppProviders } from "@/components/providers/AppProviders";
import { SITE_NAME } from "@/lib/site";
import { App as AntApp } from 'antd';

export const metadata = {
  title: {
    default: `${SITE_NAME} | Premium Burgers in Karachi & Lahore`,
    template: `%s | ${SITE_NAME}`,
  },
  description: "Order Burger O'Clock burgers, combo meals, sharing boxes, fries and beverages online.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Add suppressHydrationWarning here */}
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