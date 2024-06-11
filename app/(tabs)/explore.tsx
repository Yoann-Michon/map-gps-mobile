import MapView, { Marker, Polyline } from "react-native-maps";
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View, Text } from "react-native";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { LocationObject } from "expo-location";
import React from "react";

type Adresse = {
  label: string;
  coordinates: [number, number];
};

const Ycoordonates = (region: { latitude: number; longitude: number }) => {
  const delta = 0.0005;
  return [
    { latitude: region.latitude + delta, longitude: region.longitude - delta },
    { latitude: region.latitude, longitude: region.longitude },
    { latitude: region.latitude + delta, longitude: region.longitude + delta },
    { latitude: region.latitude, longitude: region.longitude },
    { latitude: region.latitude - delta, longitude: region.longitude },
  ];
};

export default function TabTwoScreen() {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [adresses, setAdresses] = useState<Adresse[]>([]);
  const [region, setRegion] = useState({
    latitude: 45.1874175,
    longitude: 5.752217,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const mapRef = React.createRef<MapView>();

  async function getAdresse(adr: string) {
    try {

      if (adr.length<3){
        return 
      }

      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${adr}`
      );
      console.log(adr.length);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données.");
      }
      const datas = await response.json();
      // console.log(JSON.stringify(datas, null, 2));
      console.log("list d'adresses", adresses);

      const newAdr = datas.features.map((data: any) => ({
        coordinates: data.geometry.coordinates,
        label: data.properties.label,
      }));

      setAdresses(newAdr);

    } catch (error) {
      console.error("Erreur lors de la requête :", error);
      return null;
    }
  }

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  let text = "Waiting..";
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={"Search here"}
          onChangeText={(e) => {
            getAdresse(e);
          }}
        />
          </View>
          <View>

        {adresses.map((item, index) => (
          <TouchableOpacity
          key={index}
          onPress={() => {
            if(location){
              const newCoords = {
                ...location.coords,
                latitude: item.coordinates[1],
                longitude: item.coordinates[0]
              }
              setLocation({
                ...location,
                coords: newCoords
              });
            }
          }}
          
          >
          <Text style={{color: "white"}}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
      <MapView
        style={styles.map}
        region={{ ...region, ...location?.coords }}
        ref={mapRef}
      >
        <Marker coordinate={location !== null ? location.coords : region} />
        <Polyline
          coordinates={Ycoordonates(region)}
          strokeColor="#000"
          strokeWidth={5}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  inputContainer: {
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 10,
  },
  input: {
    paddingVertical: 10,
    fontSize: 18,
    marginLeft: 10,
    flex: 1,
    fontWeight: "400",
    width: "100%",
  },
});
