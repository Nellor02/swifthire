import "./globals.css";
import ApiFetchRedirect from "../components/ApiFetchRedirect";

export const metadata = {
  title: "SwaziJobs",
  description: "Job platform for seekers and employers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="bg-slate-900 text-slate-100">
        <ApiFetchRedirect />
        {children}
      </body>
    </html>
  );
}