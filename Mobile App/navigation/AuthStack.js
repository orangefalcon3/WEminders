//This is the start of the app's navigation.
import * as React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SignUpScreen from "../screens/SignUpScreen";

const Stack = createStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="Sign Up/Sign in" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
