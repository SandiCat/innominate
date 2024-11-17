import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  Authenticated,
  AuthLoading,
  ConvexReactClient,
  Unauthenticated,
} from "convex/react";
import { ConvexProviderWithAuth0 } from "convex/react-auth0";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

import "./index.css";
import { App as DesktopApp } from "./App";
import { App as MobileApp } from "./mobile/App";
import { BrowserView, MobileView } from "react-device-detect";

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
          <Authenticated>
            <DeviceDispatcher />
          </Authenticated>
          <Unauthenticated>
            <LogInScreen />
          </Unauthenticated>
          <AuthLoading>Still loading</AuthLoading>
        </ConvexProviderWithAuth0>
      </Auth0Provider>
    </StrictMode>
  );
}

function LogInScreen() {
  const { loginWithRedirect } = useAuth0();
  return <button onClick={() => loginWithRedirect()}>Log in</button>;
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
