import { SET_LOCATION, SELECT_LOCATION } from "./Actions";
const initialState = {
  latitude: null,
  longitude: null,
  name: "",

  latitude2: null,
  longitude2: null,
  name2: "",
};

const locationReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_LOCATION:
      return {
        ...state,
        latitude: action.payload.latitude,
        longitude: action.payload.longitude,
        name: action.payload.name,
      };

    case SELECT_LOCATION:
      if (!action.payload) {
        return {
          ...state,
          latitude2: null,
          longitude2: null,
          name2: "",
        };
      }
      return {
        ...state,
        latitude2: action.payload.latitude,
        longitude2: action.payload.longitude,
        name2: action.payload.name,
      };

    default:
      return state;
  }
};

export default locationReducer;
