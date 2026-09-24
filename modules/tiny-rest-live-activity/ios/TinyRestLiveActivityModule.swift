import ActivityKit
import ExpoModulesCore

struct TinyRestTimerAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var startTime: Date
    var isPaused: Bool
    var pausedElapsed: TimeInterval
  }

  var timerType: String
}

public final class TinyRestLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TinyRestLiveActivity")

    AsyncFunction("sync") {
      (
        startTimeString: String,
        timerType: String,
        isPaused: Bool,
        elapsedSeconds: Double
      ) async throws -> Bool in
      guard #available(iOS 16.2, *) else {
        return false
      }
      guard ActivityAuthorizationInfo().areActivitiesEnabled else {
        return false
      }
      guard let startTime = Self.parseDate(startTimeString) else {
        throw InvalidLiveActivityDateException()
      }

      let state = TinyRestTimerAttributes.ContentState(
        startTime: startTime,
        isPaused: isPaused,
        pausedElapsed: max(0, elapsedSeconds)
      )
      let content = ActivityContent(state: state, staleDate: nil)
      let activities = Activity<TinyRestTimerAttributes>.activities

      if let current = activities.first(where: {
        $0.attributes.timerType == timerType
      }) {
        await current.update(content)
        for activity in activities where activity.id != current.id {
          await activity.end(content, dismissalPolicy: .immediate)
        }
        return true
      }

      for activity in activities {
        await activity.end(content, dismissalPolicy: .immediate)
      }

      _ = try Activity<TinyRestTimerAttributes>.request(
        attributes: TinyRestTimerAttributes(timerType: timerType),
        content: content,
        pushType: nil
      )
      return true
    }

    AsyncFunction("end") { () async in
      guard #available(iOS 16.2, *) else {
        return
      }

      for activity in Activity<TinyRestTimerAttributes>.activities {
        await activity.end(activity.content, dismissalPolicy: .immediate)
      }
    }
  }

  private static func parseDate(_ value: String) -> Date? {
    let fractional = ISO8601DateFormatter()
    fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let date = fractional.date(from: value) {
      return date
    }

    let basic = ISO8601DateFormatter()
    basic.formatOptions = [.withInternetDateTime]
    return basic.date(from: value)
  }
}

private final class InvalidLiveActivityDateException: Exception {
  override var reason: String {
    "The timer start time is not a valid ISO-8601 date."
  }
}
