import WidgetKit
import SwiftUI

@main
struct exportWidgets: WidgetBundle {
    var body: some Widget {
        // Only the home-screen widget. Extra ControlWidget / Live Activity
        // entries hide iOS 18's long-press app-icon widget options.
        widget()
    }
}
