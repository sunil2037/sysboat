//
//  NativeStorage.m
//  sysboat
//
//  Created by Sunil Sharma on 19/12/25.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NativeStorage, NSObject)

RCT_EXTERN_METHOD(setString:(NSString *)key value:(NSString * _Nullable)value)

RCT_EXTERN_METHOD(getString:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(remove:(NSString *)key)

RCT_EXTERN_METHOD(clearAll)

@end
