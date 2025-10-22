import { SET_LOCATION, SELECT_LOCATION } from "./Actions";
const initialState = {
  latitude: null,
  longitude: null,
  name: "",
  countryCode: "",
  country: "",
  city: "",
  state: "",

  latitude2: null,
  longitude2: null,
  name2: "",
  countryCode2: "",
  country2: "",
  city2: "",
  state2: "",
};

const locationReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_LOCATION:
      return {
        ...state,
        latitude: action.payload.latitude,
        longitude: action.payload.longitude,
        name: action.payload.name,
        countryCode: action.payload.countryCode,
        country: action.payload.country,
        city: action.payload.city,
        state: action.payload.state,
      };

    case SELECT_LOCATION:
      if (!action.payload) {
        return {
          ...state,
          latitude2: null,
          longitude2: null,
          name2: "",
          countryCode2: "",
          country2: "",
          city2: "",
          state2: "",
        };
      }
      return {
        ...state,
        latitude2: action.payload.latitude,
        longitude2: action.payload.longitude,
        name2: action.payload.name,
        countryCode2: action.payload.countryCode,
        country2: action.payload.country,
        city2: action.payload.city,
        state2: action.payload.state,
      };

    default:
      return state;
  }
};

export default locationReducer;
