import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"PharmaStudy Hub",description:"Your personalised pharmacy learning companion."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}