import throttle from "lodash.throttle";
import {
  configureStore as rtkConfigureStore,
  getDefaultMiddleware,
} from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import { saveState } from "./localStorage";
import Peer from "peerjs";
import { peerJSMiddleware } from "./peer-js-redux-middleware";

const customizedMiddleware = getDefaultMiddleware({
  thunk: true,
  immutableCheck: false,
  serializableCheck: false,
}).concat(peerJSMiddleware);

export default function configureStore() {
  const store = rtkConfigureStore({
    reducer: rootReducer,
    middleware: customizedMiddleware,
  });

  store.subscribe(
    throttle(() => {
      saveState(store.getState());
    }, 1000)
  );

  return store;
}
