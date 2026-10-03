import type { ReactNode } from "react";
import { PublicHeader } from "./PublicHeader";
import { Footer } from "./Footer";
export function PublicLayout({ children }: { children: ReactNode }) { return <><PublicHeader/><main>{children}</main><Footer/></>; }
