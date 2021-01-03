//This is the place where all of the providers circle each other.
import React from "react";
import { AuthProvider } from "./AuthProvider";
import Routes from "./Routes";
import { AppDataProvider } from "./AppDataProvider";

export default function Providers() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <Routes />
      </AppDataProvider>
    </AuthProvider>
  );
}
