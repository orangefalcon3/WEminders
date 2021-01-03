//This is the screen where the user enters the contact's phone number.
import React, { useContext, useState } from "react";
import { View, TextInput, Text, TouchableOpacity, Alert } from "react-native";
import styles from "../../styles/AppStyles";
import { AppDataContext } from "../../navigation/AppDataProvider";
import functions from "@react-native-firebase/functions";
import { AuthContext } from "../../navigation/AuthProvider";

export default function AddContactsPhoneScreen({ navigation, route }) {
  const { appdata } = useContext(AppDataContext);
  const { setSpinnerText, setSpinnerVisible, spinnerVisible } = useContext(
    AuthContext
  );
  const { id, communication } = route.params;
  const [phone, setPhone] = useState("");

  async function pressChange() {
    //This function runs when the user attempts to continue.
    if (phone === "") {
      //This checks if there is a phone number
      Alert.alert("Please provide a phone number.");
    } else {
      let confContactID = 0;
      let finalString = "+";
      var i;
      if (phone[0] !== "+") {
        //This checks if a country code is inputted.
        Alert.alert(
          'Please use the country code and make sure that it starts with a "+".'
        );
      } else {
        for (i = 0; i < phone.length; i++) {
          if (i > 0) {
            if (parseInt(phone[i], 10) >= 0 && parseInt(phone[i], 10) <= 9) {
              finalString = finalString + phone[i];
            }
          }
        }
        setPhone(finalString);
        setSpinnerText("Sending confirmation Code...");
        await setSpinnerVisible(true);
        setTimeout(() => {
          setSpinnerVisible(false);
          if (spinnerVisible == true) {
            setSpinnerVisible(false);
            Alert.alert("Oops!", "Failed to Send Code. Please try again!!!");
          }
        }, 30000);
        appdata.contactChange.phone = phone;
        var confCodeFunc = functions().httpsCallable("confCodeFunc");
        confCodeFunc({
          //This function creates a confirmation code and sends it.
          contactType: appdata.contactChange.communication,
          contactInfo: finalString,
          userID: appdata.id,
        })
          .then(async function (response) {
            if (typeof response.data === "string") {
              Alert.alert(
                "Can't send code",
                response.data,
                [
                  {
                    text: "OK",
                    onPress: () => {
                      setSpinnerVisible(false);
                    },
                  },
                ],
                { cancelable: false }
              );
            } else {
              confContactID = response.data;
              navigation.navigate("Phone Confirmation", {
                confContactID: confContactID,
                contactInfo: phone,
                contactType: appdata.contactChange.communication,
              });
              setSpinnerVisible(false);
            }
          })
          .catch(function (error) {
            var code = error.code;
            var message = error.message;
            var details = error.details;
          });
      }
    }
  }

  return (
    <View style={styles.screen}>
      <View style={{ marginHorizontal: 40, marginTop: 10, marginBottom: 10 }}>
        <Text style={{ textAlign: "center", fontSize: 20, color: "#000" }}>
          Please enter your country code in front of your phone number!
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput //This renders the place to input the contact's phone number.
          placeholderTextColor="#ccc"
          value={phone}
          style={styles.input}
          placeholder="Phone Number"
          onChangeText={(value) => setPhone(value)}
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
