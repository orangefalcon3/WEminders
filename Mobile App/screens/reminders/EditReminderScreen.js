//This is the screen where a user can edit their reminders.
import React, { useContext, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  Platform,
  Alert,
  YellowBox,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import styles from "../../styles/AppStyles";
import { AppDataContext } from "../../navigation/AppDataProvider";
import moment from "moment";
import { OCCURRENCENAMECAPPLURAL } from "../../components/config";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AuthContext } from "../../navigation/AuthProvider";
YellowBox.ignoreWarnings([
  "Picker has been extracted from react-native core and will be removed in a future release. It can now be installed and imported from '@react-native-community/picker' instead of 'react-native'. See https://github.com/react-native-community/react-native-picker",
]);
export default function AddReminderScreen({ navigation, route }) {
  const {
    appdata,
    saveAppData,
    createReminderList,
    logScheduledReminders,
    forceUpdateAppData,
  } = useContext(AppDataContext);
  const {
    setSpinnerText,
    setSpinnerVisible,
    spinnerVisible,
    wemLogEvent,
  } = useContext(AuthContext);
  const { occurrences } = route.params;
  const [
    { name, endDate, remindertime, slacktime, frequency, id, firstDate },
    setField,
  ] = useState({
    name: appdata.medicationChange.name,
    endDate: appdata.medicationChange.endDate
      ? dateConvert(appdata.medicationChange.endDate)
      : endDate,
    remindertime: appdata.medicationChange.remindertime,
    slacktime: appdata.medicationChange.slacktime,
    frequency: appdata.medicationChange.frequency,
    id: appdata.medicationChange.id,
    firstDate: appdata.medicationChange.firstDate,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onEndDateChange = (event, selectedDate) => { //This function runs when the end date is changed.
    const currentDate = selectedDate || Date.now();

    setShowDatePicker(Platform.OS === "ios");
    setField((currentState) => ({
      ...currentState,
      endDate: currentDate,
    }));
  };

  function timeConvert(time) { //This function converts the unix value into a hh:mm format.
    var hours = time.getHours();
    var ampm;
    if (parseInt(hours, 10) > 12) {
      ampm = "PM";
      hours -= 12;
    } else if (parseInt(hours, 10) === 12) {
      ampm = "PM";
    } else if (parseInt(hours, 10) === 0) {
      ampm = "AM";
      hours += 12;
    } else {
      ampm = "AM";
    }
    var minutes = "0" + time.getMinutes();
    var formattedTime = hours + ":" + minutes.substr(-2) + " " + ampm;
    return formattedTime;
  }

  function dateConvert(dateString) { //This function converts a mm/dd/yyyy string into a unix value.
    let finalString = "";
    if (typeof dateString === "string") {
      finalString = dateString + " " + timeConvert(new Date());
      return new Date(
        moment.parseZone(finalString, "MM/DD/YYYY hh:mm A").unix() * 1000
      );
    }
    return new Date(dateString);
  }

  const showDatePickerFunction = () => { //This function runs when a date picker is requested.
    setShowDatePicker(!showDatePicker);
  };

  function pressChangeOccurrences() { //This function takes the user to the place to edit times.
    if (frequency === "daily") { //This if statement determines which type of time repetition the reminder has.
      navigation.navigate("Edit Occurrences - Daily");
    } else if (frequency === "weekly") {
      navigation.navigate("Edit Occurrences - Weekly");
    } else {
      Alert.alert("Please pick a frequency");
    }
  }

  function pressChangeDelete() { //This function is run when a user deletes a reminder.
    var i;
    let newArray = [];
    for (i = 0; i < appdata.medications.length; i++) {
      if (appdata.medications[i].id !== id) {
        newArray.push(appdata.medications[i]);
      }
    }
    appdata.medications = newArray;
    appdata.medicationChange = {};
    createReminderList();
    saveAppData(appdata, "DELETE_REMINDER");
    forceUpdateAppData();
    navigation.navigate("Reminders");
    wemLogEvent("Delete_Reminder");
    setSpinnerVisible(false);
  }

  function weeklyChecker(endOccurrenceArray, occurrenceArray) { //This function checks if at least one reminder is possible to create with the parameters given.
    let dayArray = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    let finalCheckVar = true;
    var i;
    for (i = 0; i < endOccurrenceArray.length; i++) {
      let checkVar = false;
      let occurrenceChecker = endOccurrenceArray[i];
      let dayVal = occurrenceArray[i].split(" ")[0];
      while (!checkVar) {
        let dayChecker = new Date(occurrenceChecker * 1000).getDay();
        if (dayArray[dayChecker] === dayVal) {
          checkVar = true;
        } else {
          occurrenceChecker -= 86400;
        }
      }
      if (occurrenceChecker < Date.now() / 1000) {
        finalCheckVar = false;
      }
    }
    return finalCheckVar;
  }

  function weeklyCheckerArray(endOccurrenceArray, occurrenceArray) { //This function checks if at least one reminder is possible to create with the parameters given.
    let dayArray = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    let finalCheckVar = true;
    let finalArray = [];
    var i;
    for (i = 0; i < endOccurrenceArray.length; i++) {
      let checkVar = false;
      let occurrenceChecker = endOccurrenceArray[i];
      let dayVal = occurrenceArray[i].split(" ")[0];
      while (!checkVar) {
        let dayChecker = new Date(occurrenceChecker * 1000).getDay();
        if (dayArray[dayChecker] === dayVal) {
          checkVar = true;
        } else {
          occurrenceChecker -= 86400;
        }
      }
      if (occurrenceChecker < Date.now() / 1000) {
        finalCheckVar = false;
      }
      finalArray.push(occurrenceChecker);
    }
    if (finalCheckVar) {
      return finalArray;
    } else {
      return endOccurrenceArray;
    }
  }

  async function pressChangeSubmit() { //This function runs when the user wants to confirm any changes.
    let addMed = {};
    let endOccurrenceArray = [];
    let occurrenceAdd = [];
    let checkEmpty = true;
    //These if statements ensure that all fields are filled out.
    if (name === "") {
      checkEmpty = false;
      Alert.alert("Please fill out the name field.");
    } else if (frequency === "Not Provided") {
      checkEmpty = false;
      Alert.alert("Please fill out the frequency field.");
    } else if (occurrences.length === 0 || occurrences.length === undefined) {
      checkEmpty = false;
      Alert.alert("Please set at least one time.");
    } else if (endDate === "") {
      checkEmpty = false;
      Alert.alert("Please set an end date.");
    } else if (remindertime === "Not Provided") {
      checkEmpty = false;
      Alert.alert("Please choose a time to be reminded.");
    } else if (slacktime === "Not Provided") {
      checkEmpty = false;
      Alert.alert("Please choose when to send notifications to the contacts.");
    }
    if (checkEmpty) { //This if statement checks if the reminder is ready to be saved.
      addMed.name = name; 
      addMed.endDate = moment.parseZone(endDate).format("MM/DD/YYYY");
      addMed.remindertime = remindertime;
      addMed.slacktime = slacktime;
      var j;
      var finalString;
      occurrenceAdd = occurrences;
      addMed.frequency = frequency;
      addMed.occurrences = occurrenceAdd;
      addMed.firstDate = Date.now();
      var i;
      var finalString;
      for (i = 0; i < addMed.occurrences.length; i++) {
        finalString =
          moment.parseZone(endDate).format("MM/DD/YYYY") +
          " " +
          addMed.occurrences[i];
        endOccurrenceArray.push(
          moment(finalString, "MM/DD/YYYY hh:mm a").unix()
        );
      }
      var weeklyCheckVar;
      if (frequency === "weekly") {
        weeklyCheckVar = weeklyChecker(endOccurrenceArray, addMed.occurrences);
        endOccurrenceArray = weeklyCheckerArray(
          endOccurrenceArray,
          addMed.occurrences
        );
      }
      if (weeklyCheckVar || frequency === "daily") {
        setSpinnerText("Saving ...");
        setSpinnerVisible(true);
        setTimeout(() => {
          setSpinnerVisible(false);
          if (spinnerVisible == true) {
            setSpinnerVisible(false);
            Alert.alert("Oops!", "Failed to Save. Please try again!!!");
          }
        }, 15000);
        addMed.endDateOccurrences = endOccurrenceArray;
        addMed.id = id;
        let checkVar = true;
        var j;
        let alertCheckVar = editChecker(id, addMed);
        if (alertCheckVar) { //This makes sure that the user doesn't accidentally save reminders.
          await Alert.alert(
            "Warning",
            "This will remove any reminders before this time. If you are OK with this, press 'Continue'.",
            [
              {
                text: "Go Back",
                onPress: () => (alertCheckVar = false),
                style: "cancel",
              },
              {
                text: "Continue",
                onPress: () => {
                  for (j = 0; j < appdata.medications.length; j++) {
                    if (appdata.medications[j].id === id) {
                      checkVar = false;
                      appdata.medications[j] = addMed;
                    }
                  }
                  if (checkVar) {
                    appdata.medications.push(addMed);
                  }
                  createReminderList();
                  addMed = {};
                  appdata.medicationChange = {};
                  saveAppData(appdata, "CREATE_OR_EDIT_REMINDER");
                  logScheduledReminders(logReminders);
                  navigation.navigate("Reminders");
                  wemLogEvent("Reminder_Added");
                },
              },
            ]
          );
        } else {
          for (j = 0; j < appdata.medications.length; j++) {
            if (appdata.medications[j].id === id) {
              checkVar = false;
              appdata.medications[j] = addMed;
            }
          }
          if (checkVar) {
            appdata.medications.push(addMed);
          }
          createReminderList();
          addMed = {};
          appdata.medicationChange = {};
          saveAppData(appdata, "CREATE_OR_EDIT_REMINDER");
          logScheduledReminders(logReminders);
          navigation.navigate("Reminders");
          wemLogEvent("Reminder_Added");
        }
        setSpinnerVisible(false);
      } else { //This runs if the reminder is impossible to create.
        Alert.alert(
          "Please change your time or end date. We can't make a reminder."
        );
      }
    }
  }

  function editChecker(medID) { //This is a sub function that makes sure the right reminder is edited.
    var i;
    for (i = 0; i < appdata.medications.length; i++) {
      if (appdata.medications[i].id === medID) {
        return true;
      }
    }
    return false;
  }

  function logReminders(array) { //This is a sub-function that helps log the reminders.
    var i;
    let dateArray = [];
    let idArray = [];
    let messageArray = [];
    for (i = 0; i < array.length; i++) {
      dateArray.push(array[i].date);
      idArray.push(array[i].id);
      messageArray.push(array[i].message);
    }
  }

  const frequencyItems = [
    {
      label: "Weekly",
      value: "weekly",
    },
    {
      label: "Daily",
      value: "daily",
    },
  ];
  const PlaceholderFrequency = {
    label: "Select the frequency",
    value: "Not Provided",
    color: "#9EA0A4",
  };

  const reminderItems = [
    { label: "On Time", value: "On Time" },
    { label: "5 minutes before", value: "5 min before" },
    { label: "10 minutes before", value: "10 min before" },
    { label: "15 minutes before", value: "15 min before" },
    { label: "20 minutes before", value: "20 min before" },
    { label: "30 minutes before", value: "30 min before" },
  ];
  const PlaceholderReminder = {
    label: "When to remind?",
    value: "Not Provided",
    color: "#9EA0A4",
  };

  const slacktimeItems = [
    { label: "10 minutes after", value: "10 min after" },
    { label: "15 minutes after", value: "15 min after" },
    { label: "20 minutes after", value: "20 min after" },
    { label: "30 minutes after", value: "30 min after" },
    { label: "1 hour after", value: "60 min after" },
  ];
  const PlaceholderSlackTime = {
    label: "When to Notify?",
    value: "Not Provided",
    color: "#9EA0A4",
  };
  return (
    <ScrollView style={styles.screen}>
      <View style={styles.inputContainer}>
        <TextInput //This is where the user inputs the task name.
          placeholderTextColor="#ccc"
          value={name}
          style={styles.input}
          placeholder="Name of Task"
          onChangeText={(value) =>
            setField((currentState) => ({
              ...currentState,
              name: value,
            }))
          }
        />
      </View>
      <View style={styles.pickerContainer}>
        <RNPickerSelect //This is where the user inputs the task frequency.
          placeholder={PlaceholderFrequency}
          value={frequency}
          items={frequencyItems}
          style={styles}
          onValueChange={(value) =>
            setField((currentState) => ({
              ...currentState,
              frequency: value,
            }))
          }
          useNativeAndroidPickerStyle={false}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity //This button leads to the time input screen.
          onPress={pressChangeOccurrences}
          style={styles.button}
        >
          <Text style={styles.buttontext}>Edit {OCCURRENCENAMECAPPLURAL}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.pickerContainer}>
        <TouchableOpacity onPress={showDatePickerFunction}>
          <Text //This allows the user to create an end date.
            testID="dateText"
            style={
              showDatePicker ? styles.clickableTextRed : styles.clickableText
            }
          >
            {endDate
              ? moment.parseZone(endDate).format("MM/DD/YYYY")
              : "End Date?"}
          </Text>
        </TouchableOpacity>
        {false && (
          <TouchableOpacity
            onPress={(e) => {
              setShowDatePicker(false);
            }}
          >
            <Text testID="dateText" style={styles.smallDoneButton}>
              Done
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {showDatePicker && (
        <DateTimePicker //This is the date picker that is called.
          value={endDate ? endDate : Date.now()}
          display={"default"}
          mode="date"
          onChange={onEndDateChange}
        />
      )}

      <View style={styles.pickerContainer}>
        <RNPickerSelect //This is where the user can choose when to be reminded.
          placeholder={PlaceholderReminder}
          value={remindertime}
          items={reminderItems}
          style={styles}
          onValueChange={(value) =>
            setField((currentState) => ({
              ...currentState,
              remindertime: value,
            }))
          }
          useNativeAndroidPickerStyle={false}
        />
      </View>
      <View style={styles.pickerContainer}>
        <RNPickerSelect //This is where the user can set a buffer between the task time and notification time.
          placeholder={PlaceholderSlackTime}
          value={slacktime}
          items={slacktimeItems}
          style={styles}
          onValueChange={(value) =>
            setField((currentState) => ({
              ...currentState,
              slacktime: value,
            }))
          }
          useNativeAndroidPickerStyle={false}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={pressChangeSubmit} style={styles.button}>
          <Text style={styles.buttontext}>Submit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity //This is how the user can delete a reminder.
          onPress={pressChangeDelete}
          style={styles.deleteButton}
        >
          <Text style={styles.buttontext}>Delete Reminder</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
