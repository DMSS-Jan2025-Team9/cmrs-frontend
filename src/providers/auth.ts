import type { AuthProvider } from "@refinedev/core";

import type { User } from "@/graphql/schema.types";

import { API_URL, dataProvider } from "./data";

import { jwtDecode } from "jwt-decode";

/**
 * For demo purposes and to make it easier to test the app, you can use the following credentials:
 */
export const authCredentials = {
  username: "", // Changed from email to username
  password: "",
};

interface CustomJwtPayload{
  sub: string;
  email: string;
  roles: string[];
}

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    try {
      // Using the JWT API with username and password
      const response = await fetch("http://localhost:8085/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.accessToken);

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (e) {
      const error = e as Error;

      return {
        success: false,
        error: {
          message: "message" in error ? error.message : "Login failed",
          name: "name" in error ? error.name : "Invalid username or password",
        },
      };
    }
  },
  logout: async () => {
    localStorage.removeItem("access_token");

    return {
      success: true,
      redirectTo: "/login",
    };
  },
  onError: async (error) => {
    if (error.statusCode === "UNAUTHENTICATED") {
      return {
        logout: true,
      };
    }

    return { error };
  },
  check: async () => {
    const accessToken = localStorage.getItem("access_token");
    
    if (!accessToken) {
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }

    try {
      // Just verify the token format or check expiration if needed
      const decodedToken = jwtDecode(accessToken);
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        return {
          authenticated: false,
          redirectTo: "/login",
        };
      }
      
      return {
        authenticated: true,
        redirectTo: "/",
      };
    } catch (error) {
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }
  },
  getIdentity: async () => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      return undefined;
    }

    try {
      const decodedToken = jwtDecode<CustomJwtPayload>(accessToken);
      
      return {
        name: decodedToken.sub, // Using 'sub' as name
        email: decodedToken.email,
        roles: decodedToken.roles,
        // We don't have these in the token, but the component expects them
        jobTitle: "", 
        phone: "",
        avatarUrl: "",
      };
    } catch (error) {
      return undefined;
    }
  },
};