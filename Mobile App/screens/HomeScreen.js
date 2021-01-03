//This is the screen that displays all of the reminders in a checklist.
/* eslint-disable react-native/no-inline-styles */
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from "react-native";
import styles from "../styles/AppStyles";
import { AppDataContext } from "../navigation/AppDataProvider";
import { AuthContext } from "../navigation/AuthProvider";
export default function HomeScreen({ navigation }) {
  const {
    appdata,
    displayConvert,
    saveAppData,
  } = useContext(AppDataContext);
  const { setSpinnerVisible, saveTimeOut } = useContext(AuthContext);
  const [completedIDs, setCompletedIDs] = useState([]);

  var effectChecker = true;

  useEffect(() => { //This makes sure that completed reminders are not shown when the app is initiatilized.
    if (
      appdata !== null &&
      appdata.reminders &&
      appdata.reminders.length > 0 &&
      saveTimeOut === false
    ) {
      var i;
      let finalArray = [];
      for (i = 0; i < appdata.reminders.length; i++) {
        if (appdata.reminders[i].status === "Complete") {
          finalArray.push(appdata.reminders[i].id);
        }
      }
      setCompletedIDs(finalArray);
    }
    if (appdata) {
      setSpinnerVisible(false);
    }
  }, [appdata]);

  useEffect(() => { //This seperates the completed reminders from the incomplete reminders.
    if (appdata !== null && appdata.reminders && appdata.reminders.length > 0) {
      var i;
      for (i = 0; i < appdata.reminders.length; i++) {
        if (completedIDs.includes(appdata.reminders[i].id)) {
          appdata.reminders[i].status = "Complete";
        } else {
          appdata.reminders[i].status = "Not Complete";
        }
      }
      saveAppData(appdata, "ITEMCLICKED");
    }
  }, [completedIDs]);

  const onSettingsButtonPress = () => {
    navigation.navigate("Settings"); //This navigates to the settings page.
  };

  function Item({ name, twelveOccurrences, id }) { //This initiailizes the list item.
    const backgroundColor = completedIDs.includes(id) ? "#1BA160" : "#A4A4A4";
    const textVal = completedIDs.includes(id) ? "✓" : "□";
    return (
      <View style={styles.reminderListItem}>
        <TouchableOpacity
          onPress={() => {
            if (completedIDs.includes(id)) {
              let IDarray = [];
              var i;
              for (i = 0; i < completedIDs.length; i++) {
                if (completedIDs[i] !== id) {
                  IDarray.push(completedIDs[i]);
                }
              }
              setCompletedIDs(IDarray);
            } else {
              setCompletedIDs((currentState) => [...currentState, id]);
            }
          }}
          style={[
            styles.reminderListItemButtonView,
            { backgroundColor: backgroundColor },
          ]}
        >
          <View>
            <Text style={styles.reminderListItemButtonText}>{textVal}</Text> 
          </View>
        </TouchableOpacity>
        <View style={styles.reminderListItemTextView}>
          <Text style={styles.listItemTitleText}>{name}</Text>
          <Text style={styles.listItemSubtext}>{twelveOccurrences}</Text>
        </View>
      </View>
    );
  }

  if (appdata && appdata.reminders && appdata.reminders.length > 0) { //This checks if there are any reminders.
    return (
      appdata && ( /* This initiailizes the list of reminders*/
        <View style={{ flex: 1 }}>
          <SafeAreaView style={styles.screen}>
            <FlatList
              data={appdata.reminders.slice(0, 10)} 
              renderItem={({ item }) => (
                <Item
                  name={item.name}
                  twelveOccurrences={displayConvert(item.occurrence)}
                  status={item.status}
                  id={item.id}
                />
              )}
            />
            <View style={styles.homeSpacer} />
          </SafeAreaView>

          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={onSettingsButtonPress}
              style={{
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.2)",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                minWidth: 120,
                height: 50,
                backgroundColor: "#300",
                borderRadius: 25,
                position: "absolute",
                bottom: 5,
                right: 20,
              }}
            >
              <Text style={{ fontSize: 20, color: "#fff" }}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    );
  } else {
    return ( /* This displays dialogue if there are no reminders. */
      <View style={{ flex: 1 }}>
        <SafeAreaView style={styles.noReminderScreen}>
          <Text style={styles.homeScreenText}>
            Go to Settings to set up reminders and contacts!
          </Text>
        </SafeAreaView>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            onPress={onSettingsButtonPress}
            style={{
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.2)",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              minWidth: 120,
              height: 50,
              backgroundColor: "#300",
              borderRadius: 25,
              position: "absolute",
              bottom: 20,
              right: 20,
            }}
          >
            <Text style={{ fontSize: 20, color: "#fff" }}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
