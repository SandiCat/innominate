import { StrictMode, useEffect, useState } from "react";
import {
  Authenticated,
  ConvexReactClient,
  Unauthenticated,
  useMutation,
} from "convex/react";
import { ClerkProvider, SignInButton, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { App as DesktopApp } from "./App";
import { App as MobileApp } from "./mobile/App";
import { BrowserView, MobileView } from "react-device-detect";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const title = import.meta.env.DEV ? "[DEV] Innominate" : "Innominate";

function WithUser() {
  const [userId, setUserId] = useState<Id<"users"> | undefined>();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    upsertUser().then(setUserId);
  }, [upsertUser]);

  if (userId === undefined) return <div>Loading user...</div>;

  return (
    <>
      <BrowserView>
        <DesktopApp userId={userId} />
      </BrowserView>
      <MobileView>
        <MobileApp userId={userId} />
      </MobileView>
    </>
  );
}

export function Root() {
  return (
    <StrictMode>
      <title>{title}</title>
      <ClerkProvider
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <main>
            <Unauthenticated>
              <SignInButton />
            </Unauthenticated>
            <Authenticated>
              <WithUser />
            </Authenticated>
          </main>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </StrictMode>
  );
}
