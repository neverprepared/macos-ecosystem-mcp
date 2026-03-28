@preconcurrency import EventKit
import CoreLocation
import MCP
import Foundation

// MARK: - EventKitManager actor

/// Actor that owns a single EKEventStore and serialises all EventKit access.
/// Using an actor guarantees EKEventStore is never accessed concurrently, which
/// matches Apple's requirement that it must not be used across threads simultaneously.
actor EventKitManager {

    // nonisolated(unsafe) lets us reference the store in @Sendable closures (fetchReminders
    // callback) while the actor serialises every method call that touches it.
    nonisolated(unsafe) private let store = EKEventStore()

    // MARK: Permissions

    func requestPermissions() async {
        do {
            if #available(macOS 14.0, *) {
                try await store.requestFullAccessToReminders()
                try await store.requestFullAccessToEvents()
            } else {
                // macOS 13 – use the old completion-handler API
                _ = try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Bool, Error>) in
                    self.store.requestAccess(to: .reminder) { granted, error in
                        if let error { cont.resume(throwing: error) }
                        else { cont.resume(returning: granted) }
                    }
                }
                _ = try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Bool, Error>) in
                    self.store.requestAccess(to: .event) { granted, error in
                        if let error { cont.resume(throwing: error) }
                        else { cont.resume(returning: granted) }
                    }
                }
            }
            log("EventKit permissions granted")
        } catch {
            log("EventKit permission warning: \(error.localizedDescription)")
        }
    }

    // MARK: - Reminder Lists

    func listReminderLists(args: [String: Value]) async throws -> String {
        let lists = store.calendars(for: .reminder)
        guard !lists.isEmpty else { return "No reminder lists found." }
        var out = "Reminder lists (\(lists.count)):\n\n"
        for list in lists.sorted(by: { $0.title < $1.title }) {
            out += "• \(list.title)\n"
            out += "  ID: \(list.calendarIdentifier)\n\n"
        }
        return out
    }

    func createReminderList(args: [String: Value]) async throws -> String {
        guard let title = args["title"]?.stringValue, !title.isEmpty else {
            throw ekError("'title' is required")
        }
        let newCal = EKCalendar(for: .reminder, eventStore: store)
        newCal.title = title
        guard let source = store.defaultCalendarForNewReminders()?.source else {
            throw ekError("Could not determine source for new list")
        }
        newCal.source = source
        try store.saveCalendar(newCal, commit: true)
        return "✓ Created reminder list \"\(title)\"\n  ID: \(newCal.calendarIdentifier)"
    }

    func deleteReminderList(args: [String: Value]) async throws -> String {
        let listId   = args["listId"]?.stringValue
        let titleArg = args["title"]?.stringValue
        guard listId != nil || titleArg != nil else {
            throw ekError("Either 'listId' or 'title' must be provided")
        }

        let list: EKCalendar
        if let lid = listId {
            guard let cal = store.calendar(withIdentifier: lid),
                  cal.allowedEntityTypes.contains(.reminder) else {
                throw ekError("No reminder list found with ID: \(lid)")
            }
            list = cal
        } else {
            let all = store.calendars(for: .reminder)
            guard let cal = all.first(where: { $0.title == titleArg }) else {
                throw ekError("No reminder list found with title: \"\(titleArg!)\"")
            }
            list = cal
        }
        let title = list.title
        try store.removeCalendar(list, commit: true)
        return "✓ Deleted reminder list \"\(title)\" and all its reminders"
    }

    // MARK: - Reminders

    func listReminders(args: [String: Value]) async throws -> String {
        let listName      = args["list"]?.stringValue
        let inclCompleted = args["includeCompleted"]?.boolValue ?? false
        let limit         = args["limit"].asInt ?? 50
        let offset        = args["offset"].asInt ?? 0

        let targetLists = try reminderCalendars(named: listName)

        let predicate: NSPredicate = inclCompleted
            ? store.predicateForReminders(in: targetLists)
            : store.predicateForIncompleteReminders(
                withDueDateStarting: nil, ending: nil, calendars: targetLists)

        let reminders = await fetchReminders(matching: predicate)
        let paged     = Array(reminders.dropFirst(offset).prefix(limit))

        guard !paged.isEmpty else { return "No reminders found." }

        var out = "Found \(paged.count) reminder(s) (offset \(offset), total \(reminders.count)):\n\n"
        for r in paged {
            out += formatReminderSummary(r)
        }
        return out
    }

    func addReminder(args: [String: Value]) async throws -> String {
        guard let title = args["title"]?.stringValue, !title.isEmpty else {
            throw ekError("'title' is required")
        }
        let listName    = args["list"]?.stringValue ?? "Reminders"
        let noteText    = args["notes"]?.stringValue
        let dueDateStr  = args["dueDate"]?.stringValue
        let priorityStr = args["priority"]?.stringValue ?? "none"
        let urlStr      = args["url"]?.stringValue

        let reminder = EKReminder(eventStore: store)
        reminder.title    = title
        reminder.notes    = noteText
        reminder.priority = priorityValue(priorityStr)

        // Assign to list
        let lists = store.calendars(for: .reminder).filter { $0.title == listName }
        if let list = lists.first {
            reminder.calendar = list
        } else if let def = store.defaultCalendarForNewReminders() {
            reminder.calendar = def
        } else {
            throw ekError("Could not find or create a reminder list")
        }

        // Due date
        if let ds = dueDateStr, let date = parseISO8601(ds) {
            var components = Calendar.current.dateComponents(
                [.year, .month, .day, .hour, .minute, .second], from: date)
            components.timeZone = TimeZone.current
            reminder.dueDateComponents = components
        }

        // URL
        if let us = urlStr, !us.isEmpty, let url = URL(string: us) {
            reminder.url = url
        }

        // Time-based alarms (minutes before due date)
        if let alarmMins = args["alarms"]?.arrayValue?.compactMap({ $0.asInt }) {
            for mins in alarmMins {
                reminder.addAlarm(EKAlarm(relativeOffset: -Double(mins) * 60))
            }
        }

        // Recurrence
        if let freqStr = args["recurrenceFrequency"]?.stringValue {
            let interval    = args["recurrenceInterval"].asInt ?? 1
            let endDateStr  = args["recurrenceEndDate"]?.stringValue
            let occurrences = args["recurrenceOccurrences"].asInt
            if let rule = buildRecurrenceRule(frequency: freqStr, interval: interval,
                                              endDate: endDateStr, occurrences: occurrences) {
                reminder.recurrenceRules = [rule]
            }
        }

        // Location alarm
        if let locName = args["locationName"]?.stringValue, !locName.isEmpty {
            let lat       = args["locationLatitude"].asDouble
            let lon       = args["locationLongitude"].asDouble
            let radius    = args["locationRadius"].asDouble ?? 100
            let proximity = args["locationProximity"]?.stringValue ?? "arrive"
            reminder.addAlarm(buildLocationAlarm(name: locName, latitude: lat,
                                                 longitude: lon, radius: radius,
                                                 proximity: proximity))
        }

        try store.save(reminder, commit: true)

        let listTitle = reminder.calendar?.title ?? listName
        return "✓ Created reminder \"\(title)\" in list \"\(listTitle)\"\n  ID: \(reminder.calendarItemIdentifier)"
    }

    func completeReminder(args: [String: Value]) async throws -> String {
        let reminderId = args["reminderId"]?.stringValue
        let titleArg   = args["title"]?.stringValue
        let listArg    = args["list"]?.stringValue

        guard reminderId != nil || titleArg != nil else {
            throw ekError("Either 'reminderId' or 'title' must be provided")
        }

        // Look up by ID
        if let rid = reminderId {
            guard let item = store.calendarItem(withIdentifier: rid) as? EKReminder else {
                throw ekError("No reminder found with ID: \(rid)")
            }
            item.isCompleted    = true
            item.completionDate = Date()
            try store.save(item, commit: true)
            return "✓ Completed: \"\(item.title ?? rid)\""
        }

        // Look up by title
        let title  = titleArg!
        let lists  = try reminderCalendars(named: listArg)
        let pred   = store.predicateForIncompleteReminders(
            withDueDateStarting: nil, ending: nil, calendars: lists)
        let all    = await fetchReminders(matching: pred)
        let match  = all.first { $0.title == title }
        guard let reminder = match else {
            throw ekError("No incomplete reminder found with title: \"\(title)\"")
        }
        reminder.isCompleted    = true
        reminder.completionDate = Date()
        try store.save(reminder, commit: true)
        return "✓ Completed: \"\(reminder.title ?? title)\" in \"\(reminder.calendar?.title ?? "?")\""
    }

    func uncompleteReminder(args: [String: Value]) async throws -> String {
        let reminderId = args["reminderId"]?.stringValue
        let titleArg   = args["title"]?.stringValue
        let listArg    = args["list"]?.stringValue

        guard reminderId != nil || titleArg != nil else {
            throw ekError("Either 'reminderId' or 'title' must be provided")
        }

        if let rid = reminderId {
            guard let item = store.calendarItem(withIdentifier: rid) as? EKReminder else {
                throw ekError("No reminder found with ID: \(rid)")
            }
            item.isCompleted    = false
            item.completionDate = nil
            try store.save(item, commit: true)
            return "✓ Uncompleted: \"\(item.title ?? rid)\""
        }

        let title = titleArg!
        let lists = try reminderCalendars(named: listArg)
        let pred  = store.predicateForReminders(in: lists)
        let all   = await fetchReminders(matching: pred)
        guard let reminder = all.first(where: { $0.title == title && $0.isCompleted }) else {
            throw ekError("No completed reminder found with title: \"\(title)\"")
        }
        reminder.isCompleted    = false
        reminder.completionDate = nil
        try store.save(reminder, commit: true)
        return "✓ Uncompleted: \"\(reminder.title ?? title)\" in \"\(reminder.calendar?.title ?? "?")\""
    }

    func getReminder(args: [String: Value]) async throws -> String {
        guard let reminderId = args["reminderId"]?.stringValue, !reminderId.isEmpty else {
            throw ekError("'reminderId' is required")
        }
        guard let item = store.calendarItem(withIdentifier: reminderId) as? EKReminder else {
            throw ekError("No reminder found with ID: \(reminderId)")
        }
        return formatReminderSummary(item)
    }

    func updateReminder(args: [String: Value]) async throws -> String {
        let reminderId = args["reminderId"]?.stringValue
        let titleArg   = args["title"]?.stringValue
        let listArg    = args["list"]?.stringValue

        guard reminderId != nil || titleArg != nil else {
            throw ekError("Either 'reminderId' or 'title' must be provided")
        }

        let reminder: EKReminder
        if let rid = reminderId {
            guard let item = store.calendarItem(withIdentifier: rid) as? EKReminder else {
                throw ekError("No reminder found with ID: \(rid)")
            }
            reminder = item
        } else {
            let lists = try reminderCalendars(named: listArg)
            let pred  = store.predicateForReminders(in: lists)
            let all   = await fetchReminders(matching: pred)
            guard let match = all.first(where: { $0.title == titleArg }) else {
                throw ekError("No reminder found with title: \"\(titleArg!)\"")
            }
            reminder = match
        }

        // Basic fields
        if let newTitle = args["newTitle"]?.stringValue, !newTitle.isEmpty {
            reminder.title = newTitle
        }
        if let notes = args["notes"]?.stringValue {
            reminder.notes = notes
        }
        if let priorityStr = args["priority"]?.stringValue {
            reminder.priority = priorityValue(priorityStr)
        }
        if let dueDateStr = args["dueDate"]?.stringValue {
            if dueDateStr == "" {
                reminder.dueDateComponents = nil
            } else if let date = parseISO8601(dueDateStr) {
                var components = Calendar.current.dateComponents(
                    [.year, .month, .day, .hour, .minute, .second], from: date)
                components.timeZone = TimeZone.current
                reminder.dueDateComponents = components
            }
        }
        if let newList = args["newList"]?.stringValue {
            let lists = store.calendars(for: .reminder).filter { $0.title == newList }
            if let list = lists.first { reminder.calendar = list }
        }

        // URL
        if let urlStr = args["url"]?.stringValue {
            reminder.url = urlStr.isEmpty ? nil : URL(string: urlStr)
        }

        // Time-based alarms — replace existing non-location alarms
        if let alarmMins = args["alarms"]?.arrayValue {
            let locAlarms = reminder.alarms?.filter { $0.structuredLocation != nil } ?? []
            reminder.alarms = locAlarms.isEmpty ? nil : locAlarms
            for mins in alarmMins.compactMap({ $0.asInt }) {
                reminder.addAlarm(EKAlarm(relativeOffset: -Double(mins) * 60))
            }
        } else if args["clearAlarms"]?.boolValue == true {
            let locAlarms = reminder.alarms?.filter { $0.structuredLocation != nil } ?? []
            reminder.alarms = locAlarms.isEmpty ? nil : locAlarms
        }

        // Recurrence
        if let freqStr = args["recurrenceFrequency"]?.stringValue {
            let interval    = args["recurrenceInterval"].asInt ?? 1
            let endDateStr  = args["recurrenceEndDate"]?.stringValue
            let occurrences = args["recurrenceOccurrences"].asInt
            if let rule = buildRecurrenceRule(frequency: freqStr, interval: interval,
                                              endDate: endDateStr, occurrences: occurrences) {
                reminder.recurrenceRules = [rule]
            }
        } else if args["clearRecurrence"]?.boolValue == true {
            reminder.recurrenceRules = nil
        }

        // Location alarm — replace existing location alarms
        if let locName = args["locationName"]?.stringValue {
            let timeAlarms = reminder.alarms?.filter { $0.structuredLocation == nil } ?? []
            reminder.alarms = timeAlarms.isEmpty ? nil : timeAlarms
            if !locName.isEmpty {
                let lat       = args["locationLatitude"].asDouble
                let lon       = args["locationLongitude"].asDouble
                let radius    = args["locationRadius"].asDouble ?? 100
                let proximity = args["locationProximity"]?.stringValue ?? "arrive"
                reminder.addAlarm(buildLocationAlarm(name: locName, latitude: lat,
                                                     longitude: lon, radius: radius,
                                                     proximity: proximity))
            }
        } else if args["clearLocationAlarm"]?.boolValue == true {
            let timeAlarms = reminder.alarms?.filter { $0.structuredLocation == nil } ?? []
            reminder.alarms = timeAlarms.isEmpty ? nil : timeAlarms
        }

        try store.save(reminder, commit: true)
        return "✓ Updated reminder \"\(reminder.title ?? "?")\"\n  ID: \(reminder.calendarItemIdentifier)"
    }

    func deleteReminder(args: [String: Value]) async throws -> String {
        let reminderId = args["reminderId"]?.stringValue
        let titleArg   = args["title"]?.stringValue
        let listArg    = args["list"]?.stringValue

        guard reminderId != nil || titleArg != nil else {
            throw ekError("Either 'reminderId' or 'title' must be provided")
        }

        if let rid = reminderId {
            guard let item = store.calendarItem(withIdentifier: rid) as? EKReminder else {
                throw ekError("No reminder found with ID: \(rid)")
            }
            let title = item.title ?? rid
            try store.remove(item, commit: true)
            return "✓ Deleted reminder \"\(title)\""
        }

        let lists = try reminderCalendars(named: listArg)
        let pred  = store.predicateForReminders(in: lists)
        let all   = await fetchReminders(matching: pred)
        guard let reminder = all.first(where: { $0.title == titleArg }) else {
            throw ekError("No reminder found with title: \"\(titleArg!)\"")
        }
        let title = reminder.title ?? titleArg!
        try store.remove(reminder, commit: true)
        return "✓ Deleted reminder \"\(title)\""
    }

    func searchReminders(args: [String: Value]) async throws -> String {
        guard let query = args["query"]?.stringValue, !query.isEmpty else {
            throw ekError("'query' is required")
        }
        let inclCompleted = args["includeCompleted"]?.boolValue ?? false
        let limit         = args["limit"].asInt ?? 20
        let listArg       = args["list"]?.stringValue

        let lists   = try reminderCalendars(named: listArg)
        let pred    = inclCompleted
            ? store.predicateForReminders(in: lists)
            : store.predicateForIncompleteReminders(
                withDueDateStarting: nil, ending: nil, calendars: lists)
        let all     = await fetchReminders(matching: pred)
        let q       = query.lowercased()
        let matches = all.filter {
            ($0.title?.lowercased().contains(q) ?? false) ||
            ($0.notes?.lowercased().contains(q) ?? false)
        }
        let limited = Array(matches.prefix(limit))

        guard !limited.isEmpty else {
            return "No reminders matching \"\(query)\"."
        }

        var out = "Found \(limited.count) reminder(s) matching \"\(query)\":\n\n"
        for r in limited {
            out += formatReminderSummary(r)
        }
        return out
    }

    // MARK: - Calendar Calendars

    func listCalendars(args: [String: Value]) async throws -> String {
        let calendars = store.calendars(for: .event)
        guard !calendars.isEmpty else { return "No calendars found." }
        var out = "Calendars (\(calendars.count)):\n\n"
        for cal in calendars.sorted(by: { $0.title < $1.title }) {
            let typeLabel: String
            switch cal.type {
            case .local:        typeLabel = "Local"
            case .calDAV:       typeLabel = "iCloud / CalDAV"
            case .exchange:     typeLabel = "Exchange"
            case .subscription: typeLabel = "Subscription"
            case .birthday:     typeLabel = "Birthday"
            @unknown default:   typeLabel = "Unknown"
            }
            out += "• \(cal.title) [\(typeLabel)]\n"
            if let src = cal.source?.title, !src.isEmpty { out += "  Source: \(src)\n" }
            out += "  ID: \(cal.calendarIdentifier)\n\n"
        }
        return out
    }

    // MARK: - Calendar Events

    func listEvents(args: [String: Value]) async throws -> String {
        guard let startStr = args["startDate"]?.stringValue,
              let endStr   = args["endDate"]?.stringValue,
              let startDate = parseISO8601(startStr),
              let endDate   = parseISO8601(endStr) else {
            throw ekError("'startDate' and 'endDate' are required (ISO 8601)")
        }
        let limit      = args["limit"].asInt ?? 50
        let calName    = args["calendar"]?.stringValue
        let calendars  = eventCalendars(named: calName)

        let pred   = store.predicateForEvents(withStart: startDate, end: endDate, calendars: calendars)
        let events = store.events(matching: pred)
            .sorted { ($0.startDate ?? .distantPast) < ($1.startDate ?? .distantPast) }
        let limited = Array(events.prefix(limit))

        guard !limited.isEmpty else {
            return "No events found between \(startStr) and \(endStr)."
        }

        var out = "Found \(limited.count) event(s):\n\n"
        for ev in limited {
            out += "• \(ev.title ?? "(no title)")"
            if ev.isAllDay { out += " [all-day]" }
            if let s = ev.startDate { out += "\n  Start: \(formatDateTime(s))" }
            if let e = ev.endDate   { out += "\n  End:   \(formatDateTime(e))" }
            out += "\n  Calendar: \(ev.calendar?.title ?? "Unknown")"
            if let loc = ev.location, !loc.isEmpty { out += "\n  Location: \(loc)" }
            if let notes = ev.notes, !notes.isEmpty { out += "\n  Notes: \(notes)" }
            if let eid = ev.eventIdentifier { out += "\n  ID: \(eid)" }
            out += "\n\n"
        }
        return out
    }

    func createEvent(args: [String: Value]) async throws -> String {
        guard let title    = args["title"]?.stringValue, !title.isEmpty else {
            throw ekError("'title' is required")
        }
        guard let startStr = args["startDate"]?.stringValue,
              let endStr   = args["endDate"]?.stringValue,
              let startDate = parseISO8601(startStr),
              let endDate   = parseISO8601(endStr) else {
            throw ekError("'startDate' and 'endDate' are required (ISO 8601)")
        }
        guard endDate > startDate else {
            throw ekError("'endDate' must be after 'startDate'")
        }

        let calName   = args["calendar"]?.stringValue ?? "Calendar"
        let location  = args["location"]?.stringValue
        let notes     = args["notes"]?.stringValue
        let allDay    = args["allDay"]?.boolValue ?? false
        let alertMins = args["alerts"]?.arrayValue?.compactMap { $0.asInt } ?? []

        let event       = EKEvent(eventStore: store)
        event.title     = title
        event.startDate = startDate
        event.endDate   = endDate
        event.isAllDay  = allDay
        event.location  = location
        event.notes     = notes

        // Calendar
        let cals = eventCalendars(named: calName)
        if let cal = cals?.first {
            event.calendar = cal
        } else {
            event.calendar = store.defaultCalendarForNewEvents
        }

        // Alarms
        for mins in alertMins {
            event.addAlarm(EKAlarm(relativeOffset: -Double(mins) * 60))
        }

        // Recurrence
        if let freqStr = args["recurrenceFrequency"]?.stringValue {
            let interval    = args["recurrenceInterval"].asInt ?? 1
            let endDateStr  = args["recurrenceEndDate"]?.stringValue
            let occurrences = args["recurrenceOccurrences"].asInt
            if let rule = buildRecurrenceRule(frequency: freqStr, interval: interval,
                                              endDate: endDateStr, occurrences: occurrences) {
                event.addRecurrenceRule(rule)
            }
        }

        try store.save(event, span: .thisEvent, commit: true)

        let calTitle = event.calendar?.title ?? calName
        return "✓ Created event \"\(title)\" on \(formatDateTime(startDate)) in \"\(calTitle)\"\n  ID: \(event.eventIdentifier ?? "unknown")"
    }

    func updateEvent(args: [String: Value]) async throws -> String {
        guard let eid = args["eventId"]?.stringValue else {
            throw ekError("'eventId' is required")
        }
        guard let event = store.event(withIdentifier: eid) else {
            throw ekError("No event found with ID: \(eid)")
        }

        if let title = args["title"]?.stringValue     { event.title    = title }
        if let loc   = args["location"]?.stringValue  { event.location = loc   }
        if let notes = args["notes"]?.stringValue     { event.notes    = notes }
        if let ss    = args["startDate"]?.stringValue, let d = parseISO8601(ss) {
            event.startDate = d
        }
        if let es = args["endDate"]?.stringValue, let d = parseISO8601(es) {
            event.endDate = d
        }

        try store.save(event, span: .thisEvent, commit: true)
        return "✓ Updated event \"\(event.title ?? eid)\""
    }

    func deleteEvent(args: [String: Value]) async throws -> String {
        let eventId  = args["eventId"]?.stringValue
        let titleArg = args["title"]?.stringValue
        let dateArg  = args["date"]?.stringValue

        guard eventId != nil || titleArg != nil else {
            throw ekError("Either 'eventId' or 'title' must be provided")
        }

        // Delete by ID
        if let eid = eventId {
            guard let event = store.event(withIdentifier: eid) else {
                throw ekError("No event found with ID: \(eid)")
            }
            let title = event.title ?? eid
            try store.remove(event, span: .thisEvent, commit: true)
            return "✓ Deleted event \"\(title)\""
        }

        // Delete by title (with optional date filter)
        let searchTitle = titleArg!
        var start: Date
        var end: Date
        if let ds = dateArg, let d = parseISO8601(ds) {
            start = d.addingTimeInterval(-86400)
            end   = d.addingTimeInterval(86400)
        } else {
            start = Date().addingTimeInterval(-365 * 86400)
            end   = Date().addingTimeInterval(2 * 365 * 86400)
        }

        let pred   = store.predicateForEvents(withStart: start, end: end, calendars: nil)
        let events = store.events(matching: pred)
        guard let event = events.first(where: { $0.title == searchTitle }) else {
            throw ekError("No event found with title: \"\(searchTitle)\"")
        }
        let title = event.title ?? searchTitle
        try store.remove(event, span: .thisEvent, commit: true)
        return "✓ Deleted event \"\(title)\""
    }

    func findFreeTime(args: [String: Value]) async throws -> String {
        guard let dateStr = args["date"]?.stringValue,
              let anchorDate = parseISO8601(dateStr) else {
            throw ekError("'date' is required (ISO 8601)")
        }
        guard let duration = args["duration"].asInt, duration > 0 else {
            throw ekError("'duration' is required (minutes)")
        }
        let workStart = args["workingHoursStart"].asInt ?? 9
        let workEnd   = args["workingHoursEnd"].asInt   ?? 17
        guard workEnd > workStart else {
            throw ekError("'workingHoursEnd' must be after 'workingHoursStart'")
        }

        let cal = Calendar.current
        var comps = cal.dateComponents([.year, .month, .day], from: anchorDate)

        comps.hour = workStart; comps.minute = 0; comps.second = 0
        guard let dayBegin = cal.date(from: comps) else {
            throw ekError("Could not construct working-hours start")
        }
        comps.hour = workEnd
        guard let dayEnd = cal.date(from: comps) else {
            throw ekError("Could not construct working-hours end")
        }

        let calName   = args["calendar"]?.stringValue
        let calendars = eventCalendars(named: calName)
        let pred      = store.predicateForEvents(withStart: dayBegin, end: dayEnd, calendars: calendars)
        let events    = store.events(matching: pred)
            .sorted { ($0.startDate ?? .distantPast) < ($1.startDate ?? .distantPast) }

        // Find gaps
        var slots: [(start: Date, end: Date, minutes: Int)] = []
        var cursor = dayBegin

        for ev in events {
            let evStart = ev.startDate ?? cursor
            let gapMins = Int(evStart.timeIntervalSince(cursor) / 60)
            if gapMins >= duration {
                slots.append((cursor, evStart, gapMins))
            }
            if let evEnd = ev.endDate, evEnd > cursor {
                cursor = evEnd
            }
        }
        let finalMins = Int(dayEnd.timeIntervalSince(cursor) / 60)
        if finalMins >= duration {
            slots.append((cursor, dayEnd, finalMins))
        }

        guard !slots.isEmpty else {
            return "No free slot of \(duration) min found on \(dateStr) within \(workStart):00–\(workEnd):00."
        }

        let fmt = DateFormatter()
        fmt.dateFormat = "HH:mm"
        var out = "Free slots on \(dateStr) (≥\(duration) min, \(workStart):00–\(workEnd):00):\n\n"
        for slot in slots {
            out += "• \(fmt.string(from: slot.start)) – \(fmt.string(from: slot.end)) (\(slot.minutes) min)\n"
        }
        return out
    }

    // MARK: - Private helpers

    private func fetchReminders(matching predicate: NSPredicate) async -> [EKReminder] {
        await withCheckedContinuation { continuation in
            self.store.fetchReminders(matching: predicate) { reminders in
                continuation.resume(returning: reminders ?? [])
            }
        }
    }

    /// Returns reminder EKCalendar array. If `name` is nil, returns all reminder calendars.
    /// Throws if a named list is not found.
    private func reminderCalendars(named name: String?) throws -> [EKCalendar] {
        let all = store.calendars(for: .reminder)
        guard let name = name else { return all }
        let filtered = all.filter { $0.title == name }
        if filtered.isEmpty {
            throw ekError("Reminder list '\(name)' not found")
        }
        return filtered
    }

    /// Returns event EKCalendar array or nil (meaning "all calendars").
    private func eventCalendars(named name: String?) -> [EKCalendar]? {
        guard let name = name else { return nil }
        let filtered = store.calendars(for: .event).filter { $0.title == name }
        return filtered.isEmpty ? nil : filtered
    }

    private func buildRecurrenceRule(frequency freqStr: String,
                                     interval: Int,
                                     endDate: String?,
                                     occurrences: Int?) -> EKRecurrenceRule? {
        let freq: EKRecurrenceFrequency
        switch freqStr.lowercased() {
        case "daily":   freq = .daily
        case "weekly":  freq = .weekly
        case "monthly": freq = .monthly
        case "yearly":  freq = .yearly
        default: return nil
        }
        var end: EKRecurrenceEnd?
        if let endDateStr = endDate, let endDate = parseISO8601(endDateStr) {
            end = EKRecurrenceEnd(end: endDate)
        } else if let occ = occurrences, occ > 0 {
            end = EKRecurrenceEnd(occurrenceCount: occ)
        }
        return EKRecurrenceRule(recurrenceWith: freq, interval: max(1, interval), end: end)
    }

    private func buildLocationAlarm(name: String,
                                    latitude: Double?,
                                    longitude: Double?,
                                    radius: Double,
                                    proximity: String) -> EKAlarm {
        let alarm = EKAlarm()
        let loc   = EKStructuredLocation(title: name)
        if let lat = latitude, let lon = longitude {
            loc.geoLocation = CLLocation(latitude: lat, longitude: lon)
        }
        loc.radius         = radius
        alarm.structuredLocation = loc
        alarm.proximity    = proximity.lowercased() == "leave" ? .leave : .enter
        return alarm
    }

    private func formatRecurrenceRule(_ rule: EKRecurrenceRule) -> String {
        var desc: String
        switch rule.frequency {
        case .daily:   desc = rule.interval == 1 ? "Daily"   : "Every \(rule.interval) days"
        case .weekly:  desc = rule.interval == 1 ? "Weekly"  : "Every \(rule.interval) weeks"
        case .monthly: desc = rule.interval == 1 ? "Monthly" : "Every \(rule.interval) months"
        case .yearly:  desc = rule.interval == 1 ? "Yearly"  : "Every \(rule.interval) years"
        @unknown default: desc = "Custom"
        }
        if let end = rule.recurrenceEnd {
            if let endDate = end.endDate {
                desc += " until \(formatDate(endDate))"
            } else if end.occurrenceCount > 0 {
                desc += " for \(end.occurrenceCount) occurrences"
            }
        }
        return desc
    }

    /// Unified reminder summary used by both listReminders and searchReminders.
    private func formatReminderSummary(_ r: EKReminder) -> String {
        var out = "• \(r.isCompleted ? "✓" : "○") \(r.title ?? "(no title)")"
        let pri = r.priority
        if pri != 0 { out += " [\(priorityLabel(pri))]" }
        if let due = r.dueDateComponents.flatMap({ Calendar.current.date(from: $0) }) {
            out += " (Due: \(formatDate(due)))"
        }
        out += "\n  List: \(r.calendar?.title ?? "Unknown")"
        out += "\n  ID: \(r.calendarItemIdentifier)"
        if let notes = r.notes, !notes.isEmpty {
            out += "\n  Notes: \(notes)"
        }
        if let url = r.url {
            out += "\n  URL: \(url.absoluteString)"
        }
        // Time-based alarms
        if let alarms = r.alarms {
            let timeAlarms = alarms.filter { $0.structuredLocation == nil && $0.absoluteDate == nil }
            if !timeAlarms.isEmpty {
                let labels = timeAlarms.map { "\(Int(-$0.relativeOffset / 60))min before" }
                out += "\n  Alarms: \(labels.joined(separator: ", "))"
            }
            let locAlarms = alarms.filter { $0.structuredLocation != nil }
            for la in locAlarms {
                if let loc = la.structuredLocation {
                    let dir = la.proximity == .leave ? "leaving" : "arriving at"
                    out += "\n  Location alarm: when \(dir) \"\(loc.title ?? "location")\""
                }
            }
        }
        if let rules = r.recurrenceRules, !rules.isEmpty {
            for rule in rules {
                out += "\n  Recurrence: \(formatRecurrenceRule(rule))"
            }
        }
        out += "\n\n"
        return out
    }
}

