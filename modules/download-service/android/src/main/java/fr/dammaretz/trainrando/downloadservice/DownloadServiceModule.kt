package fr.dammaretz.trainrando.downloadservice

import android.content.Context
import android.content.Intent
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DownloadServiceModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DownloadService")

    AsyncFunction("startDownloadNotification") { id: String, title: String, progressText: String ->
      sendToService(DownloadForegroundService.ACTION_START) {
        putExtra(DownloadForegroundService.EXTRA_ID, id)
        putExtra(DownloadForegroundService.EXTRA_TITLE, title)
        putExtra(DownloadForegroundService.EXTRA_PROGRESS_TEXT, progressText)
      }
    }

    AsyncFunction("updateDownloadProgress") { id: String, progress: Double, progressText: String ->
      sendToService(DownloadForegroundService.ACTION_UPDATE) {
        putExtra(DownloadForegroundService.EXTRA_ID, id)
        putExtra(DownloadForegroundService.EXTRA_PROGRESS, (progress * 100.0).toInt().coerceIn(0, 100))
        putExtra(DownloadForegroundService.EXTRA_PROGRESS_TEXT, progressText)
      }
    }

    AsyncFunction("completeDownloadNotification") { id: String, completeText: String ->
      sendToService(DownloadForegroundService.ACTION_COMPLETE) {
        putExtra(DownloadForegroundService.EXTRA_ID, id)
        putExtra(DownloadForegroundService.EXTRA_PROGRESS_TEXT, completeText)
      }
    }

    AsyncFunction("cancelDownloadNotification") { id: String ->
      sendToService(DownloadForegroundService.ACTION_CANCEL) {
        putExtra(DownloadForegroundService.EXTRA_ID, id)
      }
    }
  }

  private fun sendToService(action: String, configure: Intent.() -> Unit) {
    val context: Context = appContext.reactContext ?: return
    val intent = Intent(context, DownloadForegroundService::class.java).apply {
      this.action = action
      configure()
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.startForegroundService(intent)
    } else {
      context.startService(intent)
    }
  }
}
