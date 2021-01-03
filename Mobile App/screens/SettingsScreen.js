//This screen is the settings screen. It has all of the buttons to navigate through the app.
import React, { useContext } from "react";
import { View, TouchableOpacity, Text, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import styles from "../styles/AppStyles";
import { AuthContext } from "../navigation/AuthProvider";
import { AppDataContext } from "../navigation/AppDataProvider";
import functions from "@react-native-firebase/functions";

export default function SettingsScreen({ navigation, route }) {
  const { logout } = useContext(AuthContext);
  const { appdata, cancelAllReminders } = useContext(AppDataContext);

  async function pressChangeAdd() {
    navigation.navigate("Reminders"); //This navigates to the reminders page.
  }
  async function pressChangeContact() {
    navigation.navigate("Contacts"); //This navigates to the contacts page.
  }
  async function pressChangeTutorial() {
    navigation.navigate("Help"); //This navigates to the tutorial page.
  }

  return ( //This initializes the different buttons in the settings page.
    <ScrollView style={styles.screen}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={pressChangeAdd} style={styles.button}>
          <Text style={styles.buttontext}>Reminders</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={pressChangeContact} style={styles.button}>
          <Text style={styles.buttontext}>Contacts</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={pressChangeTutorial} style={styles.button}>
          <Text style={styles.buttontext}>Help</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.userData}>
        <Text style={styles.userdataText}>
          Name:
          {appdata && appdata.username ? appdata.username : "Not Available"}
        </Text>
        <TouchableOpacity /* This adds an extra layer of security to account information. */
          onPress={async () => {
            Alert.alert(
              "This is your email address: " +
                (await functions()
                  .httpsCallable("decryptFunc")({
                    originString: appdata.useremailData,
                  })
                  .then((response) => {
                    return response.data;
                  }))
            );
          }}
        >
          <Text
            style={[
              styles.userdataText,
              { fontWeight: "bold", textDecorationLine: "underline" },
            ]}
          >
            Show Email Address
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity /* This initializes the logout button for the user. */
          onPress={() => {
            cancelAllReminders();
            logout();
          }}
          style={styles.button}
        >
          <Text style={styles.buttontext}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
