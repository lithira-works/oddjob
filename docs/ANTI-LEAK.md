# Keeping jobs on the platform

People will try to go direct, and no system stops all of them. Home services are especially exposed, because repeat work makes a private deal tempting. The aim is to make leaving pointless, not impossible. Research on on-demand platforms finds that leakage rises when the risk of dealing off-platform stops outweighing its benefit, so trust features matter as much as blocks.

## Layer 1: be paid first

The provider pays credits to reply. Once that is paid, leakage on that job costs Oddjob only the optional commission. See [MONETISATION.md](MONETISATION.md).

## Layer 2: block

- Hide numbers until the household books, then connect both sides through a masked number. **Masking is not built yet.**
- Screen chat on the server. **Built:** `lib/contact-screen.ts` catches phone numbers, spelled-out numbers, emails, links, messaging apps and offers to avoid fees.
- OCR photos for numbers on vans and business cards. **Not built.**
- Warn first. False positives anger honest users, so tests protect measurements, prices and years.

## Layer 3: make staying worth more

- Only booked jobs earn reviews, ranking and the work ledger, so going direct builds nothing.
- The guarantee, dispute help and receipt cover Protected Jobs only.
- Commission drops with each repeat booking of the same pair, for example 15%, then 10%, then 5%.
- Households earn credits for rebooking on the site.

## Layer 4: detect

- Ask the household three days after contact: "Did you hire them?" Pay a small credit for answering.
- Flag providers with many contacts but few bookings.
- Flag chats that stop right after contact is shared.

## Layer 5: enforce

- Terms include a no-bypass clause with a conversion fee.
- Penalties step up: warning, ranking drop, suspension.
- Never act on one signal alone, and always offer an appeal. Claude never bans anyone by itself.

## Legal

Chat scanning must be disclosed in the terms and privacy policy. Call recording needs consent. Have a local lawyer review both.

## Measure

Leakage rate comes from the follow-up question. Report it weekly, per trade. If it rises, ask why before adding more blocks: it usually means fees are too high or the value too low.
