import ExpoModulesCore
import UIKit

/**
 Limits how far the iOS Larger Text setting can enlarge text in native screens,
 such as the RevenueCat paywall. React Native text has its own limit
 (MAX_FONT_SCALE in app/constants/screenLayout.ts); "Extra Large" is the
 closest system step to it (about +12% on body text).

 Uses window trait overrides, which need iOS 17. On iOS 16 native screens
 still follow the full system setting.
 */
public class TextSizeCapAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  private static let maxContentSize: UIContentSizeCategory = .extraLarge
  private var observers: [NSObjectProtocol] = []

  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let center = NotificationCenter.default
    // Windows come from scenes, so apply whenever a scene or window appears,
    // and again when the user changes the system text size.
    for name in [
      UIScene.didActivateNotification,
      UIWindow.didBecomeVisibleNotification,
      UIContentSizeCategory.didChangeNotification,
    ] {
      observers.append(
        center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
          self?.applyCap()
        }
      )
    }
    return true
  }

  private func applyCap() {
    guard #available(iOS 17.0, *) else { return }

    // The app-level value is the user's setting and ignores window overrides.
    // Accessibility sizes compare as larger than every standard size.
    let shouldCap =
      UIApplication.shared.preferredContentSizeCategory > Self.maxContentSize

    for scene in UIApplication.shared.connectedScenes {
      guard let windowScene = scene as? UIWindowScene else { continue }
      for window in windowScene.windows {
        if shouldCap {
          window.traitOverrides.preferredContentSizeCategory = Self.maxContentSize
        } else if window.traitOverrides.contains(UITraitPreferredContentSizeCategory.self) {
          window.traitOverrides.remove(UITraitPreferredContentSizeCategory.self)
        }
      }
    }
  }
}
