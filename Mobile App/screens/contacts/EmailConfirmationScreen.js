//This is the screen where the user inputs the confirmation code for a phone setup.
import React, { useState, useContext } from "react";
import { View, TextInput, TouchableOpacity, Text, Alert } from "react-native";
import styles from "../../styles/AppStyles";
import { AppDataContext } from "../../navigation/AppDataProvider";
import functions from "@react-native-firebase/functions";
import { AuthContext } from "../../navigation/AuthProvider";

export default function EmailConfirmationScreen({ navigation, route }) {
  const { appdata, saveAppData, encryptData } = useContext(AppDataContext);
  const {
    setSpinnerText,
    setSpinnerVisible,
    spinnerVisible,
    wemLogEvent,
  } = useContext(AuthContext);
  const { confContactID } = route.params;
  const { contactInfo } = route.params;
  const { contactType } = route.params;
  const [confContactIDState, setConfContactIDState] = useState(confContactID);
  const [emailConf, setEmailConf] = useState("");

  function pressChangeSubmit() { //This function is called when the user confirms a confirmation code input.
    setSpinnerText("Validating Code...");
    setSpinnerVisible(true);
    setTimeout(() => {
      setSpinnerVisible(false);
      if (spinnerVisible == true) {
        setSpinnerVisible(false);
        Alert.alert("Oops!", "Failed to Send Code. Please try again!!!");
      }
    }, 30000);
    functions()
      .httpsCallable("confCodeCheckFunc")({ //This function checks if the code entered is correct.
        id: confContactIDState,
        code: emailConf,
        userID: appdata.id,
      })
      .then(async (response) => {
        var s;
        setSpinnerVisible(false);
        if (response.data === 0) { //This if statement creates the contact if the code is correct.
          appdata.contactChange.emailData = await encryptData(
            appdata.contactChange.email
          );
          delete appdata.contactChange.email;
          if (appdata.contacts.length !== 0) {
            for (s = 0; s < appdata.contacts.length; s++) {
              if (appdata.contacts[s].id === appdata.contactChange.id) {
                appdata.contacts[s] = appdata.contactChange;
              }
            }
          } else {
            appdata.contacts.push(appdata.contactChange);
          }
          appdata.contactChange = {};
          saveAppData(appdata, "EMAIL_CONFIRMATION");
          navigation.navigate("Settings");
          wemLogEvent("Email_Contact");
          setSpinnerVisible(false);
        } else {
          Alert.alert("Please try again or resend the confirmation code");
        }
      });
  }

  async function pressChangeResend() { //This function resends a confirmation code.
    setSpinnerText("Sending confirmation Code...");
    await setSpinnerVisible(true);
    setTimeout(() => {
      setSpinnerVisible(false);
      if (spinnerVisible == true) {
        setSpinnerVisible(false);
        Alert.alert("Oops!", "Failed to Send Code. Please try again!!!");
      }
    }, 30000);
    functions()
      .httpsCallable("confCodeFunc")({ //This function recreates and resends a confirmation code.
        contactType: contactType,
        contactInfo: contactInfo,
        userID: appdata.id,
      })
      .then((response) => {
        setConfContactIDState(response.data);
        setSpinnerVisible(false);
      });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.confirmationInputContainer}>
        <TextInput
          placeholderTextColor="#ccc"
          style={styles.confirmationInput}
          placeholder="Please enter the confirmation code"
          value={emailConf}
          keyboardType="numeric"
          onChangeText={(value) => setEmailConf(value)}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={pressChangeSubmit} style={styles.button}>
          <Text style={styles.buttontext}>Submit Code</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={pressChangeResend} style={styles.button}>
          <Text style={styles.buttontext}>Resend Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
