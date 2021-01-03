//This is the provider to handle the app data.
import React, { createContext, useState, useEffect, useContext } from "react";
import firestore from "@react-native-firebase/firestore";
import { AuthContext } from "./AuthProvider";
import crashlytics from "@react-native-firebase/crashlytics";
import PushNotification from "react-native-push-notification";
import functions from "@react-native-firebase/functions";

export const AppDataContext = createContext({});

export const AppDataProvider = ({ children }) => {
  const [appdataInternal, setAppdataInternal] = useState(null);
  const [appdata, setAppdata] = useState(null);
  const [, forceUpdate] = useState();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saveTimeoutID, setSaveTimeoutID] = useState(-1);
  const [currentOccurrenceIndex, setCurrentOccurrenceIndex] = useState(0);
  const {
    firebaseuid,
    wemLog,
    wemError,
    userEmail,
    userName,
    userType,
    setSpinnerText,
    setSpinnerVisible,
    spinnerVisible,
    saveTimeOut,
    setSaveTimeOut,
  } = useContext(AuthContext);

  //This function schedules reminders to the app.
  function scheduleReminder(dateTimeOfReminder, title, message, schedulerID) {
    PushNotification.localNotificationSchedule({
      id: schedulerID,
      title: title,
      message: message,
      date: new Date(dateTimeOfReminder),
    });
  }

  //This function cancels any reminders in the queue to be sent to the app.
  function cancelAllReminders() {
    PushNotification.cancelAllLocalNotifications();
  }

  //This formats the date from a unix value to a YYYY/MM/DD hh:mm a format.
  function displayConvert(occurrence) {
    var time = new Date(occurrence * 1000);
    let ampm;
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
    var date = new Date(occurrence * 1000);
    var year = date.getFullYear();
    var month = "0" + parseInt(date.getMonth() + 1, 10).toString();
    var day = "0" + date.getDate();
    var formattedDate = year + "/" + month.substr(-2) + "/" + day.substr(-2);
    return formattedDate + " - " + formattedTime;
  }

  function logScheduledReminders(callback) {
    PushNotification.getScheduledLocalNotifications(callback);
  }

  //This is the function that updates the app data upon initialization.
  useEffect(() => {
    try {
      if (firebaseuid) {
        let userID = firebaseuid ? firebaseuid : "";
        firestore()
          .collection("users")
          .doc(userID)
          .get()
          .then((documentSnapshot) => {
            if (documentSnapshot.exists) {
              setAppdataInternal(documentSnapshot.data());
            } else {
              wemLog("Initializing appdata to template one");
              setAppdataInternal(
                JSON.parse(
                  '{"allTime": [], "username": "", "useremail": "", "usertype": "",  "contacts": [], "updateNeeded": false, "id": "", "medications": [], "archivedReminders":[], "reminders": []}'
                )
              );
              wemLog("Done with initialization");
            }
          });
      } else {
        wemLog("firebaseuid is not a valid one");
      }
    } catch (error) {
      wemError("firebaseuid useEffect failure - " + error);
    }
  }, [firebaseuid]);

  //This function saves the username if changed.
  useEffect(() => {
    if (userName && appdata && firebaseuid && appdata.username !== userName) {
      wemLog("Updating userName in AppData to - " + userName);
      appdata.username = userName;
      saveAppData(appdata, "USERNAME_UPDATE");
    }
  }, [userName, appdata, firebaseuid]);

  //This function encrypts and saves the user email if changed.
  useEffect(() => {
    async function emailSetter() {
      if (userEmail && appdata && firebaseuid) {
        if (appdata.useremailData) {
          wemLog("Updating useremailData not needed - " + userEmail);
        } else {
          wemLog("Updating userEmail in AppData to - " + userEmail);
          appdata.useremailData = await functions()
            .httpsCallable("encryptFunc")({
              originString: userEmail,
            })
            .then((response) => {
              return response.data;
            });
          saveAppData(appdata, "EMAIL_UPDATE");
        }
      }
    }
    emailSetter();
  }, [userEmail, appdata, firebaseuid]);

  //This function saves the OS type for the user.
  useEffect(() => {
    if (userType && appdata && firebaseuid) {
      wemLog("Updating userType in AppData to - " + userType);
      appdata.usertype = userType;
    }
  }, [userType, appdata, firebaseuid]);

  //This function updates the Firebase user ID if changed.
  useEffect(() => {
    if (appdataInternal && firebaseuid) {
      wemLog(
        "User info from document loaded in appdata - " +
          JSON.stringify(appdataInternal)
      );
      appdataInternal.id = firebaseuid;
      setAppdata(appdataInternal);
      wemLog("This is the appdata after setting the id");
      wemLog(appdataInternal);
      crashlytics().setUserId(firebaseuid);
    } else if (!appdataInternal) {
      wemLog("This is the spot of the error");
    } else {
      wemLog("appdata is not a valid one");
    }
  }, [appdataInternal, firebaseuid]);

  //This function runs if a reminder is completed.
  useEffect(() => {
    if (saveTimeoutID === 0 && appdata) {
      appdata.updateNeeded = true;
      handleReminderCompletion();
      firestore().collection("users").doc(firebaseuid).set(appdata);
      setAppdata(appdata);
      createReminderList();
      forceUpdate((s) => !s);
      setSaveTimeoutID(-1);
    }
  }, [saveTimeoutID, appdata, firebaseuid]);

  //This is a helper function that saves the user data whenever there is a change.
  async function saveAppData(appdataChange, saveEvent) {
    setSpinnerText("Saving...");
    if (appdata.archivedReminders.length > 50) {
      appdata.archivedReminders = appdata.archivedReminders.slice(0, 50);
    }
    var i;
    for (i = 0; i < appdata.contacts.length; i++) {
      if (
        appdata.contacts[i].phone !== null &&
        appdata.contacts[i].phone !== undefined
      ) {
        delete appdata.contacts[i].phone;
      } else if (
        appdata.contacts[i].email !== null &&
        appdata.contacts[i].email !== undefined
      ) {
        delete appdata.contacts[i].email;
      }
    }
    if (saveTimeoutID > 0) {
      clearTimeout(saveTimeoutID);
    }
    if (saveEvent === "ITEMCLICKED") {
      setSaveTimeoutID(
        setTimeout(async () => {
          setSpinnerVisible(false);
          await setSaveTimeoutID(0);
        }, 15000)
      );
    } else {
      setSaveTimeoutID(0);
    }
    setSpinnerVisible(false);
  }

  //This function decrypts the data by calling a Firebase function.
  async function decryptData(originString) {
    const decryptFunc = functions().httpsCallable("decryptFunc");
    try {
      const returnString = await decryptFunc({
        originString: originString,
      });
      return returnString;
    } catch (error) {
      console.error(error);
      return "";
    }
  }

  //This function encrypts the data by calling a Firebase function.
  async function encryptData(originString) {
    const returnString = await functions()
      .httpsCallable("encryptFunc")({
        originString: originString,
      })
      .then((response) => {
        return response.data;
      });
    return returnString;
  }

  //This calls the forceUpdate function.
  async function forceUpdateAppData() {
    forceUpdate((s) => !s);
  }

  //This is a sub-function that helps with handling reminder completion.
  function handleReminderCompletion() {
    var i;
    let reminderTemp = [];
    for (i = 0; i < appdata.reminders.length; i++) {
      if (appdata.reminders[i].status === "Complete") {
        appdata.archivedReminders.push(appdata.reminders[i]);
      } else {
        reminderTemp.push(appdata.reminders[i]);
      }
    }
    appdata.reminders = reminderTemp;
  }

  //This is a function that populates the reminder data for push notifications to the user.
  function createReminderList() {
    cancelAllReminders();
    const nowTime = parseInt(new Date().getTime() / 1000, 10);
    let finalArray = [];
    var i;
    var j;
    for (i = 0; i < appdata.medications.length; i++) {
      for (j = 0; j < appdata.medications[i].endDateOccurrences.length; j++) {
        var ampm;
        let lastOccurrence = appdata.medications[i].endDateOccurrences[j];
        var time = new Date(lastOccurrence * 1000);
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
        while (appdata.medications[i].firstDate / 1000 < lastOccurrence) {
          var date = new Date(lastOccurrence * 1000);
          var year = date.getFullYear();
          var month = "0" + parseInt(date.getMonth() + 1, 10).toString();
          var day = "0" + date.getDate();
          var formattedDate =
            year + "/" + month.substr(-2) + "/" + day.substr(-2);
          let reminderObj = {};
          let beforeOccurrence = 0;
          let afterOccurrence = 0;
          reminderObj.occurrenceTime = formattedTime;
          reminderObj.occurrenceDate = formattedDate;
          reminderObj.id = parseInt(
            Math.random() * 100000000 + 100000000,
            10
          ).toString();
          reminderObj.medicationID = appdata.medications[i].id;
          reminderObj.name = appdata.medications[i].name;
          reminderObj.formattedTime = appdata.medications[i].occurrences[j];
          reminderObj.occurrence = lastOccurrence;
          reminderObj.status = "Not Complete";
          if (appdata.medications[i].remindertime.split(" ")[0] !== "On") {
            beforeOccurrence =
              lastOccurrence -
              60 *
                parseInt(appdata.medications[i].remindertime.split(" ")[0], 10);
          }
          reminderObj.beforeOccurrence = beforeOccurrence;
          afterOccurrence =
            lastOccurrence +
            (60 * parseInt(appdata.medications[i].slacktime.split(" ")[0], 10) -
              300);
          reminderObj.afterOccurrence = afterOccurrence;
          let checkVar = true;
          var c;
          for (c = 0; c < appdata.archivedReminders.length; c++) {
            if (
              appdata.archivedReminders[c].medicationID ===
                reminderObj.medicationID &&
              appdata.archivedReminders[c].occurrence === reminderObj.occurrence
            ) {
              checkVar = false;
            }
          }
          var l;
          for (l = 0; l < finalArray.length; l++) {
            if (
              finalArray[l].medicationID === reminderObj.medicationID &&
              finalArray[l].occurrence === reminderObj.occurrence
            ) {
              checkVar = false;
            }
          }
          if (checkVar) {
            if (reminderObj.occurrence < nowTime) {
              let checkRemVar = true;
              if (checkRemVar) {
                finalArray.push(reminderObj);
              }
            } else {
              finalArray.push(reminderObj);
            }
            if (reminderObj.occurrence > nowTime) {
              var notificationTime = displayConvert(reminderObj.occurrence);
              if (beforeOccurrence !== 0) {
                scheduleReminder(
                  beforeOccurrence * 1000,
                  "WEminders",
                  "Reminder: [" +
                    appdata.medications[i].name +
                    "] at [" +
                    notificationTime +
                    "]",
                  parseInt(reminderObj.id + "0", 10)
                );
              } else {
                scheduleReminder(
                  lastOccurrence * 1000,
                  "WEminders",
                  "Reminder: [" +
                    appdata.medications[i].name +
                    "] at [" +
                    notificationTime +
                    "]",
                  parseInt(reminderObj.id + "1", 10)
                );
              }
            }
          }
          if (appdata.medications[i].frequency === "daily") {
            lastOccurrence -= 86400;
          } else {
            lastOccurrence -= 604800;
          }
        }
      }
    }
    finalArray = finalArray.sort((a, b) =>
      a.occurrence > b.occurrence ? 1 : -1
    );
    appdata.reminders = finalArray;
  }

  return (
    <AppDataContext.Provider //This is the actual app data provider.
      value={{
        appdata,
        currentOccurrenceIndex,
        showTimePicker,
        setCurrentOccurrenceIndex,
        createReminderList,
        setAppdata,
        saveAppData,
        scheduleReminder,
        logScheduledReminders,
        forceUpdateAppData,
        setShowTimePicker,
        handleReminderCompletion,
        displayConvert,
        cancelAllReminders,
        decryptData,
        encryptData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};
