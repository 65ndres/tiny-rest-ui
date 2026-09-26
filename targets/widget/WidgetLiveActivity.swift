import ActivityKit
import SwiftUI
import WidgetKit

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

                VStack(spacing: 6) {
                    TimerValue(state: context.state, fontSize: 42)

                    Text(timerLabel(context.attributes.timerType).lowercased())
                        .font(.system(size: 17, weight: .medium))
                        .foregroundStyle(.white.opacity(0.85))
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.horizontal, 16)
                .offset(y: -6)
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
                Image(systemName: "moon.stars.fill")
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
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity, alignment: .center)
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
