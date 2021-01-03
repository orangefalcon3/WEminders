// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require("firebase-functions");

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require("firebase-admin");
admin.initializeApp();

const Cryptr = require("cryptr");
const wemKey = functions.config().WEminders.EncryptionKey;

// SUB FUNCTIONS

//This function checks if a certain document exists. It is seen in many of the other functions.
async function docExistChecker(timeVal) {
  const docRef = admin.firestore().collection("schedulerData").doc(timeVal);
  const doc = await docRef.get();
  return Promise.resolve(doc.exists);
}

//This function sends an SMS message through Twilio SendGrid.
function sendSMSUsingSG(contactData, contentData) {
  //SendGrid Config
  const accountSid = functions.config().WEminders.accountSid;
  const authToken = functions.config().WEminders.authToken;
  const client = require("twilio")(accountSid, authToken);

  //Creates and sends message
  client.messages
    .create({
      body: contentData.Body,
      from: "+17144751810",
      to: contactData.contactInfo,
    })
    .then((message) => console.log(message.sid))
    .done();
}

//This function sends a WhatsApp message through Twilio SendGrid.
function sendWhatsAppUsingSG(contactData, contentData) {
  //SendGrid Config
  const accountSid = functions.config().WEminders.accountSid;
  const authToken = functions.config().WEminders.authToken;
  const client = require("twilio")(accountSid, authToken);

  //Creates and sends message
  client.messages
    .create({
      body: contentData.Body,
      from: functions.config().WEminders.whatsappFrom,
      to: "whatsapp:" + contactData.contactInfo,
    })
    .then((message) => console.log(message.sid))
    .done();
}

//This function sends an email through Twilio SendGrid.
function sendEmailUsingSG(contactData, emailData) {
  try {
    //Sendgrid Config
    const sgMail = require("@sendgrid/mail");
    const API_KEY = functions.config().sendgrid.key;
    const TEMPLATE_ID = functions.config().sendgrid.template;
    sgMail.setApiKey(API_KEY);
    //Creates and sends message
    const msg = {
      to: contactData.contactInfo,
      from: functions.config().WEminders.emailFrom,
      templateId: TEMPLATE_ID,
      dynamic_template_data: emailData,
    };
    return sgMail.send(msg);
  } catch (error) {
    return "failed";
  }
}

//This function is used to decrypt encrypted information within the other functions.
async function internalDecryptFunc(originString) {
  const cryptr = new Cryptr(wemKey);
  const returnString = cryptr.decrypt(originString);
  return returnString;
}

// ACTUAL CLOUD FUNCTIONS

