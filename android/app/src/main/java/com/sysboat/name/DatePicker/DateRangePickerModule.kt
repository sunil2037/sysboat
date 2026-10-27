package com.sysboat.name.DatePicker

import android.os.Parcel
import android.os.Parcelable
import android.util.Log
import com.facebook.react.bridge.*
import com.google.android.material.datepicker.MaterialDatePicker
import com.google.android.material.datepicker.CalendarConstraints
import java.text.SimpleDateFormat
import java.util.*

class DateRangeValidator(
    private val minDate: Long = Long.MIN_VALUE,
    private val maxDate: Long = Long.MAX_VALUE
) : CalendarConstraints.DateValidator {

    override fun isValid(date: Long): Boolean {
        return date >= minDate && date <= maxDate
    }

    override fun describeContents(): Int = 0

    override fun writeToParcel(dest: Parcel, flags: Int) {
        dest.writeLong(minDate)
        dest.writeLong(maxDate)
    }

    companion object {
        @JvmField
        val CREATOR = object : Parcelable.Creator<DateRangeValidator> {
            override fun createFromParcel(source: Parcel): DateRangeValidator {
                return DateRangeValidator(source.readLong(), source.readLong())
            }
            override fun newArray(size: Int): Array<DateRangeValidator?> = arrayOfNulls(size)
        }
    }
}

class DateRangePickerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DateRangePicker"

    @ReactMethod
    fun show(options: ReadableMap, promise: Promise) {
        val activity = currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "No current activity found")
            return
        }

        val fmt = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        fmt.timeZone = TimeZone.getTimeZone("UTC")

        val title = options.getString("title") ?: "Select Date"
        val isSingle = options.hasKey("single") && options.getBoolean("single")

        val inputMode = when (options.getString("inputMode")?.lowercase()) {
            "input" -> MaterialDatePicker.INPUT_MODE_TEXT
            else    -> MaterialDatePicker.INPUT_MODE_CALENDAR
        }

        // ── Build calendar constraints ───────────────────────────────────────
        val hasMin = options.hasKey("minDate")
        val hasMax = options.hasKey("maxDate")

        val constraintsBuilder = CalendarConstraints.Builder()

        val minMs: Long = if (hasMin) {
            Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
                timeInMillis = options.getDouble("minDate").toLong()
                set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0);      set(Calendar.MILLISECOND, 0)
            }.timeInMillis
        } else Long.MIN_VALUE

        val maxMs: Long = if (hasMax) {
            Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
                timeInMillis = options.getDouble("maxDate").toLong()
                set(Calendar.HOUR_OF_DAY, 23); set(Calendar.MINUTE, 59)
                set(Calendar.SECOND, 59);       set(Calendar.MILLISECOND, 999)
            }.timeInMillis
        } else Long.MAX_VALUE

        if (hasMin) constraintsBuilder.setStart(minMs)
        if (hasMax) constraintsBuilder.setEnd(maxMs)
        constraintsBuilder.setValidator(DateRangeValidator(minMs, maxMs))
        val constraints = constraintsBuilder.build()

        // ── Show picker ──────────────────────────────────────────────────────
        activity.runOnUiThread {
            val fragmentManager = (activity as androidx.fragment.app.FragmentActivity)
                .supportFragmentManager

            if (isSingle) {
                // ── Single date picker ───────────────────────────────────────
                val builder = MaterialDatePicker.Builder.datePicker()
                    .setTitleText(title)
                    .setInputMode(inputMode)
                    .setCalendarConstraints(constraints)

                if (options.hasKey("startDate")) {
                    builder.setSelection(options.getDouble("startDate").toLong())
                }

                val picker = builder.build()

                picker.addOnPositiveButtonClickListener { selectedMs ->
                    val fmtOut = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                    fmtOut.timeZone = TimeZone.getTimeZone("UTC")

                    val result = Arguments.createMap().apply {
                        putString("startDate",   fmtOut.format(Date(selectedMs)))
                        putString("endDate",     fmtOut.format(Date(selectedMs)))
                        putDouble("startDateMs", selectedMs.toDouble())
                        putDouble("endDateMs",   selectedMs.toDouble())
                    }
                    promise.resolve(result)
                }

                picker.addOnNegativeButtonClickListener {
                    promise.reject("CANCELLED", "User cancelled the picker")
                }
                picker.addOnCancelListener {
                    promise.reject("CANCELLED", "User cancelled the picker")
                }

                picker.show(fragmentManager, "SINGLE_DATE_PICKER")

            } else {
                // ── Date range picker ────────────────────────────────────────
                val builder = MaterialDatePicker.Builder.dateRangePicker()
                    .setTitleText(title)
                    .setInputMode(inputMode)
                    .setCalendarConstraints(constraints)

                if (options.hasKey("startDate") && options.hasKey("endDate")) {
                    builder.setSelection(
                        androidx.core.util.Pair(
                            options.getDouble("startDate").toLong(),
                            options.getDouble("endDate").toLong()
                        )
                    )
                }

                val picker = builder.build()

                picker.addOnPositiveButtonClickListener { selection ->
                    val fmtOut = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                    fmtOut.timeZone = TimeZone.getTimeZone("UTC")

                    val result = Arguments.createMap().apply {
                        putString("startDate",   fmtOut.format(Date(selection.first)))
                        putString("endDate",     fmtOut.format(Date(selection.second)))
                        putDouble("startDateMs", selection.first.toDouble())
                        putDouble("endDateMs",   selection.second.toDouble())
                    }
                    promise.resolve(result)
                }

                picker.addOnNegativeButtonClickListener {
                    promise.reject("CANCELLED", "User cancelled the picker")
                }
                picker.addOnCancelListener {
                    promise.reject("CANCELLED", "User cancelled the picker")
                }

                picker.show(fragmentManager, "DATE_RANGE_PICKER")
            }
        }
    }
}