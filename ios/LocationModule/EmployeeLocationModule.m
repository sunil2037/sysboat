//
//  EmployeeLocationModule.m
//  sysboat
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(EmployeeLocationModule, RCTEventEmitter)

// ---------- Permissions ----------
RCT_EXTERN_METHOD(requestPermission)

RCT_EXTERN_METHOD(
  getLocationPermissionStatus:
  (RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

// ---------- Tracking (Normal / WhatsApp-style) ----------
RCT_EXTERN_METHOD(
  startTracking:
  (NSString *)userId
  companyId:(NSString *)companyId
  userData:(NSDictionary *)userData
  token:(NSString *)token
  punchIn:(double)punchIn
  punchOut:(double)punchOut
  compLat:(double)compLat
  compLon:(double)compLon
  radius:(double)radius
  intervalMs:(double)intervalMs
)

RCT_EXTERN_METHOD(stopTracking)

// ---------- Live Location (Temporary High Accuracy) ----------
RCT_EXTERN_METHOD(startLiveLocation:(double)minutes)
RCT_EXTERN_METHOD(stopLiveLocation)

// ---------- Silent Push / Server Control ----------
RCT_EXTERN_METHOD(handleServerCommand:(NSString *)command)

@end