//This creates the list of all individual reminders and prepares it for the notification job.
exports.setReminderListCloud = functions.firestore
  .document("users/{userId}")
  .onWrite(async (change) => {
    //This shows the user data before and after a change in reminders.
    const before = change.before.data();
    const after = change.after.data();
    let docID = after.id;
    if (after.updateNeeded) {
      //This ensures that no unneccesary updates are made
      var oldMedArray = [];
      var newMedArray = [];
      var u;
      var v;
      for (u = 0; u < before.medications.length; u++) {
        oldMedArray.push(before.medications[u].id);
      }
      for (v = 0; v < after.medications.length; v++) {
        newMedArray.push(after.medications[v].id);
      }
      let oldAllTimeArray = before.allTime;
      let finalArray = [];
      var r;
      //This isolates any completed reminders and pushes them into the reminder list.
      for (r = 0; r < after.reminders.length; r++) {
        if (after.reminders[r].status === "Complete") {
          finalArray.push(after.reminders[r]);
        }
      }
      let allTimeArray = [];
      var i;
      var j;
      //This creates all individual reminders from the list of tasks (They are called medications because this was originally intended to be a medical app).
      for (i = 0; i < after.medications.length; i++) {
        for (j = 0; j < after.medications[i].endDateOccurrences.length; j++) {
          //This creates formatted time for the scheduled job and the user.
          let lastOccurrence = after.medications[i].endDateOccurrences[j];
          let afterOccurrenceScheduler =
            lastOccurrence +
            60 * parseInt(after.medications[i].slacktime.split(" ")[0], 10);
          var time = new Date(lastOccurrence * 1000);
          var hours = time.getHours();
          var minutes = "0" + time.getMinutes();
          var formattedTime = hours + ":" + minutes.substr(-2);
          var schedulerTime = new Date(afterOccurrenceScheduler * 1000);
          var schedulerHours = schedulerTime.getHours();
          var schedulerMinutes = "0" + schedulerTime.getMinutes();
          var schedulerFormattedTime =
            schedulerHours + ":" + schedulerMinutes.substr(-2);
          //This create repeating occurrences of any reminders that are created to repeat.
          while (after.medications[i].firstDate / 1000 < lastOccurrence) {
            var date = new Date(lastOccurrence * 1000);
            var year = date.getFullYear();
            var month = "0" + parseInt(date.getMonth() + 1, 10).toString();
            var day = "0" + date.getDate();
            var formattedDate =
              year + "/" + month.substr(-2) + "/" + day.substr(-2);
            let reminderObj = {};
            let beforeOccurrence = 0;
            //This assigns all the attributes to each reminder object.
            reminderObj.occurrenceTime = formattedTime;
            reminderObj.occurrenceDate = formattedDate;
            reminderObj.schedulerTime = schedulerFormattedTime;
            reminderObj.id = parseInt(
              Math.random() * 100000000 + 100000000,
              10
            ).toString();
            reminderObj.medicationID = after.medications[i].id;
            reminderObj.name = after.medications[i].name;
            reminderObj.occurrence = lastOccurrence;
            reminderObj.status = "Not Complete";
            //This creates the attribute that determines when the user is reminded to do their task.
            if (after.medications[i].remindertime.split(" ")[0] !== "No") {
              beforeOccurrence =
                lastOccurrence -
                60 *
                  parseInt(after.medications[i].remindertime.split(" ")[0], 10);
            }
            reminderObj.beforeOccurrence = beforeOccurrence;
            //This creates the attribute that determines when the contact is notified.
            let afterOccurrence =
              lastOccurrence +
              (60 * parseInt(after.medications[i].slacktime.split(" ")[0], 10) -
                300);
            reminderObj.afterOccurrence = afterOccurrence;
            //This ensures that no reminder occurrence is documented multiple times.
            let checkVar = true;
            var c;
            for (c = 0; c < after.archivedReminders.length; c++) {
              if (
                after.archivedReminders[c].medicationID ===
                  reminderObj.medicationID &&
                after.archivedReminders[c].occurrence === reminderObj.occurrence
              ) {
                checkVar = false;
              }
            }
            var s;
            for (s = 0; s < finalArray.length; s++) {
              if (
                finalArray[s].medicationID === reminderObj.medicationID &&
                finalArray[s].occurrence === reminderObj.occurrence
              ) {
                checkVar = false;
              }
            }
            //This is where the reminder occurrence is pushed into the array of reminders.
            if (checkVar) {
              finalArray.push(reminderObj);
            }
            //This determines whether the reminder repeats daily or weekly.
            if (after.medications[i].frequency === "daily") {
              lastOccurrence -= 86400;
            } else {
              lastOccurrence -= 604800;
            }
          }
          //This creates an array that shows all the times that the user's incomplete reminder should be notified to a contact.
          if (schedulerFormattedTime.length === 4) {
            allTimeArray.push("0" + schedulerFormattedTime);
          } else {
            allTimeArray.push(schedulerFormattedTime);
          }
        }
      }
      //This sorts both of the arrays.
      finalArray = finalArray.sort((a, b) =>
        a.occurrence > b.occurrence ? 1 : -1
      );
      allTimeArray.sort();
      var o;
      for (o = 0; o < allTimeArray.length; o++) {
        if (allTimeArray[o].length === 4) {
          allTimeArray[o] = "0" + allTimeArray[o];
        }
      }
      var n;
      var p;
      var q;
      //This updates the section of the database that the notification job uses.
      for (n = 0; n < oldAllTimeArray.length; n++) {
        if (
          !(
            allTimeArray.includes(oldAllTimeArray[n]) ||
            allTimeArray.includes(oldAllTimeArray[n].substr(1, 4))
          )
        ) {
          let delDoc = {};
          let finalDelDocArray = [];
          await admin
            .firestore()
            .collection("schedulerData")
            .doc(oldAllTimeArray[n])
            .get()
            .then((documentSnapshot) => {
              delDoc = documentSnapshot.data();
            });
          if (delDoc !== undefined) {
            //This ensures that deletion only occurs if there is something that needs to be deleted.
            for (p = 0; p < delDoc.documents.length; p++) {
              if (delDoc.documents[p].id !== docID) {
                finalDelDocArray.push(delDoc.documents[p]);
              } else {
                let checkID = false;
                for (q = 0; q < after.medications.length; q++) {
                  if (after.medications[q].id === delDoc.documents[p].medID) {
                    checkID = true;
                  }
                }
                if (checkID) {
                  finalDelDocArray.push(delDoc.documents[p]);
                }
              }
            }
            //This updates the database in the case that nothing needs to be deleted.
            await admin
              .firestore()
              .collection("schedulerData")
              .doc(oldAllTimeArray[n])
              .update({
                documents: finalDelDocArray,
              });
          }
        } else {
          //This is the case in which something must be deleted.
          var w;
          var x;
          var y;
          var z;
          var a;
          var b;
          for (w = 0; w < oldMedArray.length; w++) {
            //This finds all of the times for which something must be deleted.
            if (!newMedArray.includes(oldMedArray[w])) {
              let oldMedTimeArray = [];
              for (x = 0; x < before.reminders.length; x++) {
                if (before.reminders.medicationID === oldMedArray[w]) {
                  if (
                    !oldMedTimeArray.includes(before.reminders.schedulerTime)
                  ) {
                    oldMedTimeArray.push(before.reminders.schedulerTime);
                  }
                }
              }
              for (y = 0; y < oldMedTimeArray.length; y++) {
                var matchDoc;
                var bigMatchDoc;
                await admin
                  .firestore()
                  .collection("schedulerData")
                  .doc(oldMedTimeArray[y])
                  .get()
                  .then((documentSnapshot) => {
                    if (documentSnapshot.exists) {
                      for (
                        z = 0;
                        z < documentSnapshot.data().documents.length;
                        z++
                      ) {
                        if (documentSnapshot.data().documents[z].id === docID) {
                          matchDoc = documentSnapshot.data().documents[z];
                          for (a = 0; a < matchDoc.length; a++) {
                            let reminderArray = [];
                            for (b = 0; b < matchDoc[a].reminders.length; b++) {
                              if (
                                !(
                                  matchDoc.reminders[b].medId ===
                                  oldMedTimeArray[y]
                                )
                              ) {
                                reminderArray.push(matchDoc.reminders[b]);
                              }
                            }
                            matchDoc[a].reminders = reminderArray;
                          }
                          bigMatchDoc.push(matchDoc);
                        } else {
                          bigMatchDoc.push(
                            documentSnapshot.data().documents[z]
                          );
                        }
                      }
                    }
                  });
                //This finishes any required deletion.
                await admin
                  .firestore()
                  .collection("schedulerData")
                  .doc(oldMedTimeArray[y])
                  .update({
                    documents: bigMatchDoc,
                  });
              }
            }
          }
        }
      }
      var k;
      var l;
      var m;
      var t;
      var medID;
      //This adds any new reminders that were created to the section of the database that the notification job uses.
      if (after.reminders.length !== 0) {
        for (k = 0; k < allTimeArray.length; k++) {
          let oldObj = {};
          let addObj = {};
          var dateAddArray = [];
          await admin
            .firestore()
            .collection("schedulerData")
            .doc(allTimeArray[k])
            .get()
            .then((documentSnapshot) => {
              if (documentSnapshot.exists) {
                for (t = 0; t < documentSnapshot.data().documents.length; t++) {
                  if (documentSnapshot.data().documents[t].id === docID) {
                    oldObj = documentSnapshot.data().documents[t];
                  }
                }
              }
            });
          //This formats the data in a way that the notification job can read.
          for (l = 0; l < finalArray.length; l++) {
            if (
              finalArray[l].schedulerTime === allTimeArray[k] ||
              finalArray[l].schedulerTime === allTimeArray[k].substr(1)
            ) {
              remDate = finalArray[l].occurrenceDate;
              remID = finalArray[l].id;
              medID = finalArray[l].medicationID;
              let dateCheckVar = true;
              for (m = 0; m < dateAddArray.length; m++) {
                if (dateAddArray[m].id === remDate) {
                  dateAddArray[m].reminders.push({
                    remID: remID,
                    medID: medID,
                  });
                  dateCheckVar = false;
                }
              }
              if (dateCheckVar) {
                dateAddArray.push({
                  reminders: [{ remID: remID, medID: medID }],
                  id: remDate,
                });
              }
            }
          }
          addObj.id = docID;
          addObj.dateArray = dateAddArray;
          emptyCheck = await docExistChecker(allTimeArray[k]);
          if (remID !== 0) {
            if (!emptyCheck) {
              admin
                .firestore()
                .collection("schedulerData")
                .doc(allTimeArray[k])
                .set({ documents: [addObj], id: allTimeArray[k] });
            } else {
              await admin
                .firestore()
                .collection("schedulerData")
                .doc(allTimeArray[k])
                .update({
                  documents: admin.firestore.FieldValue.arrayRemove(oldObj),
                });
              await admin
                .firestore()
                .collection("schedulerData")
                .doc(allTimeArray[k])
                .update({
                  documents: admin.firestore.FieldValue.arrayUnion(addObj),
                });
            }
          }
        }
        //This finally updates the user data.
        admin.firestore().collection("users").doc(docID).update({
          reminders: finalArray,
          updateNeeded: false,
          allTime: allTimeArray,
        });
      } else {
        admin.firestore().collection("users").doc(docID).update({
          reminders: finalArray,
          allTime: allTimeArray,
        });
      }
    }
    return Promise.resolve(100);
  });

