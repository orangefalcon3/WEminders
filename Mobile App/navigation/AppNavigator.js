//This is the screen where all of the navigation and header customization is.
import React, { useContext } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ContactsScreen from "../screens/contacts/ContactsScreen";
import TutorialScreen from "../screens/TutorialScreen";
import RemindersScreen from "../screens/reminders/RemindersScreen";
import EditReminderScreen from "../screens/reminders/EditReminderScreen";
import EditOccurrencesDailyScreen from "../screens/reminders/EditOccurrencesDailyScreen";
import AddContactsScreen from "../screens/contacts/AddContactsScreen";
import EditContactsScreen from "../screens/contacts/EditContactsScreen";
import AddContactsEmailScreen from "../screens/contacts/AddContactsEmailScreen";
import AddContactsPhoneScreen from "../screens/contacts/AddContactsPhoneScreen";
import EmailConfirmationScreen from "../screens/contacts/EmailConfirmationScreen";
import PhoneConfirmationScreen from "../screens/contacts/PhoneConfirmationScreen";
import EditOccurrencesWeeklyScreen from "../screens/reminders/EditOccurrencesWeeklyScreen";
import { TouchableOpacity, Text } from "react-native";
import { AppDataContext } from "./AppDataProvider";
import { AuthContext } from "./AuthProvider";

const Stack = createStackNavigator();
export default function AppNavigator() {
  const { wemLogEvent } = useContext(AuthContext);
  const {
    appdata,
    saveAppData,
    createReminderList,
    handleReminderCompletion,
  } = React.useContext(AppDataContext);
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen
        name="WEminders"
        component={HomeScreen}
        options={{
          headerRight: () => (
            <TouchableOpacity
              style={{
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                minWidth: 50,
                height: 20,
                borderRadius: 25,
              }}
              onPress={() => { //This is the "Done" button on the home screen.
                handleReminderCompletion();
                saveAppData(appdata, "SAVE_TASK_COMPLETION");
                createReminderList();
                wemLogEvent("Task_Cleared");
              }}
            >
              <Text style={{ fontSize: 18, color: "#007ACC" }}>Done</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="Edit Reminder" component={EditReminderScreen} />
      <Stack.Screen
        name="Edit Occurrences - Daily"
        options={{ headerLeft: null }} 
        component={EditOccurrencesDailyScreen}
      />
      <Stack.Screen
        name="Edit Occurrences - Weekly"
        options={{ headerLeft: null }} /
        component={EditOccurrencesWeeklyScreen}
      />
      <Stack.Screen name="Contacts" component={ContactsScreen} />
      <Stack.Screen name="Help" component={TutorialScreen} />
      <Stack.Screen name="Add Contacts" component={AddContactsScreen} />
      <Stack.Screen name="Edit Contacts" component={EditContactsScreen} />
      <Stack.Screen
        name="Add Contacts - Email"
        component={AddContactsEmailScreen}
      />
      <Stack.Screen
        name="Add Contacts - Phone"
        component={AddContactsPhoneScreen}
      />
      <Stack.Screen
        name="Email Confirmation"
        component={EmailConfirmationScreen}
      />
      <Stack.Screen
        name="Phone Confirmation"
        component={PhoneConfirmationScreen}
      />
    </Stack.Navigator>
  );
}
