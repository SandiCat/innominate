import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Authenticated,
  AuthLoading,
  ConvexReactClient,
  Unauthenticated,
  useConvexAuth,
  useQuery,
} from "convex/react";
import { ConvexProviderWithAuth0 } from "convex/react-auth0";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

import "./index.css";
import { App as DesktopApp } from "./App";
import { App as MobileApp } from "./mobile/App";
import { BrowserView, MobileView } from "react-device-detect";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

export function Root() {
  return (
    <StrictMode>
      <Auth0Provider
        domain="dev-rlghwsax05c51ygr.us.auth0.com"
        clientId="Y9W8ioT41AC6iZIuSmaSZeDSIanYNJia"
        authorizationParams={{
          redirect_uri: window.location.origin,
        }}
        useRefreshTokens={true}
        cacheLocation="localstorage"
      >
        <ConvexProviderWithAuth0 client={convex}>
          <AuthDispatcherUsingConvex />
        </ConvexProviderWithAuth0>
      </Auth0Provider>
    </StrictMode>
  );
}

export function AuthDispatcherUsingConvex() {
  return (
    <>
      <Authenticated>
        <TestBackend />
      </Authenticated>
      <Unauthenticated>
        <LogInScreen />
      </Unauthenticated>
    </>
  );
}

export function AuthDispatcherWithTimeout() {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const [delayElapsed, setDelayElapsed] = useState(false);
  // const { isLoading, isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => {
        setDelayElapsed(true);
      }, 10000);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <div>Still loading</div>;
  }

  if (isAuthenticated) {
    if (delayElapsed) {
      return <TestBackend />;
    }
    return <div>{JSON.stringify(user)}</div>;
  }

  return <LogInScreen />;
}

function TestBackend() {
  const { user } = useAuth0();
  const note = useQuery(api.notes.get, {
    noteId: "k571yyc8ecmczj47qb5rg9fse174qx7k" as Id<"notes">,
  });
  return (
    <div>
      {JSON.stringify(note)}
      <br />
      {JSON.stringify(user)}
    </div>
  );
}

function LogInScreen() {
  const { loginWithPopup } = useAuth0();
  return <button onClick={() => loginWithPopup()}>Log in</button>;
}

function DeviceDispatcher() {
  return (
    <>
      <BrowserView>
        <DesktopApp />
      </BrowserView>
      <MobileView>
        <MobileApp />
      </MobileView>
    </>
  );
}
