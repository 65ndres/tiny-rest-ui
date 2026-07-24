import WidgetKit
import SwiftUI

private let appGroupId = "group.com.afre92.tinyrest"

enum WidgetMode: String {
    case prediction
    case timer
}

struct WidgetPayload {
    var mode: WidgetMode
    var label: String
    var value: String
    var subtitle: String?
    var timerType: String?
    var timerStart: Date?
    var timerPaused: Bool
    var timerElapsed: String?

    static let placeholder = WidgetPayload(
        mode: .prediction,
        label: "next nap",
        value: "--:--",
        subtitle: nil,
        timerType: nil,
        timerStart: nil,
        timerPaused: false,
        timerElapsed: nil
    )

    static func load(from defaults: UserDefaults?) -> WidgetPayload {
        guard let defaults else { return .placeholder }

        let modeRaw = defaults.string(forKey: "widget.mode") ?? WidgetMode.prediction.rawValue
        let mode = WidgetMode(rawValue: modeRaw) ?? .prediction

        if mode == .timer {
            let timerType = defaults.string(forKey: "widget.timerType") ?? "sleeping"
            let startString = defaults.string(forKey: "widget.timerStart")
            let start = startString.flatMap { ISO8601DateParser.parse($0) }
            let paused = defaults.integer(forKey: "widget.timerPaused") == 1
            let elapsed = defaults.string(forKey: "widget.timerElapsed")
            let subtitle = defaults.string(forKey: "widget.subtitle")
            return WidgetPayload(
                mode: .timer,
                label: timerTypeLabel(timerType),
                value: elapsed ?? "",
                subtitle: paused ? (subtitle ?? "paused") : nil,
                timerType: timerType,
                timerStart: start,
                timerPaused: paused,
                timerElapsed: elapsed
            )
        }

        return WidgetPayload(
            mode: .prediction,
            label: defaults.string(forKey: "widget.label") ?? "next nap",
            value: defaults.string(forKey: "widget.value") ?? "--:--",
            subtitle: defaults.string(forKey: "widget.subtitle"),
            timerType: nil,
            timerStart: nil,
            timerPaused: false,
            timerElapsed: nil
        )
    }
}

private func timerTypeLabel(_ type: String) -> String {
    switch type {
    case "nursing_left":
        return "nursing left"
    case "nursing_right":
        return "nursing right"
    case "bottle":
        return "bottle"
    case "sleeping":
        return "sleeping"
    default:
        return type.replacingOccurrences(of: "_", with: " ")
    }
}

private enum ISO8601DateParser {
    static func parse(_ string: String) -> Date? {
        let withFractional = ISO8601DateFormatter()
        withFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = withFractional.date(from: string) {
            return date
        }

        let basic = ISO8601DateFormatter()
        basic.formatOptions = [.withInternetDateTime]
        return basic.date(from: string)
    }
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), payload: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        let defaults = UserDefaults(suiteName: appGroupId)
        let payload = WidgetPayload.load(from: defaults)
        completion(SimpleEntry(date: Date(), payload: payload))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> Void) {
        let defaults = UserDefaults(suiteName: appGroupId)
        let payload = WidgetPayload.load(from: defaults)
        let entry = SimpleEntry(date: Date(), payload: payload)

        let nextUpdate: Date
        if payload.mode == .timer && !payload.timerPaused {
            nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
        } else {
            nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date().addingTimeInterval(3600)
        }

        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let payload: WidgetPayload
}

struct widgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .center, spacing: 8) {
            Text(entry.payload.label)
                .font(.system(size: 17, weight: .medium))
                .foregroundStyle(.white.opacity(0.85))
                .multilineTextAlignment(.center)
                .lineLimit(1)

            Group {
                if entry.payload.mode == .timer {
                    if entry.payload.timerPaused {
                        Text(entry.payload.timerElapsed ?? entry.payload.value)
                            .font(.system(size: 42, weight: .regular, design: .monospaced))
                            .foregroundStyle(.white)
                            .minimumScaleFactor(0.5)
                            .lineLimit(1)
                            .multilineTextAlignment(.center)
                    } else if let start = entry.payload.timerStart {
                        Text(start, style: .timer)
                            .font(.system(size: 42, weight: .regular, design: .monospaced))
                            .foregroundStyle(.white)
                            .minimumScaleFactor(0.5)
                            .lineLimit(1)
                            .monospacedDigit()
                            .multilineTextAlignment(.center)
                    } else {
                        Text("--:--:--")
                            .font(.system(size: 42, weight: .regular, design: .monospaced))
                            .foregroundStyle(.white)
                            .minimumScaleFactor(0.5)
                            .lineLimit(1)
                            .multilineTextAlignment(.center)
                    }
                } else {
                    Text(entry.payload.value)
                        .font(.system(size: 42, weight: .regular, design: .monospaced))
                        .foregroundStyle(.white)
                        .minimumScaleFactor(0.5)
                        .lineLimit(1)
                        .multilineTextAlignment(.center)
                }
            }

            if let subtitle = entry.payload.subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(.white.opacity(0.7))
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .padding(.horizontal, 6)
        .padding(.vertical, 4)
    }
}

struct widget: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            widgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    ZStack {
                        Image("bg-widget")
                            .resizable()
                            .scaledToFill()
                    }
                }
        }
        .configurationDisplayName("TinyRest")
        .description("Next nap or active timer.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

#Preview(as: .systemSmall) {
    widget()
} timeline: {
    SimpleEntry(date: .now, payload: .placeholder)
    SimpleEntry(
        date: .now,
        payload: WidgetPayload(
            mode: .prediction,
            label: "next nap",
            value: "3:45 PM",
            subtitle: nil,
            timerType: nil,
            timerStart: nil,
            timerPaused: false,
            timerElapsed: nil
        )
    )
    SimpleEntry(
        date: .now,
        payload: WidgetPayload(
            mode: .timer,
            label: "sleeping",
            value: "",
            subtitle: nil,
            timerType: "sleeping",
            timerStart: Date().addingTimeInterval(-125),
            timerPaused: false,
            timerElapsed: nil
        )
    )
    SimpleEntry(
        date: .now,
        payload: WidgetPayload(
            mode: .timer,
            label: "sleeping",
            value: "00:02:05",
            subtitle: "paused",
            timerType: "sleeping",
            timerStart: Date().addingTimeInterval(-125),
            timerPaused: true,
            timerElapsed: "00:02:05"
        )
    )
}
