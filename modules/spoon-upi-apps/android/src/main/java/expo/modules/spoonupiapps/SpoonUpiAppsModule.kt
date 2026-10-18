package expo.modules.spoonupiapps

import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * The UPI apps installed on this device, and opening one of them with a UPI Intent link.
 *
 * Recurring's UPI Autopay (Figma 2316:3558, "Choose your UPI app") lists the apps that can take a
 * `upi://` link, and opens the one the customer picks with Razorpay's `upi://mandate?…` link,
 * unmodified, aimed at that app's package so Android never shows its own chooser.
 *
 * An app that answers `upi://mandate` is listed as mandate-capable; one that only answers
 * `upi://pay` is still listed (the JS side decides what to show), because some UPI apps register
 * only the generic scheme yet open a mandate link aimed at them.
 */
class SpoonUpiAppsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SpoonUpiApps")

    Function("listUpiApps") {
      val context = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
      val pm = context.packageManager
      val mandate = query(pm, "upi://mandate")
      val pay = query(pm, "upi://pay")
      val ownPackage = context.packageName
      val seen = LinkedHashMap<String, Map<String, Any>>()
      for ((info, supportsMandate) in mandate.map { it to true } + pay.map { it to false }) {
        val packageName = info.activityInfo?.packageName ?: continue
        if (packageName == ownPackage || seen.containsKey(packageName)) continue
        seen[packageName] = mapOf(
          "packageName" to packageName,
          "label" to info.loadLabel(pm).toString(),
          "supportsMandate" to supportsMandate,
        )
      }
      seen.values.toList()
    }

    Function("openUpiApp") { url: String, packageName: String ->
      val context = appContext.currentActivity ?: appContext.reactContext
        ?: return@Function false
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
        setPackage(packageName)
        if (appContext.currentActivity == null) addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      try {
        context.startActivity(intent)
        true
      } catch (error: ActivityNotFoundException) {
        false
      }
    }
  }

  private fun query(pm: PackageManager, uri: String): List<ResolveInfo> {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri))
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      pm.queryIntentActivities(intent, PackageManager.ResolveInfoFlags.of(0L))
    } else {
      @Suppress("DEPRECATION")
      pm.queryIntentActivities(intent, 0)
    }
  }
}
