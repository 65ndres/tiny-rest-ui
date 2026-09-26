import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

private let liveActivityAppGroupId = "group.com.afre92.tinyrest"

struct TinyRestTimerAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var startTime: Date
        var isPaused: Bool
        var pausedElapsed: TimeInterval
    }

    var timerType: String
}

struct WidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TinyRestTimerAttributes.self) { context in
            ZStack {
                GeometryReader { geometry in
                    Image("bg-widget")
                        .resizable()
                        .frame(
                            width: 440,
                            height: 140
                        )
                        .clipped()
                }

                VStack(spacing: 8) {
                    Text(timerLabel(context.attributes.timerType).lowercased())
                        .font(.system(size: 17, weight: .medium))
                        .foregroundStyle(.white.opacity(0.85))
                        .lineLimit(1)

                    TimerValue(state: context.state, fontSize: 42)

                    if context.state.isPaused {
                        Text("paused")
                            .font(.system(size: 14, weight: .regular))
                            .foregroundStyle(.white.opacity(0.7))
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.horizontal, 72)

                Button(intent: ToggleTinyRestTimerIntent()) {
                    Image(systemName: context.state.isPaused ? "play.fill" : "pause.fill")
                        .font(.system(size: 22, weight: .bold))
                        .frame(width: 58, height: 58)
                }
                .buttonStyle(.borderedProminent)
                .tint(.white.opacity(0.2))
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)
                .padding(.trailing, 16)
                .accessibilityLabel(context.state.isPaused ? "Resume timer" : "Pause timer")
            }
            // iOS caps Lock Screen Live Activities at roughly 160 points.
            .frame(maxWidth: .infinity, minHeight: 140)
            .clipped()
            .activityBackgroundTint(
                Color(red: 0.388, green: 0.282, blue: 0.545)
            )
            .activitySystemActionForegroundColor(.white)
            .widgetURL(URL(string: "tinyrest://"))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label("TinyRest", systemImage: "moon.stars.fill")
                        .font(.caption.weight(.semibold))
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Button(intent: ToggleTinyRestTimerIntent()) {
                        Image(systemName: context.state.isPaused ? "play.fill" : "pause.fill")
                    }
                    .buttonStyle(.bordered)
                    .tint(.white)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 3) {
                        TimerValue(state: context.state, fontSize: 32)
                        Text(timerLabel(context.attributes.timerType))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            } compactLeading: {
                Image(systemName: "moon.stars.fill")
                    .foregroundStyle(Color(red: 0.55, green: 0.76, blue: 0.86))
            } compactTrailing: {
                TimerValue(state: context.state, fontSize: 15)
            } minimal: {
                Image(systemName: context.state.isPaused ? "pause.fill" : "moon.stars.fill")
                    .foregroundStyle(Color(red: 0.55, green: 0.76, blue: 0.86))
            }
            .widgetURL(URL(string: "tinyrest://"))
            .keylineTint(Color(red: 0.55, green: 0.76, blue: 0.86))
        }
        .contentMarginsDisabled()
    }
}

private struct TimerValue: View {
    let state: TinyRestTimerAttributes.ContentState
    let fontSize: CGFloat

    var body: some View {
        Group {
            if state.isPaused {
                Text(formatElapsedForDisplay(state.pausedElapsed))
            } else {
                Text(
                    timerInterval: state.startTime...Date.distantFuture,
                    countsDown: false,
                    showsHours: true
                )
            }
        }
        .font(.system(size: fontSize, weight: .regular, design: .monospaced))
        .monospacedDigit()
        .foregroundStyle(.white)
        .lineLimit(1)
        .minimumScaleFactor(0.65)
    }
}

private func timerLabel(_ type: String) -> String {
    switch type {
    case "nursing_left":
        return "Nursing left"
    case "nursing_right":
        return "Nursing right"
    case "bottle":
        return "Bottle feeding"
    case "sleeping":
        return "Sleep timer"
    default:
        return type.replacingOccurrences(of: "_", with: " ").capitalized
    }
}

private func formatElapsedForDisplay(_ interval: TimeInterval) -> String {
    let total = max(0, Int(interval.rounded(.down)))
    let hours = total / 3600
    let minutes = (total % 3600) / 60
    let seconds = total % 60
    if hours == 0 {
        return String(format: "%d:%02d", minutes, seconds)
    }
    return String(format: "%d:%02d:%02d", hours, minutes, seconds)
}

private func formatElapsedForStorage(_ interval: TimeInterval) -> String {
    let total = max(0, Int(interval.rounded(.down)))
    return String(
        format: "%02d:%02d:%02d",
        total / 3600,
        (total % 3600) / 60,
        total % 60
    )
}

struct ToggleTinyRestTimerIntent: LiveActivityIntent {
    static let title: LocalizedStringResource = "Pause or resume TinyRest timer"
    static let description = IntentDescription("Pauses or resumes the active TinyRest timer.")
    static let openAppWhenRun = false

    func perform() async throws -> some IntentResult {
        guard let activity = Activity<TinyRestTimerAttributes>.activities.first else {
            return .result()
        }

        let current = activity.content.state
        let now = Date()
        let nextPaused = !current.isPaused
        let nextElapsed = nextPaused
            ? max(0, now.timeIntervalSince(current.startTime))
            : current.pausedElapsed
        let nextState = TinyRestTimerAttributes.ContentState(
            startTime: current.startTime,
            isPaused: nextPaused,
            pausedElapsed: nextElapsed
        )

        let defaults = UserDefaults(suiteName: liveActivityAppGroupId)
        defaults?.set(nextPaused ? 1 : 0, forKey: "widget.timerPaused")
        if nextPaused {
            defaults?.set(formatElapsedForStorage(nextElapsed), forKey: "widget.timerElapsed")
            defaults?.set("paused", forKey: "widget.subtitle")
        } else {
            defaults?.removeObject(forKey: "widget.timerElapsed")
            defaults?.removeObject(forKey: "widget.subtitle")
        }

        await activity.update(ActivityContent(state: nextState, staleDate: nil))
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

#Preview("Running", as: .content, using: TinyRestTimerAttributes(timerType: "sleeping")) {
    WidgetLiveActivity()
} contentStates: {
    TinyRestTimerAttributes.ContentState(
        startTime: Date().addingTimeInterval(-3725),
        isPaused: false,
        pausedElapsed: 0
    )
    TinyRestTimerAttributes.ContentState(
        startTime: Date().addingTimeInterval(-3725),
        isPaused: true,
        pausedElapsed: 3725
    )
}
