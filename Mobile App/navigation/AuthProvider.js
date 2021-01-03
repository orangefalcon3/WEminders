//This is the main authentication provider for both iOS and Android.
import React, { createContext, useState, useEffect } from "react";
import { firebase } from "@react-native-firebase/auth";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-community/google-signin";
import Analytics from "@react-native-firebase/analytics";
import crashlytics from "@react-native-firebase/crashlytics";
import appleAuth, {
  AppleAuthRequestScope,
  AppleAuthRequestOperation,
} from "@invertase/react-native-apple-authentication";
import { Platform, Alert } from "react-native";
import { GOOGLEWEBCLIENTID } from "../components/config.js";

//These three functions are all log wrappers.
function wemLog(message) {
  console.log(message);
  crashlytics().log(message);
}
function wemError(message) {
  console.log(message);
  crashlytics().recordError(message);
  let error_msg = message ? message : "No error message";
  Analytics().logEvent("error_recorded", {
    error_message: error_msg.slice(0, 95),
  });
}
function wemLogEvent(eventName) {
  eventName = eventName.replace(/\s+/g, "").replace("-", "_").replace("/", "_");
  console.log(eventName);
  Analytics().logEvent(eventName);
}

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [googleUserInfo, setGoogleUserInfo] = useState(null);
  const [appleUserInfo, setAppleUserInfo] = useState(null);
  const [firebaseuid, setFirebaseuid] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userType, setUserType] = useState("");
  const [userName, setUserName] = useState("");
  const [spinnerVisible, setSpinnerVisible] = useState(false);
  const [spinnerText, setSpinnerText] = useState("Loading...");
  const [saveTimeOut, setSaveTimeOut] = useState(false);

  //This is used to login into an Android version using Google.
  useEffect(() => {
    async function configureLoginToGoogle() {
      GoogleSignin.configure({
        webClientId: GOOGLEWEBCLIENTID,
        offlineAccess: true,
        hostedDomain: "",
        loginHint: "",
        forceConsentPrompt: true,
        accountName: "",
      });

      try {
        setSpinnerText("Signing in ...");
        setSpinnerVisible(true);
        setTimeout(() => {
          setSpinnerVisible(false);
          if (spinnerVisible == true) {
            setSpinnerVisible(false);
            Alert.alert("Oops!", "Error Occurred. Please try again!!!");
          }
        }, 15000);
        setGoogleUserInfo(await GoogleSignin.signInSilently());
        wemLog("silent login is successful");
      } catch (error) {
        wemLog("Automatic silent login failed");
        setGoogleUserInfo(null);
        setSpinnerVisible(false);
      }
    }
    if (Platform.OS === "android") {
      configureLoginToGoogle();
    }
  }, []);

  //This function stores the Google user token into the Firebase database.
  useEffect(() => {
    async function updateGoogleFireBaseCredentials() {
      if (googleUserInfo) {
        try {
          wemLog(
            "Updated userinfo value is - " + JSON.stringify(googleUserInfo)
          );
          if (googleUserInfo.user.givenName && googleUserInfo.user.familyName) {
            const fullName =
              googleUserInfo.user.givenName +
              " " +
              googleUserInfo.user.familyName;
            await setUserName(fullName);
            wemLog("UserName is updated to - " + userName);
          } else {
            wemLog("Fullname is not available");
          }
          if (googleUserInfo.user.email) {
            await setUserEmail(googleUserInfo.user.email);
            wemLog("email is updated to - " + userEmail);
          } else {
            wemLog("email is not available");
          }

          if (googleUserInfo.idToken && googleUserInfo.serverAuthCode) {
            const credential = firebase.auth.GoogleAuthProvider.credential(
              googleUserInfo.idToken,
              googleUserInfo.serverAuthCode
            );
            const firebaseUserCredential = await firebase
              .auth()
              .signInWithCredential(credential);
            wemLog(
              "This is the return value of sign in with credentials from firebase - " +
                JSON.stringify(firebaseUserCredential.user.toJSON())
            );
            const userTemp = firebaseUserCredential.user.toJSON();
            wemLog("uid is - " + userTemp.uid);
            setFirebaseuid(userTemp.uid);
            Analytics().logLogin({
              method: "Google",
            });
            setUserType("google");
            Analytics().setUserId(userTemp.uid);
          } else {
            wemLog("Unexpected condition. idToken or accessToken is not valid");
          }
        } catch (error) {
          wemLog(error);
          if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            wemLog("updateFireBaseCredentials - user cancelled the login flow");
          } else if (error.code === statusCodes.IN_PROGRESS) {
            wemLog(
              "updateFireBaseCredentials - operation (f.e. sign in) is in progress already"
            );
          } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            wemLog(
              "updateFireBaseCredentials - play services not available or outdated"
            );
          } else {
            wemLog(
              "updateFireBaseCredentials - some other error happened - " + error
            );
          }
          wemError(error);
        }
      }
    }
    updateGoogleFireBaseCredentials();
  }, [googleUserInfo]);

  //This function stores the Apple user token into the Firebase database.
  useEffect(() => {
    async function updateAppleFireBaseCredentials() {
      if (appleUserInfo) {
        try {
          wemLog("appleuserinfo is - " + JSON.stringify(appleUserInfo));
          const { identityToken, nonce } = appleUserInfo;
          if (
            appleUserInfo.fullName &&
            appleUserInfo.fullName.givenName &&
            appleUserInfo.fullName.familyName
          ) {
            const fullName =
              appleUserInfo.fullName.givenName +
              " " +
              appleUserInfo.fullName.familyName;
            setUserName(fullName);
            wemLog("UserName is updated to - " + fullName);
          } else {
            wemLog("Fullname is not available");
          }
          if (appleUserInfo.email) {
            setUserEmail(appleUserInfo.email);
            wemLog("email is updated to - " + appleUserInfo.email);
          } else {
            wemLog("email is not available");
          }
          const appleCredential = await firebase.auth.AppleAuthProvider.credential(
            appleUserInfo.identityToken,
            appleUserInfo.nonce
          );
          wemLog("appleCredential - " + JSON.stringify(appleCredential));
          const firebaseUserCredential = await firebase
            .auth()
            .signInWithCredential(appleCredential);
          wemLog(
            "This is the return value of sign in with credentials from firebase - " +
              JSON.stringify(firebaseUserCredential.user.toJSON())
          );
          const userTemp = firebaseUserCredential.user.toJSON();
          wemLog("uid is - " + userTemp.uid);
          setFirebaseuid(userTemp.uid);
          Analytics().logLogin({
            method: "Apple",
          });
          setUserType("apple");
          Analytics().setUserId(userTemp.uid);
        } catch (error) {
          wemError(error);
        }
      }
    }
    updateAppleFireBaseCredentials();
  }, [appleUserInfo]);
  return (
    <AuthContext.Provider //This is the actual authentication provider.
      value={{
        firebaseuid,
        userEmail,
        userName,
        userType,
        wemLog,
        wemError,
        spinnerText,
        spinnerVisible,
        setSpinnerVisible,
        setSpinnerText,
        saveTimeOut,
        setSaveTimeOut,
        wemLogEvent,
        login: async (bGoogle) => {
          try {
            if (bGoogle) {
              try {
                Analytics().logEvent("Google_SignIn_Start");
                await GoogleSignin.hasPlayServices();
                try {
                  setGoogleUserInfo(await GoogleSignin.signInSilently());
                  wemLog("silent login is successful");
                  Analytics().logEvent("Google_SignIn_Success");
                } catch (error) {
                  wemLog("No saved credentials. Initiating Google sign in");
                  setGoogleUserInfo(await GoogleSignin.signIn());
                  setSpinnerText("Signing in ...");
                  setSpinnerVisible(true);
                  setTimeout(() => {
                    setSpinnerVisible(false);
                    if (spinnerVisible == true) {
                      setSpinnerVisible(false);
                      Alert.alert(
                        "Oops!",
                        "Error Occurred. Please try again!!!"
                      );
                    }
                  }, 15000);
                }
                wemLog(googleUserInfo);
                Analytics().logEvent("Google_SignIn_Success");
              } catch (error) {
                wemLog(error);
                if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                  wemLog("user cancelled the login flow");
                } else if (error.code === statusCodes.IN_PROGRESS) {
                  wemLog("operation (f.e. sign in) is in progress already");
                } else if (
                  error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
                ) {
                  wemLog("play services not available or outdated");
                } else {
                  wemLog("some other error happened" + error);
                }
                wemError("Google Signin Failure - " + error);
              }
            } else {
              wemLog("Apple Sign in is pressed");
              Analytics().logEvent("Apple_SignIn_Start");
              const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: AppleAuthRequestOperation.LOGIN,
                requestedScopes: [
                  AppleAuthRequestScope.EMAIL,
                  AppleAuthRequestScope.FULL_NAME,
                ],
              });
              wemLog(
                "appleAuthRequestResponse - " +
                  JSON.stringify(appleAuthRequestResponse)
              );

              if (!appleAuthRequestResponse.identityToken) {
                wemError("Apple Sign-In failed - no identify token returned");
                return;
              }
              setSpinnerText("Signing in ...");
              setSpinnerVisible(true);
              setTimeout(() => {
                setSpinnerVisible(false);
                if (spinnerVisible == true) {
                  setSpinnerVisible(false);
                  Alert.alert("Oops!", "Error Occurred. Please try again!!!");
                }
              }, 15000);
              setAppleUserInfo(appleAuthRequestResponse);
              Analytics().logEvent("Apple_SignIn_Success");
            }
          } catch (error) {
            wemError("Apple sign in failed - " + error);
            setSpinnerVisible(false);
          }
        },
        logout: async () => {
          try {
            if (Platform.OS === "android") {
              await GoogleSignin.revokeAccess();
              await GoogleSignin.signOut();
              setGoogleUserInfo(null);
            } else {
              setAppleUserInfo(null);
            }
            setFirebaseuid("");
          } catch (error) {
            console.error(error);
            wemError("logout failed - " + error);
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
