//This screen allows a user to edit an existing contact.
import React, { useState, useContext } from "react";
import { View, TextInput, TouchableOpacity, Text, Alert } from "react-native";
import styles from "../../styles/AppStyles";
import { AppDataContext } from "../../navigation/AppDataProvider";
import functions from "@react-native-firebase/functions";
import { AuthContext } from "../../navigation/AuthProvider";

export default function EditContactsScreen({ navigation }) {
  const { appdata, saveAppData } = useContext(AppDataContext);
  const {
    setSpinnerText,
    setSpinnerVisible,
    spinnerVisible,
    wemLogEvent,
  } = useContext(AuthContext);
  const [
    {
      name,
      phone,
      email,
      relation,
      communication,
      id,
      emailCheck,
      phoneCheck,
      emailCheckVar,
      phoneCheckVar,
    },
    setField,
  ] = useState({
    name: appdata.contactChange.name,
    phone: appdata.contactChange.phone,
    email: appdata.contactChange.email,
    relation: appdata.contactChange.relation,
    communication: appdata.contactChange.communication,
    id: appdata.contactChange.id,
    emailCheck: appdata.contactChange.email,
    phoneCheck: appdata.contactChange.phone,
    emailCheckVar: emailCheckFunc(appdata.contactChange.email),
    phoneCheckVar: phoneCheckFunc(appdata.contactChange.phone),
  });

  function emailCheckFunc(emailVar) { //This checks if the contact is an email.
    if (!emailVar) {
      return false;
    } else {
      return true;
    }
  }

  function phoneCheckFunc(phoneVar) { //This checks if the contact is done through a phone.
    if (!phoneVar) {
      return false;
    } else {
      return true;
    }
  }

  async function pressChange() { //This function runs when a user makes a change to a contact.
    checkEmpty();
    let finalString = "+";
    if (phoneCheckVar) { //This if-statement checks if the contact is a phone or email.
      if (phone[0] !== "+") {
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
        setField((currentState) => ({
          ...currentState,
          phone: finalString,
        }));
      }
      if (phone !== phoneCheck) { //This if statement sends a confirmation code if the phone number has been changed.
        let confContactID = 0;
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
        functions()
          .httpsCallable("confCodeFunc")({
            contactType: appdata.contactChange.communication,
            contactInfo: finalString,
            userID: appdata.id,
          })
          .then(async (response) => {
            confContactID = response.data;
            navigation.navigate("Phone Confirmation", {
              confContactID: confContactID,
              contactInfo: phone,
              contactType: appdata.contactChange.communication,
            });
            setSpinnerVisible(false);
          });
      } else {
        let contact2Update;
        var i;
        for (i = 0; i < appdata.contacts.length; i++) {
          if (appdata.contacts[i].id === id) {
            contact2Update = appdata.contacts[i];
          }
          contact2Update.relation = relation;
          contact2Update.name = name;
          appdata.contacts[i] = contact2Update;
        }
        appdata.contactChange = {};
        saveAppData(appdata, "EDIT_CONTACT");
        navigation.navigate("Settings");
        wemLogEvent("Update_Contact");
        setSpinnerVisible(false);
      }
    } else if (emailCheckVar && email !== emailCheck) { //This statement is true if the email has been changed
      var confContactID = "";
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
      functions()
        .httpsCallable("confCodeFunc")({ //This function sends another confirmation code to the new email.
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
    } else {
      let contact2Update;
      var i;
      for (i = 0; i < appdata.contacts.length; i++) {
        if (appdata.contacts[i].id === id) {
          contact2Update = appdata.contacts[i];
        }
        contact2Update.relation = relation;
        contact2Update.name = name;
        appdata.contacts[i] = contact2Update;
      }
      contact2Update.relation = relation;
      contact2Update.name = name;
      appdata.contactChange = {};
      saveAppData(appdata, "EDIT_CONTACT");
      navigation.navigate("Settings");
      wemLogEvent("Update_Contact");
      setSpinnerVisible(false);
    }
  }

  function pressChangeDelete() { //This function runs if the user chooses to delete the contact.
    var i;
    let newArray = [];
    for (i = 0; i < appdata.contacts.length; i++) {
      if (appdata.contacts[i].id !== id) {
        newArray.push(appdata.contacts[i]);
      }
    }
    appdata.contacts = newArray;
    appdata.contactChange = {};
    saveAppData(appdata, "DELETE_CONTACT");
    navigation.navigate("Contacts");
    wemLogEvent("Delete_Contact");
    setSpinnerVisible(false);
  }

  function checkEmpty() { //This creates dialogue if the user does not fill any of the inputs.
    if (name === "") {
      setField((currentState) => ({
        ...currentState,
        name: "Not Provided",
      }));
    }
    if (phone === "") {
      setField((currentState) => ({
        ...currentState,
        phone: "Not Provided",
      }));
    }
    if (email === "") {
      setField((currentState) => ({
        ...currentState,
        email: "Not Provided",
      }));
    } 
  }

  return (
    <View style={styles.screen}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholderTextColor="#ccc"
          value={name}
          style={styles.input}
          placeholder="Name"
          onChangeText={(value) =>
            setField((currentState) => ({
              ...currentState,
              name: value,
            }))
          }
        />
      </View>
      {phoneCheckVar && (
        <View style={styles.inputContainer}>
          <TextInput
            placeholderTextColor="#ccc"
            value={phone}
            style={styles.input}
            placeholder="Phone Number"
            onChangeText={(value) =>
              setField((currentState) => ({
                ...currentState,
                phone: value,
              }))
            }
          />
        </View>
      )}
      {emailCheckVar && (
        <View style={styles.inputContainer}>
          <TextInput
            placeholderTextColor="#ccc"
            value={email}
            style={styles.input}
            placeholder="Email Address"
            onChangeText={(value) =>
              setField((currentState) => ({
                ...currentState,
                email: value,
              }))
            }
          />
        </View>
      )}
      <View style={styles.pickerContainer}>
        <TextInput
          placeholderTextColor="#ccc"
          value={relation}
          style={styles.input}
          placeholder="Relationship"
          onChangeText={(value) =>
            setField((currentState) => ({
              ...currentState,
              relation: value,
            }))
          }
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={pressChange} style={styles.button}>
          <Text style={styles.buttontext}>Submit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.contactsSpacer} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={pressChangeDelete}
          style={styles.deleteButton}
        >
          <Text style={styles.buttontext}>Delete Contact</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
