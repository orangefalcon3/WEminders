//This is the screen where the user adds the general information of their contact.
import React, { useState, useContext } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  YellowBox,
} from "react-native";
import styles from "../../styles/AppStyles";
import { AppDataContext } from "../../navigation/AppDataProvider";
import RNPickerSelect from "react-native-picker-select";
YellowBox.ignoreWarnings([
  "Picker has been extracted from react-native core and will be removed in a future release. It can now be installed and imported from '@react-native-community/picker' instead of 'react-native'. See https://github.com/react-native-community/react-native-picker",
]);
export default function AddContactsScreen({ navigation }) {
  const { appdata } = useContext(AppDataContext);
  const [{ name, relation, communication }, setField] = useState({
    name: "",
    relation: "",
    communication: "Not Provided",
  });

  function pressChange() { //This function directs the user to the correct subsequent page.
    if (communication === "Not Provided" || relation === " ") {
      Alert.alert("Please fill out all fields.");
    } else {
      checkEmpty();
      let addContact = {};
      addContact.name = name;
      addContact.relation = relation;
      addContact.communication = communication;
      addContact.id = new Date().getTime().toString();
      appdata.contactChange = addContact;
      if (communication === "Email") { //This if-else statement ensures that the user goes to the correct page.
        navigation.navigate("Add Contacts - Email", { id: addContact.id });
      } else {
        navigation.navigate("Add Contacts - Phone", {
          id: addContact.id,
          communication: communication,
        });
      }
    }
  }

  function checkEmpty() { //This is a sub-function that creates default dialogue for empty text boxes.
    if (name === "") {
      setField((currentState) => ({
        ...currentState,
        name: "Not Provided",
      }));
    }
  }
  const communicationItems = [
    { label: "SMS (Regular Phone Messages)", value: "SMS" },
    { label: "WhatsApp", value: "Whatsapp" },
    { label: "Email", value: "Email" },
  ];
  const PlaceholderCommunication = {
    label: "Communication Type?",
    value: "Not Provided",
    color: "#9EA0A4",
  };

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
      <View style={styles.inputContainer}>
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
      <View style={styles.pickerContainer}>
        <RNPickerSelect
          placeholder={PlaceholderCommunication}
          value={communication}
          items={communicationItems}
          style={styles}
          onValueChange={(value) =>
            setField((currentState) => ({
              ...currentState,
              communication: value,
            }))
          }
          useNativeAndroidPickerStyle={false}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={pressChange} style={styles.button}>
          <Text style={styles.buttontext}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
