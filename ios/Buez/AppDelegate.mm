#import "AppDelegate.h"
// @generated begin react-native-maps-import - expo prebuild (DO NOT MODIFY) sync-f2f83125c99c0d74b42a2612947510c4e08c423a
#if __has_include(<GoogleMaps/GoogleMaps.h>)
#import <GoogleMaps/GoogleMaps.h>
#endif
// @generated end react-native-maps-import

#import <Firebase/Firebase.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <GoogleSignIn/GoogleSignIn.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#if __has_include(<GoogleMaps/GoogleMaps.h>)
  [GMSServices provideAPIKey:@"AIzaSyBSq361kA1Z14M0ymJ_u6UlKn4ulBLLrKQ"];
#endif

  [FIRApp configure];
  
  self.moduleName = @"main";
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// Unified openURL method for Firebase Auth, Google Sign-In, and React Native Linking
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  // Firebase Auth
  if (url.host && [url.host caseInsensitiveCompare:@"firebaseauth"] == NSOrderedSame) {
    return NO; // Let Firebase handle internally
  }

  // Google Sign-In
  if ([[GIDSignIn sharedInstance] handleURL:url]) {
    return YES;
  }

  // React Native Linking
  return [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application
continueUserActivity:(nonnull NSUserActivity *)userActivity
restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  BOOL result = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || result;
}

@end
