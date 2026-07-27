import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "OnTrack",
  description: "Workforce management platform",
};

const themeScript = `
  try {
    const savedTheme = localStorage.getItem("ontrack-theme");

    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const theme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : systemPrefersDark
          ? "dark"
          : "light";

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    document.documentElement.style.colorScheme = theme;
  } catch (error) {
    document.documentElement.setAttribute(
      "data-theme",
      "light"
    );

    document.documentElement.style.colorScheme = "light";
  }
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>

      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}