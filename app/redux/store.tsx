import { createStore, combineReducers } from "redux";
import locationReducer from "./Reducer";

const rootReducer = combineReducers({
  location: locationReducer,
});

const store = createStore(rootReducer);

export default store;
