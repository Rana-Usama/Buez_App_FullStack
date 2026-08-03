import {
  createNavigationContainerRef,
  ParamListBase,
} from "@react-navigation/native";

// Parameterised with ParamListBase so `navigate(name, params)` accepts the
// dynamic screen names used across the app; without it the ref defaults to an
// empty param list and every argument widens to `never`.
export const navigationRef = createNavigationContainerRef<ParamListBase>();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
      }
    }, 300);
  }
}
