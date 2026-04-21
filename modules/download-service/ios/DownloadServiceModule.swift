import ExpoModulesCore

public class DownloadServiceModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DownloadService")

    AsyncFunction("startDownloadNotification") { (_: String, _: String, _: String) in
      // No-op on iOS — downloads run foreground-only.
    }

    AsyncFunction("updateDownloadProgress") { (_: String, _: Double, _: String) in
      // No-op on iOS.
    }

    AsyncFunction("completeDownloadNotification") { (_: String, _: String) in
      // No-op on iOS.
    }

    AsyncFunction("cancelDownloadNotification") { (_: String) in
      // No-op on iOS.
    }
  }
}
