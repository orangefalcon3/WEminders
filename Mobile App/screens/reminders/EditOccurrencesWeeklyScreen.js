//This screen is where the user inputs weekly repetitions of their reminder.
import React, { useContext, useState } from "react";
import moment from "moment";
import styles from "../../styles/AppStyles";
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  Alert,
  SafeAreaView,
  FlatList,
} from "react-native";
import { AppDataContext } from "../../navigation/AppDataProvider";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function EditOccurrencesWeeklyScreen({ navigation }) {
  const {
    currentOccurrenceIndex,
    setCurrentOccurrenceIndex,
    showTimePicker,
    setShowTimePicker,
    appdata,
  } = useContext(AppDataContext);
  const [questionOccurrences, setQuestionOccurrences] = useState(
    occurrenceToOccurrenceObj(appdata.medicationChange.occurrences)
  );
  const [, forceUpdate] = useState();
  function uniqueId() {
    return (Date.now() + Math.floor(Math.random() * 10000)).toString();
  }
  function occurrenceToOccurrenceObj(occurrenceArray) { //This formats any existing reptitions into a format that this screen can use.
    let finalArray = [];
    var i;
    if (occurrenceArray === []) {
      return [];
    }
    for (i = 0; i < occurrenceArray.length; i++) {
      let addObj = {};
      let splitArray = [];
      splitArray = occurrenceArray[i].split(" ");
      addObj.occurrenceTime = new Date(
        moment(splitArray[1] + " " + splitArray[2], "hh:mm A").unix() * 1000
      );
      addObj.occurrenceTimeString = splitArray[1] + " " + splitArray[2];
      addObj.occurrenceDay = splitArray[0];
      addObj.id = uniqueId();
      finalArray.push(addObj);
    }
    return finalArray;
  }

  function timeFormatter(time) { //This formats a unix value into a format that can easily be visualized by the user.
    var ampm;
    let lastOccurrence = time;
    var time = new Date(lastOccurrence);
    var hours = time.getHours();
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
  const occurenceItems = [
    { label: "Sunday", value: "SUN" },
    { label: "Monday", value: "MON" },
    { label: "Tuesday", value: "TUE" },
    { label: "Wednesday", value: "WED" },
    { label: "Thursday", value: "THU" },
    { label: "Friday", value: "FRI" },
    { label: "Saturday", value: "SAT" },
  ];
  const PlaceholderOccurence = {
    label: "Day?",
    value: "Not Provided",
    color: "#a2aeae",
  };
  function round(date, duration, method) {
    return moment(Math[method](+date / +duration) * +duration);
  }
  const addTimeEntry = async (event) => { //This function is run when another input is added.
    let addObj = {};
    addObj.occurrenceTime = moment.parseZone(
      round(Date.now(), moment.duration(5, "minutes"), "round")
    );
    addObj.occurrenceDay = "Not Provided";
    addObj.occurrenceTimeString = moment
      .parseZone(round(Date.now(), moment.duration(5, "minutes"), "round"))
      .format("hh:mm A");
    addObj.id = uniqueId();
    questionOccurrences.push(addObj);
    setCurrentOccurrenceIndex(addObj.id);
    setShowTimePicker(true);
    forceUpdate((s) => !s);
  };
  const updateTimeOccurrence = async (selectedDate, id) => { //This function is run when the time input is updated.
    const occurTime = moment.parseZone(selectedDate).format("hh:mm A");
    let i;
    for (i = 0; i < questionOccurrences.length; i++) {
      if (questionOccurrences[i].id === id) {
        questionOccurrences[i].occurrenceTimeString = occurTime;
        questionOccurrences[i].occurrenceTime = selectedDate;
      }
    }
    if (Platform.OS !== "ios") {
      setShowTimePicker(false);
    }

    forceUpdate((s) => !s);
  };

  function RemoveOccurence(id) { //This function is run when an occurence is deleted.
    let i;
    for (i = 0; i < questionOccurrences.length; i++) {
      if (questionOccurrences[i].id === id) {
        questionOccurrences.splice(i, 1);
        break;
      }
    }
    setShowTimePicker(false);
    forceUpdate((s) => !s);
  }

  function OccurenceDayChanged(value, id) { //This function is run when the weekday input is updated.
    let i;
    for (i = 0; i < questionOccurrences.length; i++) {
      if (questionOccurrences[i].id === id) {
        questionOccurrences[i].occurrenceDay = value;
        break;
      }
    }
    forceUpdate((s) => !s);
  }

  function Item({ occurTime, occurrenceDay, id }) { //This function renders each time and day input in a list.
    const dateAndTime = "07/31/2020" + " " + occurTime;
    const dateTimePickerVal = new Date(
      moment(dateAndTime, "MM/DD/YYYY hh:mm A").unix() * 1000
    );

    function renderIfSelected(id) {
      if (currentOccurrenceIndex === id && showTimePicker) return true;
      else {
        return false;
      }
    }
    return (
      <View style={{ flex: 1, flexDirection: "column" }}>
        <View style={styles.rowBasedView}>
          <View style={styles.timeRow}>
            <View>
              <RNPickerSelect //This is a drop down menu to choose a weekday.
                placeholder={PlaceholderOccurence}
                value={occurrenceDay}
                items={occurenceItems}
                style={styles}
                onValueChange={(value) => OccurenceDayChanged(value,
                  id
                )}
                useNativeAndroidPickerStyle={false}
              />
            </View>
            <TouchableOpacity

              onPress={() => {
                setShowTimePicker(!showTimePicker);
                setCurrentOccurrenceIndex(id);
              }}
            >
              <Text
                style={
                  renderIfSelected(id)
                    ? styles.clickableTextRed
                    : styles.clickableText
                }
              >
                {occurTime}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.removeTime}
            onPress={() => {
              RemoveOccurence(id);
            }}
          >
            <Text style={styles.removeTimeButton}>X</Text>
          </TouchableOpacity>
        </View>
        <View>
          {renderIfSelected(id) && (
            <DateTimePicker //This renders a time picker if one is requested by the user.
              value={dateTimePickerVal}
              minuteInterval={5}
              mode={"time"}
              display={"default"}
              onChange={(event, selectedDate) => {
                updateTimeOccurrence(selectedDate, id);
              }}
            />
          )}
        </View>
      </View>
    );
  }
  function saveOccurrences() { //This function saves any changes when the user navigates away from the screen.
    var k;
    let checkVar = true;
    for (k = 0; k < questionOccurrences.length; k++) {
      if (questionOccurrences[k].occurrenceDay === "Not Provided") {
        checkVar = false;
      }
    }
    if (checkVar) {
      let addMed = {};
      let occurrenceArray = [];
      var i;
      var j;
      for (i = 0; i < questionOccurrences.length; i++) {
        questionOccurrences[i].occurrenceTime = timeFormatter(
          questionOccurrences[i].occurrenceTime
        );
      }
      for (j = 0; j < questionOccurrences.length; j++) {
        occurrenceArray.push(
          questionOccurrences[j].occurrenceDay + " " + questionOccurrences[j].occurrenceTime
        );
      }

      addMed.occurrences = occurrenceArray;
      appdata.medicationChange.occurrences = occurrenceArray;
      navigation.navigate("Edit Reminder", { occurrences: addMed.occurrences });
    } else {
      Alert.alert("Please choose a day for all times.");
    }
  }

  return (
    <View style={styles.columnScreen}>
      <SafeAreaView style={styles.screen}>
        <FlatList
          keyExtractor={(item, index) => item.id}
          data={questionOccurrences}
          renderItem={({ item }) => (
            <Item occurTime={item.occurrenceTimeString} occurrenceDay={item.occurrenceDay} id={item.id} />
          )}
        />
      </SafeAreaView>
      <TouchableOpacity onPress={saveOccurrences} style={styles.saveTimeButton}>
        <Text style={styles.buttontext}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.addTimeButton} onPress={addTimeEntry}>
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
