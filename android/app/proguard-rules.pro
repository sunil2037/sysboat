# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Keep React Native Modal classes
-keep class com.facebook.react.views.modal.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class ai.onnxruntime.** { *; }


# Keep TensorFlow Lite GPU classes
-keep class org.tensorflow.lite.gpu.** { *; }
-dontwarn org.tensorflow.lite.gpu.**

# Additional TensorFlow Lite rules (recommended)
-keep class org.tensorflow.lite.** { *; }
-dontwarn org.tensorflow.lite.**

