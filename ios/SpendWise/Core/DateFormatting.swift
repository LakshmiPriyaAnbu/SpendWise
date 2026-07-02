import Foundation

/// Single source of truth for every date format the app uses. Views and view
/// models should never construct their own `DateFormatter` — call these
/// instead, so a format change (or future localization) only happens here.
enum AppDate {
    /// The API's day format, e.g. "2026-07-01".
    private static let apiDayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    /// The API's month format, e.g. "2026-07".
    private static let apiMonthFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        return formatter
    }()

    /// Short display form, e.g. "Jul 1".
    private static let shortDayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter
    }()

    /// Long display form, e.g. "Jul 1, 2026".
    private static let longDayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        return formatter
    }()

    /// Month + year display form, e.g. "July 2026".
    private static let monthYearFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter
    }()

    /// The current month in the API's "yyyy-MM" format.
    static var currentMonth: String { apiMonthFormatter.string(from: Date()) }

    /// The current month for display, e.g. "July 2026".
    static var currentMonthLabel: String { monthYearFormatter.string(from: Date()) }

    /// A `Date` formatted as the API's "yyyy-MM-dd" day string.
    static func apiDayString(from date: Date) -> String {
        apiDayFormatter.string(from: date)
    }

    /// "yyyy-MM-dd" → "Jul 1". Returns the input unchanged if it doesn't parse.
    static func shortDay(_ isoDay: String) -> String {
        guard let date = apiDayFormatter.date(from: isoDay) else { return isoDay }
        return shortDayFormatter.string(from: date)
    }

    /// "yyyy-MM-dd" → "Jul 1, 2026". Returns the input unchanged if it doesn't parse.
    static func longDay(_ isoDay: String) -> String {
        guard let date = apiDayFormatter.date(from: isoDay) else { return isoDay }
        return longDayFormatter.string(from: date)
    }
}
