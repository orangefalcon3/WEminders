//This screen displays the contacts in a list.
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  SafeAreaView,
  Text,
  FlatList,
  Alert,
} from "react-native";
import styles from "../../styles/AppStyles";
import { AppDataContext } from "../../navigation/AppDataProvider";
import functions from "@react-native-firebase/functions";
export default function ContactsScreen({ navigation, route }) {
  const { appdata } = useContext(AppDataContext);
  const [, forceUpdate] = useState();

  useEffect(() => {
    //This updates the contact information if there are any changes made to it.
    const updateData = async () => {
      var i;
      if (appdata.contacts && appdata.contacts.length > 0) {
        for (i = 0; i < appdata.contacts.length; i++) {
          if (appdata.contacts[i] && appdata.contacts[i].phoneData) {
            appdata.contacts[i].phone = await getPhoneNumber(
              appdata.contacts[i].phoneData
            );
          } else if (appdata.contacts[i] && appdata.contacts[i].emailData) {
            appdata.contacts[i].email = await getEmailAddress(
              appdata.contacts[i].emailData
            );
          }
        }
      }
    };
    updateData();
    forceUpdate((s) => !s);
  }, [appdata]);

  function pressChangeAdd() {
    //This function navigates the user to a screen where the can create a contact.
    navigation.navigate("Add Contacts");
  }

  async function pressChangeEdit(id) {
    //This function runs whenever a user tries to edit an existing contact.
    appdata.contactChange = getContactByID(id);
    if (appdata.contactChange.phoneData) {
      appdata.contactChange.phone = await getPhoneNumber(
        appdata.contactChange.phoneData
      );
    } else if (appdata.contactChange.emailData) {
      appdata.contactChange.email = await getEmailAddress(
        appdata.contactChange.emailData
      );
    }
    navigation.navigate("Edit Contacts");
  }

  function getContactByID(id) {
    //This is a sub-function to get a contact through its id.
    var i;
    for (i = 0; i < appdata.contacts.length; i++) {
      if (appdata.contacts[i].id === id) {
        return appdata.contacts[i];
      }
    }
  }

  async function getPhoneNumber(phoneData) {
    //This decrypts the phone number so that the user can see it.
    const decryptFunc = functions().httpsCallable("decryptFunc");
    try {
      const returnString = await decryptFunc({
        originString: phoneData,
      });
      return returnString.data;
    } catch (error) {
      console.error(error);
      return "";
    }
  }

  async function getEmailAddress(emailData) {
    //This decrypts the email address so that the user can see it.
    const decryptFunc = functions().httpsCallable("decryptFunc");
    try {
      const returnString = await decryptFunc({
        originString: emailData,
      });
      return returnString.data;
    } catch (error) {
      console.error(error);
      return "";
    }
  }

  function Item({
    //This function renders the contact as an item in a list.
    name,
    relation,
    phone,
    phoneData,
    email,
    emailData,
    communication,
    id,
    func,
  }) {
    return (
      <TouchableOpacity onPress={() => func(id)}>
        <View style={styles.listItem}>
          <Text style={styles.listItemTitleText}>{name}</Text>
          <Text style={styles.listItemSubtext}>Relation: {relation}</Text>
          <Text style={styles.listItemSubtext}>
            Communication: {communication}
          </Text>
          {phoneData && (
            <TouchableOpacity
              onPress={async () => {
                Alert.alert(
                  "This is the phone number: " +
                    (await getPhoneNumber(phoneData))
                );
              }}
            >
              <Text
                style={[
                  styles.listItemSubtext,
                  { fontWeight: "bold", textDecorationLine: "underline" },
                ]}
              >
                Show Phone Number
              </Text>
            </TouchableOpacity>
          )}
          {emailData && (
            <TouchableOpacity
              onPress={async () => {
                Alert.alert(
                  "This is the email address: " +
                    (await getEmailAddress(emailData))
                );
              }}
            >
              <Text
                style={[
                  styles.listItemSubtext,
                  { fontWeight: "bold", textDecorationLine: "underline" },
                ]}
              >
                Show Email Address
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.screen}>
        <FlatList //This renders the list of contacts.
          data={appdata.contacts}
          renderItem={({ item }) => (
            <Item
              id={item.id}
              name={item.name}
              relation={item.relation}
              phone={item.phone}
              communication={item.communication}
              email={item.email}
              phoneData={item.phoneData}
              emailData={item.emailData}
              func={pressChangeEdit}
            />
          )}
          keyExtractor={(item) => item.id}
        />
      </SafeAreaView>
      {appdata.contacts.length === 0 && (
        <TouchableOpacity //This renders the button to create a contact.
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
          onPress={pressChangeAdd}
        >
          <Text style={{ fontSize: 30, color: "#fff" }}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
