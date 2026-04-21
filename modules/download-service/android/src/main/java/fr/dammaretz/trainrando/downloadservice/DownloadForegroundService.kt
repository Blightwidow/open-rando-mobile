package fr.dammaretz.trainrando.downloadservice

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

class DownloadForegroundService : Service() {

  companion object {
    const val ACTION_START = "fr.dammaretz.trainrando.downloadservice.START"
    const val ACTION_UPDATE = "fr.dammaretz.trainrando.downloadservice.UPDATE"
    const val ACTION_COMPLETE = "fr.dammaretz.trainrando.downloadservice.COMPLETE"
    const val ACTION_CANCEL = "fr.dammaretz.trainrando.downloadservice.CANCEL"

    const val EXTRA_ID = "id"
    const val EXTRA_TITLE = "title"
    const val EXTRA_PROGRESS = "progress"
    const val EXTRA_PROGRESS_TEXT = "progressText"

    private const val CHANNEL_ID = "downloads"
    private const val CHANNEL_NAME = "Downloads"
  }

  private val titles = mutableMapOf<String, String>()
  private val notificationIds = mutableMapOf<String, Int>()
  private var nextNotificationId = 1001
  private var foregroundId: String? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    ensureChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val action = intent?.action
    val id = intent?.getStringExtra(EXTRA_ID)
    if (id == null) {
      return START_NOT_STICKY
    }

    when (action) {
      ACTION_START -> handleStart(
        id,
        intent.getStringExtra(EXTRA_TITLE) ?: id,
        intent.getStringExtra(EXTRA_PROGRESS_TEXT) ?: "",
      )
      ACTION_UPDATE -> handleUpdate(
        id,
        intent.getIntExtra(EXTRA_PROGRESS, 0),
        intent.getStringExtra(EXTRA_PROGRESS_TEXT) ?: "",
      )
      ACTION_COMPLETE -> handleComplete(
        id,
        intent.getStringExtra(EXTRA_PROGRESS_TEXT) ?: "",
      )
      ACTION_CANCEL -> handleCancel(id)
    }

    return START_NOT_STICKY
  }

  private fun handleStart(id: String, title: String, progressText: String) {
    titles[id] = title
    val notificationId = notificationIds.getOrPut(id) { nextNotificationId++ }
    val notification = buildNotification(title, progressText, 0, ongoing = true)

    if (foregroundId == null) {
      foregroundId = id
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        startForeground(
          notificationId,
          notification,
          android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC,
        )
      } else {
        startForeground(notificationId, notification)
      }
    } else {
      notificationManager().notify(notificationId, notification)
    }
  }

  private fun handleUpdate(id: String, progress: Int, progressText: String) {
    val title = titles[id] ?: return
    val notificationId = notificationIds[id] ?: return
    val notification = buildNotification(title, progressText, progress, ongoing = true)
    notificationManager().notify(notificationId, notification)
  }

  private fun handleComplete(id: String, completeText: String) {
    val title = titles[id] ?: return
    val notificationId = notificationIds[id] ?: return
    val notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(completeText)
      .setSmallIcon(android.R.drawable.stat_sys_download_done)
      .setOnlyAlertOnce(true)
      .setAutoCancel(true)
      .setSilent(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
    notificationManager().notify(notificationId, notification)
    releaseId(id)
  }

  private fun handleCancel(id: String) {
    val notificationId = notificationIds[id]
    if (notificationId != null) {
      notificationManager().cancel(notificationId)
    }
    releaseId(id)
  }

  private fun releaseId(id: String) {
    titles.remove(id)
    notificationIds.remove(id)
    if (id == foregroundId) {
      val next = notificationIds.keys.firstOrNull()
      if (next == null) {
        foregroundId = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
      } else {
        foregroundId = next
      }
    }
  }

  private fun buildNotification(
    title: String,
    progressText: String,
    progress: Int,
    ongoing: Boolean,
  ): Notification {
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(progressText)
      .setSmallIcon(android.R.drawable.stat_sys_download)
      .setOngoing(ongoing)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setProgress(100, progress, false)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        CHANNEL_NAME,
        NotificationManager.IMPORTANCE_LOW,
      ).apply {
        setSound(null, null)
        enableVibration(false)
      }
      notificationManager().createNotificationChannel(channel)
    }
  }

  private fun notificationManager(): NotificationManager {
    return ContextCompat.getSystemService(this, NotificationManager::class.java)!!
  }
}
