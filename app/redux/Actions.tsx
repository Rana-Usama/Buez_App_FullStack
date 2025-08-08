export const SET_LOCATION = "SET_LOCATION";

export const setLocation = (location) => ({
  type: SET_LOCATION,
  payload: location,
});

export const SELECT_LOCATION = "SELECT_LOCATION";

export const selectLocation = (location) => ({
  type: SELECT_LOCATION,
  payload: location,
});
