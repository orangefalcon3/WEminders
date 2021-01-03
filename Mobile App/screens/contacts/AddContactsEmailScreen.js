//This is the screen where the user enters the contact's email address.
import React, { useContext, useState } from "react";
import { View, TextInput, Text, TouchableOpacity, Alert } from "react-native";
import styles from "../../styles/AppStyles";
import { AppDataContext } from "../../navigation/AppDataProvider";
import functions from "@react-native-firebase/functions";
import { AuthContext } from "../../navigation/AuthProvider";

export default function AddContactsEmailScreen({ navigation, route }) {
  const { appdata } = useContext(AppDataContext);
  const { setSpinnerText, setSpinnerVisible, spinnerVisible } = useContext(
    AuthContext
  );
  const { id } = route.params;
  const [email, setEmail] = useState("");

  async function pressChange() { //This navigates the user to the confirmation code page.
    if (email === "") { //This checks if there is an email inputted.
      Alert.alert("Please provide an email address.");
    } else {
      var confContactID = 0;
      appdata.contactChange.email = email;
      setSpinnerText("Sending confirmation Code...");
      await setSpinnerVisible(true);
      setTimeout(() => {
        setSpinnerVisible(false);
        if (spinnerVisible == true) {
          setSpinnerVisible(false);
          Alert.alert("Oops!", "Failed to Send Code. Please try again!!!");
        }
      }, 30000);

      functions() //This generates a confirmation code and a message.
        .httpsCallable("confCodeFunc")({
          contactType: "Email",
          contactInfo: email,
          userID: appdata.id,
        })
        .then(async (response) => {
          confContactID = response.data;
          navigation.navigate("Email Confirmation", {
            confContactID: confContactID,
            contactInfo: email,
            contactType: appdata.contactChange.communication,
          });
          setSpinnerVisible(false);
        });
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.inputContainer}>
        <TextInput //This is the place to input the email address.
          placeholderTextColor="#ccc"
          value={email}
          style={styles.input}
          placeholder="Email Address"
          onChangeText={(value) => setEmail(value)}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={pressChange} style={styles.button}>
          <Text style={styles.buttontext}>Add Contact</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
