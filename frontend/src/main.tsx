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
import { App as DesktopApp } from "./App";
import { App as MobileApp } from "./mobile/App";
import { BrowserView, MobileView } from "react-device-detect";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey="pk_test_YW11c2VkLWhpcHBvLTg2LmNsZXJrLmFjY291bnRzLmRldiQ">
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
