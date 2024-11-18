import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { AuthDispatcherUsingConvex } from "./Root";
import { Auth0Provider } from "@auth0/auth0-react";
import { ConvexProviderWithAuth0 } from "convex/react-auth0";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
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
