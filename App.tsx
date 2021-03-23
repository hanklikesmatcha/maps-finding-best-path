import React, { useCallback, useEffect, useState } from "react"
import { Button, IconButton, Searchbar } from "react-native-paper"
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete"
import {
  Text,
  Alert,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from "react-native"
import MapView, { Marker } from "react-native-maps"
import { request, PERMISSIONS } from "react-native-permissions"
import { initialDestinations, destinationProps } from "./destinations"
import "react-native-get-random-values"
import { v4 as uuidv4 } from "uuid"
import Geolocation from "@react-native-community/geolocation"
import { GOOGLE_API_KEY } from "./config/keys"
import MapViewDirections from "react-native-maps-directions"

export default function App() {
  const [modalVisible, setModalVisible] = useState(false)
  // Initial location
  const initialPosition = {
    latitude: -36.850000262368575,
    longitude: 174.77820276942214,
    latitudeDelta: 0.05,
    longitudeDelta: 0.02,
  }
  // Hook for updating destinations
  const [destinations, setDestinations] = React.useState(initialDestinations)
  const [destinationList, setDestinationList] = React.useState<
    destinationProps[]
  >([])
  // Hook for currenLocation
  const [currentLocation, setPosition] = React.useState(initialPosition)

  // Submit search
  const searchAutoComplete = (name: string, lat: number, lng: number) => {
    const newDestinations = destinations.concat({
      id: uuidv4(),
      name: name,
      latitude: lat,
      longitude: lng,
    })
    setDestinations(newDestinations)
  }
  // Ask for request
  async function requestLocation() {
    const response = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)
    return response
  }
  // Get current location
  const locateCurrentPosition = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        let region = {
          id: uuidv4(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.005,
        }
        setPosition(region)
      },
      (error) => Alert.alert(error.message)
    )
  }
  // Remove an item from destination list
  const removeItem = (id: string) => {
    const filteredList = destinations.filter((item) => item.id !== id)
    setDestinations(filteredList)
  }

  const confirmDirections = useCallback(() => {
    setModalVisible(!modalVisible)
    useEffect
  }, [modalVisible])

  const setDirection = useCallback(() => {
    setModalVisible(!modalVisible)
    setDestinationList(destinations)
  }, [modalVisible])
  const waypoints = destinationList.map((item) => {
    return { latitude: item.latitude, longitude: item.longitude }
  })
  useEffect(() => {
    requestLocation()
  }, [destinations, destinationList])

  return (
    <View>
      <MapView
        style={styles.map}
        showsUserLocation={true}
        initialRegion={currentLocation}
        region={currentLocation}
      >
        <MapViewDirections
          origin={currentLocation}
          destination={currentLocation}
          apikey={GOOGLE_API_KEY}
          waypoints={waypoints}
          optimizeWaypoints={true} // to find the best route
          mode="WALKING" // no driving or busing. Auckland is famously having traffic jam
          strokeColor="hotpink"
          strokeWidth={4}
        />
        {destinationList &&
          destinationList.map((item: destinationProps) => {
            return (
              <Marker
                key={item.id}
                title={item.name}
                coordinate={{
                  latitude: item.latitude,
                  longitude: item.longitude,
                }}
              />
            )
          })}
      </MapView>
      <SafeAreaView style={styles.container}>
        <GooglePlacesAutocomplete
          autoFillOnNotFound={true}
          placeholder="Search"
          // details is provided when fetchDetails = true
          fetchDetails={true}
          onPress={(data, details) => {
            searchAutoComplete(
              data.structured_formatting.main_text,
              details!.geometry.location.lat,
              details!.geometry.location.lng
            )
          }}
          renderRow={(data) => {
            if (data.description) {
              return (
                <>
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "flex-start",
                      alignItems: "center",
                      flexDirection: "row",
                      width: 10,
                      height: 25,
                    }}
                  >
                    <Button
                      icon="plus"
                      color="black"
                      disabled={true}
                      style={{
                        flex: 0,
                        padding: 0,
                        margin: 0,
                      }}
                    >
                      {" "}
                    </Button>
                    <Text style={{ flex: 1 }}>{data.description}</Text>
                  </View>
                </>
              )
            } else {
              return (
                <View>
                  <Text>{data.description}</Text>
                </View>
              )
            }
          }}
          query={{
            key: GOOGLE_API_KEY,
            language: "en",
            components: "country:nz",
          }}
          styles={{
            container: {
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            },
            textInputContainer: {
              backgroundColor: "white",
              borderBottomWidth: 1,
              borderBottomColor: "rgba(55, 55, 55, 0.5)",
              width: "85%",
            },
            textInput: {
              height: 50,
              color: "#5d5d5d",
              fontSize: 18,
            },
            predefinedPlacesDescription: {
              color: "#1faadb",
            },
            listView: {
              width: "85%",
              opacity: 0.75,
            },
          }}
          onFail={(errorMessage) => Alert.alert(errorMessage)}
        />
        <View style={styles.destinationList}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
            }}
          >
            <Button
              disabled={true}
              mode="text"
              labelStyle={styles.buttonLabel}
              style={{ flex: 1 }}
              uppercase={false}
            >
              Destionations
            </Button>
            <Button
              icon="directions"
              onPress={confirmDirections}
              mode="outlined"
              labelStyle={styles.buttonLabel}
              style={styles.button}
              uppercase={false}
            >
              Directions
            </Button>
          </View>
          <FlatList
            style={{ flex: 1, marginLeft: 30 }}
            data={destinations}
            keyExtractor={({ id }) => id}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Text style={styles.item}>{item.name}</Text>
                </TouchableOpacity>
              )
            }}
          />
        </View>
      </SafeAreaView>
      <IconButton
        icon="crosshairs-gps"
        size={65}
        style={styles.gps}
        onPress={() => {
          locateCurrentPosition()
        }}
      ></IconButton>
      <View>
        <Modal animationType="fade" transparent={true} visible={modalVisible}>
          <View
            style={{
              flex: 1,
              flexDirection: "row-reverse",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 300,
            }}
          >
            <Pressable onPress={setDirection}>
              <Button
                style={{ margin: 10 }}
                labelStyle={{ fontSize: 20, height: 30, width: 100 }}
                mode="contained"
                color="black"
                uppercase={false}
              >
                Confirm
              </Button>
            </Pressable>
            <Pressable onPress={() => setModalVisible(!modalVisible)}>
              <Button
                mode="outlined"
                color="black"
                labelStyle={{ fontSize: 20, height: 30, width: 100 }}
                style={{
                  margin: 10,
                  backgroundColor: "rgba(255,255,255, 0.8)",
                }}
                uppercase={false}
              >
                Go Back
              </Button>
            </Pressable>
          </View>
        </Modal>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    width: "100%",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  search: {
    // width: "85%",
  },
  gps: {
    flex: 1,
    position: "absolute",
    bottom: 70,
    right: 20,
  },
  destinationList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    alignSelf: "stretch",
    flexDirection: "column",
  },
  item: {
    padding: 10,
  },
  buttonLabel: {
    marginLeft: 30,
    fontSize: 20,
    color: "black",
    opacity: 1,
  },
  button: {
    marginRight: 30,
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
})
