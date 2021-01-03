//This is the screen that displays the tasks in a list.
import React, { useContext } from "react";
import {
  View,
  TouchableOpacity,
  SafeAreaView,
  Text,
  FlatList,
} from "react-native";
import styles from "../../styles/AppStyles";
import { AppDataContext } from "../../navigation/AppDataProvider";
import { OCCURRENCENAMECAPPLURAL } from "../../components/config";
import moment from "moment";

export default function RemindersScreen({ navigation }) {
  const { appdata } = useContext(AppDataContext);

  function addReminder() {
    //This function sends the user to a screen to create a new reminder.
    appdata.medicationChange = {
      name: "",
      endDate: moment.parseZone(Date(Date.now())).format("MM/DD/YYYY"),
      remindertime: "Not Provided",
      slacktime: "Not Provided",
      frequency: "Not Provided",
      id: new Date().getTime().toString(),
      occurrences: [],
      firstDate: Date.now(),
    };
    navigation.navigate("Edit Reminder", { occurrences: {} });
  }

  function pressChangeEdit(id) {
    //This function sends the user to a screen that allows the user to edit existing reminders.
    appdata.medicationChange = getMedicationByID(id);
    navigation.navigate("Edit Reminder", {
      id: id,
      occurrences: appdata.medicationChange.occurrences,
    });
  }

  function getMedicationByID(id) {
    //This is a sub-function that gets a task by its ID. It is referred to as a "medication" because this was intended to be a medical app.
    var i;
    for (i = 0; i < appdata.medications.length; i++) {
      if (appdata.medications[i].id === id) {
        return appdata.medications[i];
      }
    }
  }

  function occurrenceArrayToString(array) {
    //This formats the times of repetition for each task into an easy-to-read way.
    var i;
    var arrayString = "";
    for (i = 0; i < array.length; i++) {
      if (i === 0) {
        arrayString = arrayString.concat(array[i]);
      } else {
        arrayString = arrayString.concat(", ", array[i]);
      }
    }
    return arrayString;
  }

  function Item({
    //This function renders each reminder in a list.
    name,
    occurrences,
    endDate,
    slacktime,
    remindertime,
    id,
    func,
  }) {
    return (
      <TouchableOpacity style={styles.listItem} onPress={() => func(id)}>
        <Text style={styles.listItemTitleText}>{name}</Text>
        <Text style={styles.listItemSubtext}>
          {OCCURRENCENAMECAPPLURAL}: {occurrences}{" "}
        </Text>
        <Text style={styles.listItemSubtext}>End Date: {endDate}</Text>
        <Text style={styles.listItemSubtext}>
          Reminder Time: {remindertime}
        </Text>
        <Text style={styles.listItemSubtext}>
          Notification Time: {slacktime}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    appdata && (
      <View style={{ flex: 1 }}>
        <SafeAreaView style={styles.screen}>
          <FlatList //This creates the list of reminders.
            data={appdata.medications}
            renderItem={({ item }) => (
              <Item
                name={item.name}
                occurrences={occurrenceArrayToString(item.occurrences)}
                endDate={item.endDate}
                slacktime={item.slacktime}
                remindertime={item.remindertime}
                id={item.id}
                func={pressChangeEdit}
              />
            )}
          />
        </SafeAreaView>
        <TouchableOpacity //This creates a button that allows the user to add a reminder.
          style={{
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.2)",
            alignItems: "center",
            justifyContent: "center",
            width: 50,
            height: 50,
            backgroundColor: "#300",
            borderRadius: 25,
            position: "absolute",
            bottom: 20,
            right: 20,
          }}
          onPress={addReminder}
        >
          <Text style={{ fontSize: 30, color: "#fff" }}>+</Text>
        </TouchableOpacity>
      </View>
    )
  );
}
