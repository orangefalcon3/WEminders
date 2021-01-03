//This is a function used throughout the app.
import React, { useState } from "react";
export function useForceUpdate() {
  const [, forceUpdate] = React.useState();

  return React.useCallback(() => {
    forceUpdate((s) => !s);
  }, []);
}