// MARK: - Helpers (module-level)

func ekError(_ message: String) -> NSError {
    NSError(domain: "macos-mcp.EventKit", code: 1,
            userInfo: [NSLocalizedDescriptionKey: message])
}

func parseISO8601(_ string: String) -> Date? {
    let formatter = ISO8601DateFormatter()
    // With timezone (e.g. "2026-03-29T18:00:00Z")
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let d = formatter.date(from: string) { return d }
    formatter.formatOptions = [.withInternetDateTime]
    if let d = formatter.date(from: string) { return d }
    // Local datetime without timezone (e.g. "2026-03-29T18:00:00")
    let localFmt = DateFormatter()
    localFmt.locale = Locale(identifier: "en_US_POSIX")
    localFmt.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
    if let d = localFmt.date(from: string) { return d }
    // Local datetime without seconds (e.g. "2026-03-29T18:00")
    localFmt.dateFormat = "yyyy-MM-dd'T'HH:mm"
    if let d = localFmt.date(from: string) { return d }
    // Date-only (e.g. "2026-03-29")
    localFmt.dateFormat = "yyyy-MM-dd"
    return localFmt.date(from: string)
}

func formatDate(_ date: Date) -> String {
    let f = DateFormatter()
    f.dateStyle = .medium
    f.timeStyle = .short
    return f.string(from: date)
}

func formatDateTime(_ date: Date) -> String {
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd HH:mm"
    return f.string(from: date)
}

func priorityLabel(_ priority: Int) -> String {
    switch priority {
    case 1:       return "high"
    case 2...4:   return "high"
    case 5:       return "medium"
    case 6...8:   return "medium"
    case 9:       return "low"
    default:      return "none"
    }
}

func priorityValue(_ label: String) -> Int {
    switch label.lowercased() {
    case "high":   return 1
    case "medium": return 5
    case "low":    return 9
    default:       return 0
    }
}

// MARK: - Value helpers

extension Optional where Wrapped == Value {
    var asInt: Int? {
        switch self {
        case .some(let v): return v.asInt
        case .none:        return nil
        }
    }

    var asDouble: Double? {
        switch self {
        case .some(let v): return v.asDouble
        case .none:        return nil
        }
    }
}

extension Value {
    var asInt: Int? {
        if let i = intValue   { return i }
        if let d = doubleValue { return Int(d) }
        return nil
    }

    var asDouble: Double? {
        if let d = doubleValue { return d }
        if let i = intValue   { return Double(i) }
        return nil
    }
}
