//This screen displays the sign in button for Apple and Google users.
import React, { useContext } from "react";
import { View, Text, Platform } from "react-native";
import styles from "../styles/AppStyles";
import { GoogleSigninButton } from "@react-native-community/google-signin";
import { AuthContext } from "../navigation/AuthProvider";
import {
  AppleButton,
} from "@invertase/react-native-apple-authentication";
export default function SignUpScreen({ navigation }) {
  const { login } = useContext(AuthContext);

  return (
    <>
      <View style={styles.columnScreen}>
        <Text style={styles.normalText}>Please Sign in</Text>
        {Platform.OS === "ios" && ( //This initiailizes a sign in button specifically for the Apple user.
          <AppleButton
            buttonStyle={AppleButton.Style.WHITE}
            buttonType={AppleButton.Type.SIGN_IN}
            style={{ height: 60, width: 200, alignSelf: "center" }}
            onPress={() => login(false)}
          />
        )}
        {Platform.OS === "android" && ( //This initiailizes a sign in button specifically for the Google user.
          <GoogleSigninButton
            style={styles.googleButton}
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={() => login(true)}
          />
        )}
      </View>
    </>
  );
}
