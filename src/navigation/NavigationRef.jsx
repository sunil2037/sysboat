import { createNavigationContainerRef } from '@react-navigation/native';

export const NavigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (NavigationRef.isReady()) {
    NavigationRef.navigate(name, params);
  }
  else {
    setTimeout(() => navigate(name, params), 100);
  }
}


export function getCurrentRouteName() {
  if (NavigationRef.isReady()) {
    return NavigationRef.getCurrentRoute()?.name;
  }
  return null;
}