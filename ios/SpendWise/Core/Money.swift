import Foundation

/// Indian lakh/crore digit grouping, mirroring the web money pipe.
/// Input is integer paise; output like "₹1,20,000".
enum Money {
    static func format(_ paise: Int, signed: Bool = false, abs showAbs: Bool = false) -> String {
        let negative = paise < 0
        let absPaise = Swift.abs(paise)
        let rupees = absPaise / 100
        let rem = absPaise % 100

        let s = String(rupees)
        let grouped: String
        if s.count > 3 {
            let last3 = String(s.suffix(3))
            var rest = String(s.dropLast(3))
            var parts: [String] = []
            while rest.count > 2 {
                parts.insert(String(rest.suffix(2)), at: 0)
                rest = String(rest.dropLast(2))
            }
            if !rest.isEmpty { parts.insert(rest, at: 0) }
            grouped = parts.joined(separator: ",") + "," + last3
        } else {
            grouped = s
        }

        let frac = rem != 0 ? String(format: ".%02d", rem) : ""
        let sign = showAbs ? "" : negative ? "-" : (signed ? "+" : "")
        return "\(sign)₹\(grouped)\(frac)"
    }
}
