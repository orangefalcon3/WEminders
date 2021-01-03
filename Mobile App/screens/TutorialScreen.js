//This screen is used to direct the user to the app tutorial.
import React from "react";
import { View, Linking, Text, TouchableOpacity } from "react-native";
import styles from "../styles/AppStyles";
export default function TutorialScreen({ navigation }) {
  return (
    <View style={styles.columnScreen}>
      <Text style={styles.normalText}>Please visit</Text>
      <TouchableOpacity //This is the button that takes the user to the app tutorial.
        onPress={() => Linking.openURL("https://weminders.org")}
      >
        <Text style={styles.clickableText}> WEminders Web page </Text>
      </TouchableOpacity>
      <Text style={styles.normalText}>
        for FAQs, Tutorial and other assistance
      </Text>
    </View>
  );
}