//This function creates and sends the confirmation code for contact creation.
exports.confCodeFunc = functions.https.onCall(async (data) => {
  let contactAuthCode = [];
  try {
    let documentSnapshot = await admin
      .firestore()
      .collection("usersLog")
      .doc(data.userID)
      .get();
    //This creates a new log for a new user.
    if (!documentSnapshot.exists) {
      await admin.firestore().collection("usersLog").doc(data.userID).set({
        contactAuthCode: [],
      });
      documentSnapshot = await admin
        .firestore()
        .collection("usersLog")
        .doc(data.userID)
        .get();
    }
    if (documentSnapshot.exists) {
      //This takes the log of confirmation codes.
      contactAuthCode = documentSnapshot.data().contactAuthCode;
      let codeObject = {};
      var codeSendTime;
      var expirationTime;
      var code;
      var id;
      //This creates the confirmation code and the properties of the confirmation message.
      code = parseInt(Math.random() * 900000 + 100000);
      codeSendTime = new Date().getTime();
      expirationTime = codeSendTime + 600000;
      id = parseInt(Math.random() * 100000000 + 100000000);
      if (data.contactType === "Email") {
        codeObject.contactType = data.contactType;
        codeObject.contactInfo = data.contactInfo;
        codeObject.code = code;
        codeObject.codeSendTime = codeSendTime;
        codeObject.expirationTime = expirationTime;
        codeObject.id = id;
        contactAuthCode.push(codeObject);
      } else {
        codeObject.contactType = data.contactType;
        codeObject.contactInfo = data.contactInfo;
        //This ensures that no fake or invalid country codes are inputted.
        if (
          data.contactType === "SMS" &&
          !(
            (codeObject.contactInfo[1] === "1" &&
              codeObject.contactInfo.length === 12) ||
            (codeObject.contactInfo.substr(1, 2) === "91" &&
              (codeObject.contactInfo.length === 13 ||
                codeObject.contactInfo.length === 14)) ||
            (codeObject.contactInfo.substr(1, 2) === "65" &&
              codeObject.contactInfo.length === 11) ||
            (codeObject.contactInfo.substr(1, 2) === "44" &&
              (codeObject.contactInfo.length === 13 ||
                codeObject.contactInfo.length === 14)) ||
            (codeObject.contactInfo.substr(1, 2) === "92" &&
              codeObject.contactInfo.length === 13)
          )
        ) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            "We're sorry, but this country code is not supported."
          );
        }
        codeObject.code = code;
        codeObject.codeSendTime = codeSendTime;
        codeObject.expirationTime = expirationTime;
        codeObject.id = id;
        //This pushes the new code into the log.
        contactAuthCode.push(codeObject);
      }
      //This puts the new code back into the database for future reference.
      admin.firestore().collection("usersLog").doc(data.userID).set({
        contactAuthCode: contactAuthCode,
      });
      //This creates the message.
      const contentData = {
        Subject: "WEminders confirmation code",
        Code: codeObject.code.toString(),
        Title: "Verify your email address.",
        Header:
          "You have selected this email address as a contact to receive notifications from WEminders. To verify this email address belongs to you, enter the code below.",
        Footer:
          "WEminders requires verification whenever an email address is selected as a contact to receive notifications.  If you did not make this request, you can ignore this email. ",
        Body: "WEminders Verification code - " + codeObject.code.toString(),
      };
      //This sends the message.
      switch (data.contactType) {
        case "Email":
          sendEmailUsingSG(data, contentData);
          return Promise.resolve(
            contactAuthCode[contactAuthCode.length - 1].id
          );
        case "SMS":
          sendSMSUsingSG(data, contentData);
          return Promise.resolve(
            contactAuthCode[contactAuthCode.length - 1].id
          );
        case "Whatsapp":
          sendWhatsAppUsingSG(data, contentData);
          return Promise.resolve(
            contactAuthCode[contactAuthCode.length - 1].id
          );
      }
      return Promise.resolve(contactAuthCode[contactAuthCode.length - 1].id);
    }
  } catch (error) {
    functions.logger.error(error.message);
    return Promise.resolve(error.message);
  }
  return Promise.resolve(contactAuthCode[contactAuthCode.length - 1].id);
});

