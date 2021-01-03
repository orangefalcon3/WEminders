//THIS SCREEN IS NO LONGER USED IN THE WEMINDERS APP.
import React, { Component } from "react";
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
} from "react-native";
import styles from "../styles/AppStyles";

export default class LoginScreen extends Component {
  state = {
    username: "",
    password: "",
  };

  pressChangeLogin = async () => {
    this.props.navigation.navigate("WEminders"); 
  };

  pressChangeSignup = async () => {
    this.props.navigation.navigate("Sign Up"); 
  };
  render() {
    return (
      <ScrollView style={styles.screen}>
        <View style={styles.inputContainer}>
          <TextInput placeholderTextColor="#ccc"
            value={this.state.username}
            placeholder="Username "
            onChangeText={(value) => this.setState({ username: value })}
            style={styles.input}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput placeholderTextColor="#ccc"
            value={this.state.password}
            placeholder="Password"
            onChangeText={(value) => this.setState({ password: value })}
            secureTextEntry
            style={styles.input}
          />
        </View>
        <View>
          <TouchableOpacity
            onPress={this.pressChangeLogin}
            style={styles.button}
          >
            <Text style={styles.buttontext}>Login</Text>
          </TouchableOpacity>
        </View>
        <View>
          <TouchableOpacity
            onPress={this.pressChangeSignup}
            style={styles.button}
          >
            <Text style={styles.buttontext}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
}
