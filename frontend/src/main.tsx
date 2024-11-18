import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  Authenticated,
  ConvexReactClient,
  Unauthenticated,
} from "convex/react";
import { ClerkProvider, SignInButton, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import "./index.css";
import { AppWithUser as DesktopApp } from "./App";
import { App as MobileApp } from "./mobile/App";
import { BrowserView, MobileView } from "react-device-detect";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const title = import.meta.env.DEV ? "[DEV] Innominate" : "Innominate";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <title>{title}</title>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <main>
          <Unauthenticated>
            <SignInButton />
          </Unauthenticated>
          <Authenticated>
            <BrowserView>
              <DesktopApp />
            </BrowserView>
            <MobileView>
              <MobileApp />
            </MobileView>
          </Authenticated>
        </main>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>
);