//This functions checks if the confirmation code that the user inputs is correct.
exports.confCodeCheckFunc = functions.https.onCall(async (checkData) => {
  let contactAuthCodeArray = [];
  //This retrieves the log from the database.
  await admin
    .firestore()
    .collection("usersLog")
    .doc(checkData.userID)
    .get()
    .then((documentSnapshot) => {
      contactAuthCodeArray = documentSnapshot.data().contactAuthCode;
    });
  var i;
  for (i = 0; i < contactAuthCodeArray.length; i++) {
    if (
      contactAuthCodeArray[contactAuthCodeArray.length - (i + 1)].id ===
      checkData.id
    ) {
      //In this function, a value of 0 indicates a correct code and a value of 1 indicates an incorrect code.
      if (
        contactAuthCodeArray[contactAuthCodeArray.length - (i + 1)].code ===
        parseInt(checkData.code)
      ) {
        return Promise.resolve(0);
      } else {
        return Promise.resolve(1);
      }
    }
  }
  return Promise.resolve(2);
});

//This function runs every five minutes to send any required notifications.
exports.scheduledFunction = functions.pubsub
  .schedule("every 5 minutes from 00:00 to 23:55")
  .onRun(async (context) => {
    let userReminderArray = [];
    var time = new Date().toTimeString();
    var timeString = time.substr(0, 5);
    var checkExist = await docExistChecker(timeString);
    var userArray = [];
    var i;
    var j;
    var k;
    var l;
    //This retrieves all of the reminders during that specific time.
    if (checkExist) {
      await admin
        .firestore()
        .collection("schedulerData")
        .doc(timeString)
        .get()
        .then((documentSnapshot) => {
          userArray = documentSnapshot.data().documents;
        });
      var date = new Date(Date.now());
      var year = date.getFullYear();
      var month = "0" + parseInt(date.getMonth() + 1, 10).toString();
      var day = "0" + date.getDate();
      var formattedDate = year + "/" + month.substr(-2) + "/" + day.substr(-2);
      for (i = 0; i < userArray.length; i++) {
        await admin
          .firestore()
          .collection("users")
          .doc(userArray[i].id)
          .get()
          .then((documentSnapshot) => {
            userReminderArray = documentSnapshot.data().reminders;
            userContactArray = documentSnapshot.data().contacts;
            username = documentSnapshot.data().username;
          });
        for (j = 0; j < userArray[i].dateArray.length; j++) {
          if (userArray[i].dateArray[j].id === formattedDate) {
            for (k = 0; k < userArray[i].dateArray[j].reminders.length; k++) {
              for (l = 0; l < userReminderArray.length; l++) {
                if (
                  userArray[i].dateArray[j].reminders[k].remID ===
                    userReminderArray[l].id &&
                  userContactArray.length !== 0
                ) {
                  //This sends the notification to the contact.
                  switch (userContactArray[0].communication) {
                    case "Email":
                      sendEmailUsingSG(
                        {
                          contactInfo: userContactArray[0].email
                            ? userContactArray[0].email
                            : await internalDecryptFunc(
                                userContactArray[0].emailData
                              ),
                        },
                        {
                          Subject: "WEminders: Missed Reminder",
                          Title: "Missed reminder notification from WEminders",
                          Header:
                            "You have selected this email address as a contact to receive notifications from WEminders.",
                          Footer:
                            "You have been chosen as a contact for a WEminders user. This WEminders user (" +
                            username +
                            ") has missed the above reminder, and we are notifying you through this email.",
                          Body:
                            "This is a notification that a WEminders user missed this: [" +
                            userReminderArray[l].name +
                            "]",
                        }
                      );
                      break;
                    case "SMS":
                      sendSMSUsingSG(
                        {
                          contactInfo: userContactArray[0].phone
                            ? userContactArray[0].phone
                            : await internalDecryptFunc(
                                userContactArray[0].phoneData
                              ),
                        },
                        {
                          Body:
                            "This is a notification that a WEminder user (" +
                            username +
                            ") missed this: [" +
                            userReminderArray[l].name +
                            "]",
                        }
                      );
                      break;
                    case "Whatsapp":
                      sendWhatsAppUsingSG(
                        {
                          contactInfo: userContactArray[0].phone
                            ? userContactArray[0].phone
                            : await internalDecryptFunc(
                                userContactArray[0].phoneData
                              ),
                        },
                        {
                          Body:
                            "This is a notification that a WEminders user " +
                            username +
                            " missed this: " +
                            userReminderArray[l].name,
                        }
                      );
                      break;
                  }
                }
              }
            }
          }
        }
      }
    }
    return null;
  });

//This function encrypts any personal information.
exports.encryptFunc = functions.https.onCall(async (data) => {
  const cryptr = new Cryptr(wemKey);
  const returnString = cryptr.encrypt(data.originString);
  return Promise.resolve(returnString);
});

//This function decrypts any personal information.
exports.decryptFunc = functions.https.onCall(async (data) => {
  const cryptr = new Cryptr(wemKey);
  const returnString = cryptr.decrypt(data.originString);
  return Promise.resolve(returnString);
});
