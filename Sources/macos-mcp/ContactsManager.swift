import Contacts
import MCP
import Foundation

// MARK: - ContactsManager actor

/// Actor that owns a single CNContactStore and serialises all Contacts access.
actor ContactsManager {

    private let store = CNContactStore()

    // All contact fields we fetch in every request.
    // NOTE: CNContactNoteKey is intentionally excluded — it requires the restricted
    // com.apple.developer.contacts.notes entitlement on macOS 13+. Without it the
    // Objective-C runtime throws an NSException that Swift cannot catch, crashing
    // the process. Notes are therefore not supported.
    private let fetchKeys: [CNKeyDescriptor] = [
        CNContactIdentifierKey,
        CNContactNamePrefixKey,
        CNContactGivenNameKey,
        CNContactMiddleNameKey,
        CNContactFamilyNameKey,
        CNContactNameSuffixKey,
        CNContactNicknameKey,
        CNContactOrganizationNameKey,
        CNContactJobTitleKey,
        CNContactDepartmentNameKey,
        CNContactPhoneNumbersKey,
        CNContactEmailAddressesKey,
        CNContactPostalAddressesKey,
        CNContactBirthdayKey,
    ] as [CNKeyDescriptor]

    // MARK: Permissions

    func requestPermissions() async {
        await withCheckedContinuation { continuation in
            self.store.requestAccess(for: .contacts) { _, _ in
                continuation.resume()
            }
        }
        log("Contacts permissions requested")
    }

    // MARK: - Tools

    func listAccounts(args: [String: Value]) async throws -> String {
        let containers = try store.containers(matching: nil)
        guard !containers.isEmpty else { return "No contact accounts found." }
        var out = "Contact accounts (\(containers.count)):\n\n"
        for c in containers {
            let type: String
            switch c.type {
            case .local:      type = "On My Mac"
            case .exchange:   type = "Exchange / OWA"
            case .cardDAV:    type = "CardDAV"
            case .unassigned: type = "Unassigned"
            @unknown default: type = "Unknown"
            }
            out += "• \(c.name) [\(type)]\n  ID: \(c.identifier)\n\n"
        }
        return out
    }

    func searchContacts(args: [String: Value]) async throws -> String {
        guard let query = args["query"]?.stringValue, !query.isEmpty else {
            throw contactsError("'query' is required")
        }
        let limit       = args["limit"].asInt ?? 20
        let accountName = args["account"]?.stringValue
        let q           = query.trimmingCharacters(in: .whitespaces)

        // Resolve container filter if requested
        var containerIdentifier: String? = nil
        if let name = accountName {
            let containers = try store.containers(matching: nil)
            guard let match = containers.first(where: { $0.name.lowercased() == name.lowercased() }) else {
                let names = containers.map { $0.name }.joined(separator: ", ")
                throw contactsError("No account named \"\(name)\". Available: \(names)")
            }
            containerIdentifier = match.identifier
        }

        // Route to the right predicate based on query shape
        let predicate: NSPredicate
        if q == "*" {
            // Wildcard: list all contacts in a specific account (account is required)
            guard let cid = containerIdentifier else {
                throw contactsError("Wildcard '*' requires an 'account' to be specified. Use contacts_list_accounts to see available accounts.")
            }
            predicate = CNContact.predicateForContactsInContainer(withIdentifier: cid)
        } else if q.contains("@") {
            predicate = CNContact.predicateForContacts(matchingEmailAddress: q)
        } else if q.filter({ $0.isNumber }).count > 5 {
            predicate = CNContact.predicateForContacts(matching: CNPhoneNumber(stringValue: q))
        } else {
            predicate = CNContact.predicateForContacts(matchingName: q)
        }

        var contacts = try store.unifiedContacts(matching: predicate, keysToFetch: fetchKeys)

        // Filter to container post-fetch when combined with a name query
        if let cid = containerIdentifier, q != "*" {
            let containerPred = CNContact.predicateForContactsInContainer(withIdentifier: cid)
            let containerContacts = try store.unifiedContacts(matching: containerPred, keysToFetch: fetchKeys)
            let containerIds = Set(containerContacts.map { $0.identifier })
            contacts = contacts.filter { containerIds.contains($0.identifier) }
        }

        let limited = Array(contacts.prefix(limit))
        guard !limited.isEmpty else {
            let scope = accountName.map { " in \"\($0)\"" } ?? ""
            return "No contacts matching \"\(query)\"\(scope)."
        }

        let scope = accountName.map { " in \"\($0)\"" } ?? ""
        var out = "Found \(limited.count) contact(s) matching \"\(query)\"\(scope):\n\n"
        for c in limited { out += formatContactSummary(c) }
        return out
    }

    func getContact(args: [String: Value]) async throws -> String {
        guard let contactId = args["contactId"]?.stringValue, !contactId.isEmpty else {
            throw contactsError("'contactId' is required")
        }
        let predicate = CNContact.predicateForContacts(withIdentifiers: [contactId])
        let contacts  = try store.unifiedContacts(matching: predicate, keysToFetch: fetchKeys)
        guard let contact = contacts.first else {
            throw contactsError("No contact found with ID: \(contactId)")
        }
        return formatContactDetail(contact)
    }

    func addContact(args: [String: Value]) async throws -> String {
        guard let givenName = args["givenName"]?.stringValue, !givenName.isEmpty else {
            throw contactsError("'givenName' is required")
        }

        let contact = CNMutableContact()
        contact.givenName        = givenName
        contact.familyName       = args["familyName"]?.stringValue       ?? ""
        contact.middleName       = args["middleName"]?.stringValue       ?? ""
        contact.nickname         = args["nickname"]?.stringValue         ?? ""
        contact.organizationName = args["organizationName"]?.stringValue ?? ""
        contact.jobTitle         = args["jobTitle"]?.stringValue         ?? ""

        contact.phoneNumbers  = buildPhoneNumbers(args)
        contact.emailAddresses = buildEmailAddresses(args)

        if let street = args["addressStreet"]?.stringValue, !street.isEmpty {
            let addr        = CNMutablePostalAddress()
            addr.street     = street
            addr.city       = args["addressCity"]?.stringValue    ?? ""
            addr.state      = args["addressState"]?.stringValue   ?? ""
            addr.postalCode = args["addressZip"]?.stringValue     ?? ""
            addr.country    = args["addressCountry"]?.stringValue ?? ""
            contact.postalAddresses = [CNLabeledValue(label: CNLabelHome, value: addr)]
        }

        if let bdayStr = args["birthday"]?.stringValue, !bdayStr.isEmpty,
           let bday = parseISO8601(bdayStr) {
            contact.birthday = Calendar.current.dateComponents([.year, .month, .day], from: bday)
        }

        let req = CNSaveRequest()
        req.add(contact, toContainerWithIdentifier: nil)
        try store.execute(req)

        return "✓ Created contact \"\(fullName(contact))\"\n  ID: \(contact.identifier)"
    }

    func updateContact(args: [String: Value]) async throws -> String {
        guard let contactId = args["contactId"]?.stringValue, !contactId.isEmpty else {
            throw contactsError("'contactId' is required")
        }

        let predicate = CNContact.predicateForContacts(withIdentifiers: [contactId])
        let contacts  = try store.unifiedContacts(matching: predicate, keysToFetch: fetchKeys)
        guard let contact = contacts.first,
              let mutable = contact.mutableCopy() as? CNMutableContact else {
            throw contactsError("No contact found with ID: \(contactId)")
        }

        if let v = args["givenName"]?.stringValue        { mutable.givenName        = v }
        if let v = args["familyName"]?.stringValue       { mutable.familyName       = v }
        if let v = args["middleName"]?.stringValue       { mutable.middleName       = v }
        if let v = args["nickname"]?.stringValue         { mutable.nickname         = v }
        if let v = args["organizationName"]?.stringValue { mutable.organizationName = v }
        if let v = args["jobTitle"]?.stringValue         { mutable.jobTitle         = v }

        if args["phones"] != nil {
            mutable.phoneNumbers = buildPhoneNumbers(args)
        }
        if args["emails"] != nil {
            mutable.emailAddresses = buildEmailAddresses(args)
        }

        if let bdayStr = args["birthday"]?.stringValue {
            if bdayStr.isEmpty {
                mutable.birthday = nil
            } else if let bday = parseISO8601(bdayStr) {
                mutable.birthday = Calendar.current.dateComponents([.year, .month, .day], from: bday)
            }
        }

        let req = CNSaveRequest()
        req.update(mutable)
        try store.execute(req)

        return "✓ Updated contact \"\(fullName(mutable))\"\n  ID: \(mutable.identifier)"
    }

    func deleteContact(args: [String: Value]) async throws -> String {
        guard let contactId = args["contactId"]?.stringValue, !contactId.isEmpty else {
            throw contactsError("'contactId' is required")
        }

        let predicate = CNContact.predicateForContacts(withIdentifiers: [contactId])
        let contacts  = try store.unifiedContacts(matching: predicate, keysToFetch: fetchKeys)
        guard let contact = contacts.first,
              let mutable = contact.mutableCopy() as? CNMutableContact else {
            throw contactsError("No contact found with ID: \(contactId)")
        }

        let name = fullName(contact)
        let req  = CNSaveRequest()
        req.delete(mutable)
        try store.execute(req)

        return "✓ Deleted contact \"\(name)\""
    }

    // MARK: - Private helpers

    private func buildPhoneNumbers(_ args: [String: Value]) -> [CNLabeledValue<CNPhoneNumber>] {
        guard let phones = args["phones"]?.arrayValue else { return [] }
        let labels = args["phoneLabels"]?.arrayValue?.map { $0.stringValue ?? CNLabelPhoneNumberMain } ?? []
        return phones.enumerated().compactMap { i, v in
            guard let num = v.stringValue, !num.isEmpty else { return nil }
            let label = i < labels.count ? labels[i] : CNLabelPhoneNumberMain
            return CNLabeledValue(label: label, value: CNPhoneNumber(stringValue: num))
        }
    }

    private func buildEmailAddresses(_ args: [String: Value]) -> [CNLabeledValue<NSString>] {
        guard let emails = args["emails"]?.arrayValue else { return [] }
        let labels = args["emailLabels"]?.arrayValue?.map { $0.stringValue ?? CNLabelWork } ?? []
        return emails.enumerated().compactMap { i, v in
            guard let addr = v.stringValue, !addr.isEmpty else { return nil }
            let label = i < labels.count ? labels[i] : CNLabelWork
            return CNLabeledValue(label: label, value: addr as NSString)
        }
    }

    private func fullName(_ c: CNContact) -> String {
        let parts = [c.namePrefix, c.givenName, c.middleName, c.familyName, c.nameSuffix]
            .filter { !$0.isEmpty }
        let name = parts.joined(separator: " ")
        if !name.isEmpty { return name }
        if !c.nickname.isEmpty { return c.nickname }
        if !c.organizationName.isEmpty { return c.organizationName }
        return "(no name)"
    }

    private func formatContactSummary(_ c: CNContact) -> String {
        var out = "• \(fullName(c))"
        if !c.organizationName.isEmpty { out += " (\(c.organizationName))" }
        out += "\n  ID: \(c.identifier)"
        if let phone = c.phoneNumbers.first?.value.stringValue {
            out += "\n  Phone: \(phone)"
        }
        if let email = c.emailAddresses.first.map({ $0.value as String }) {
            out += "\n  Email: \(email)"
        }
        out += "\n\n"
        return out
    }

    private func formatContactDetail(_ c: CNContact) -> String {
        var out = "Contact: \(fullName(c))\n"
        out += "ID: \(c.identifier)\n"

        if !c.organizationName.isEmpty { out += "Organization: \(c.organizationName)\n" }
        if !c.jobTitle.isEmpty         { out += "Job Title: \(c.jobTitle)\n"         }
        if !c.departmentName.isEmpty   { out += "Department: \(c.departmentName)\n"  }
        if !c.nickname.isEmpty         { out += "Nickname: \(c.nickname)\n"          }

        if !c.phoneNumbers.isEmpty {
            out += "\nPhone Numbers:\n"
            for p in c.phoneNumbers {
                let label = CNLabeledValue<CNPhoneNumber>.localizedString(forLabel: p.label ?? "")
                out += "  \(label): \(p.value.stringValue)\n"
            }
        }

        if !c.emailAddresses.isEmpty {
            out += "\nEmail Addresses:\n"
            for e in c.emailAddresses {
                let label = CNLabeledValue<NSString>.localizedString(forLabel: e.label ?? "")
                out += "  \(label): \(e.value as String)\n"
            }
        }

        if !c.postalAddresses.isEmpty {
            out += "\nAddresses:\n"
            for a in c.postalAddresses {
                let label = CNLabeledValue<CNPostalAddress>.localizedString(forLabel: a.label ?? "")
                let addr  = CNPostalAddressFormatter.string(from: a.value, style: .mailingAddress)
                out += "  \(label): \(addr.replacingOccurrences(of: "\n", with: ", "))\n"
            }
        }

        if let bday = c.birthday, let date = Calendar.current.date(from: bday) {
            out += "\nBirthday: \(formatDate(date))\n"
        }

        return out
    }
}

// MARK: - Error helper

private func contactsError(_ message: String) -> NSError {
    NSError(domain: "macos-mcp.Contacts", code: 1,
            userInfo: [NSLocalizedDescriptionKey: message])
}
