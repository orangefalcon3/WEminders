//This is the screen in which users input the times daily when their reminder should repeat.
import React, { useState, useContext } from "react";
import moment from "moment";
import styles from "../../styles/AppStyles";
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  SafeAreaView,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AppDataContext } from "../../navigation/AppDataProvider";

export default function AddOccurrencesDailyScreen({ navigation }) {
  const [currentOccurrenceIndex, setCurrentOccurrenceIndex] = useState(-1);
  const { showTimePicker, setShowTimePicker, appdata } = useContext(
    AppDataContext
  );
  const [questionOccurrences] = useState(
    timeConvert(
      appdata.medicationChange.endDate,
      appdata.medicationChange.occurrences
    )
  );
  const [, forceUpdate] = useState();
  function uniqueId() {
    return (Date.now() + Math.floor(Math.random() * 10000)).toString();
  }
  function timeConvert(endDateVal, timeVal) { //This converts the time value from a HH:MM string to a unix value.
    let finalArray = [];
    var i;
    for (i = 0; i < timeVal.length; i++) {
      let finalString = "";
      let addObj = {};
      finalString = endDateVal + " " + timeVal[i];
      addObj.occurrenceTime = new Date(
        moment(finalString, "MM/DD/YYYY hh:mm A").unix() * 1000
      );
      addObj.occurrenceTimeString = timeVal[i].toString();
      addObj.id = uniqueId();
      finalArray.push(addObj);
    }
    return finalArray;
  }

  function round(date, duration, method) { 
    return moment(Math[method](+date / +duration) * +duration);
  }
  const addTimeEntry = async (event) => { //This function runs whenever a user confirms an input for a time.
    let addObj = {};
    addObj.occurrenceTime = moment.parseZone(
      round(Date.now(), moment.duration(5, "minutes"), "round")
    );
    addObj.occurrenceTimeString = moment
      .parseZone(round(Date.now(), moment.duration(5, "minutes"), "round"))
      .format("hh:mm A");
    addObj.id = uniqueId();
    questionOccurrences.push(addObj);
    setCurrentOccurrenceIndex(addObj.id);
    setShowTimePicker(true);
    forceUpdate((s) => !s);
  };
  const updateTimeOccurrence = async (selectedDate, id) => { //This function runs whenever a user changes a time input.
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

  function RemoveOccurence(id) { //This function is run when the delete button is pressed.
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

  function Item({ occurTime, id }) { //This function renders a new time input
    const dateAndTime = "07/31/2020" + " " + occurTime;
    const dateTimePickerVal = new Date(
      moment(dateAndTime, "MM/DD/YYYY hh:mm A").unix() * 1000
    );

    function renderIfSelected(id) { //This function displays a time picker if the button is pressed.
      if (currentOccurrenceIndex === id && showTimePicker) return true;
      else {
        return false;
      }
    }

    return (
      <View style={{ flex: 1, flexDirection: "column" }}>
        <View style={styles.rowBasedView}>
          <TouchableOpacity
            style={styles.timeRow}
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
            <DateTimePicker
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
  function saveOccurrences() { //This function runs when a user leaves the page, and it saves the time inputs.
    let addMed = {};
    let occurrenceAdd = [];
    var i;
    for (i = 0; i < questionOccurrences.length; i++) {
      occurrenceAdd.push(questionOccurrences[i].occurrenceTimeString);
    }
    addMed.occurrences = occurrenceAdd;
    appdata.medicationChange.occurrences = occurrenceAdd;
    navigation.navigate("Edit Reminder", { occurrences: addMed.occurrences });
  }
  return (
    <View style={styles.columnScreen}>
      <SafeAreaView style={styles.screen}>
        <FlatList //This renders a list that increases in size as more time inputs are required.
          keyExtractor={(item, index) => item.id}
          data={questionOccurrences}
          renderItem={({ item }) => (
            <Item occurTime={item.occurrenceTimeString} id={item.id} />
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
