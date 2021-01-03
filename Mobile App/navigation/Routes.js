//This contains the framework for the navigation.
import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./AuthStack";
import { AuthContext } from "./AuthProvider";
import AppNavigator from "./AppNavigator";
import Analytics from "@react-native-firebase/analytics";
import Spinner from "react-native-loading-spinner-overlay";
import styles from "../styles/AppStyles";

export default function Routes() {
  const routeNameRef = React.useRef();
  const navigationRef = React.useRef();
  const { firebaseuid, spinnerText, spinnerVisible } = useContext(AuthContext);

  return (
    <React.Fragment>
      <Spinner
        visible={spinnerVisible}
        textContent={spinnerText}
        textStyle={styles.spinnerTextStyle}
        cancelable={true}
      />
      <NavigationContainer
        ref={navigationRef}
        onReady={() =>
          (routeNameRef.current = navigationRef.current.getCurrentRoute().name)
        }
        onStateChange={() => {
          const previousRouteName = routeNameRef.current;
          let currentRouteName = navigationRef.current.getCurrentRoute().name;

          if (previousRouteName !== currentRouteName) {
            currentRouteName = currentRouteName
              .replace(/\s+/g, "")
              .replace("-", "_")
              .replace("/", "_");
            Analytics().setCurrentScreen(`Page_${currentRouteName}`);
          }

          // Save the current route name for later comparision
          routeNameRef.current = currentRouteName;
        }}
      >
        {firebaseuid ? <AppNavigator /> : <AuthStack />}
      </NavigationContainer>
    </React.Fragment>
  );
}
