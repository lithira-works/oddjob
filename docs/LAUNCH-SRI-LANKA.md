# Launch: Sri Lanka first, then worldwide

Decided 2026-11-05. Research from that date. Have a Sri Lankan lawyer and accountant confirm the legal and tax points.

## Launch city

**Colombo.** One city keeps supply dense enough for three replies within an hour. Start with a few neighbouring areas, and widen only when jobs there meet that reply target.

## Payments

| Question | What we know | Next step |
| --- | --- | --- |
| Local gateway | PayHere describes itself as Central Bank approved, working with licensed local banks, and lists LKR | Compare with at least one other local gateway |
| Who can apply | PayHere's blog says a Sri Lankan business registration and an LKR business bank account are needed | Register the business |
| Credits (Phase 1) | Ordinary one-party payments, so a standard gateway should fit | Confirm with the gateway |
| Protected Jobs (Phase 2) | **Not confirmed.** No source showed PayHere supporting split payouts or held funds | Ask PayHere in writing. Ask a lawyer whether holding customer money needs a licence or a licensed partner |
| Stripe | Not confirmed for Sri Lanka | Check Stripe's official country list |

If nobody can hold funds legally, Protected Jobs must change. Lead credits still work without them.

## Privacy law

- Personal Data Protection Act, No. 9 of 2022, as amended by Act No. 22 of 2025.
- A July 2026 gazette sets **1 January 2027** as the effective date for key provisions, including processing rules and duties of controllers and processors.
- Part IV, on direct marketing and unsolicited messages, is reported as still pending. Check before sending marketing messages.
- Build for the Act from the first real user. Have a lawyer write the privacy policy against it, and confirm rules on chat screening, call recording and sending data abroad to hosting and AI providers.

## Languages

English, Sinhala and Tamil.

- Translate the interface. Households must be able to describe a problem in their own language, or the core idea fails.
- Archivo has no Sinhala or Tamil letters. Choose matching typefaces and redo the poster layouts, because the two-line headline limit depends on word length.
- Extend `lib/match.ts` and `lib/contact-screen.ts`. Screening must catch numbers and offers written in Sinhala, Tamil and Singlish.
- Test Claude job cards on real mixed-language text.

## Local details

- **Currency:** LKR, set by `NEXT_PUBLIC_CURRENCY`. Sample quotes are placeholders, not market rates.
- **Prices:** test credit prices with real providers in Phase 0.
- **Phone first:** many providers may never use a laptop. Test on low-cost Android phones and slow connections.
- **Trust:** providers often work through word of mouth. Phase 0 interviews should cover what would make them pay per lead.

## Emergency numbers: not confirmed

Sources agree on **119** for police. They disagree on fire and ambulance: 110, 111 and 1100 appear for fire, and 1990 for the Suwa Seriya ambulance has conflicting details. No gas supplier hotline was confirmed.

The site's wording stays general until each number is confirmed from an official source and tested by phone. Then put them in the emergency messages in `components/HeroSearch.tsx` and `components/JobFlow.tsx`.

## Name

Check `oddjob.lk` and `.com`, social handles, and a trademark search at Sri Lanka's National Intellectual Property Office. Repeat trademark checks in each later country.

## Checklist for each new country

1. Enough providers signed by hand in one city
2. Payment provider and licence position
3. Privacy, consumer and tax law, reviewed by a local lawyer
4. Currency, languages and typefaces
5. Phone number formats and contact-screening words
6. Emergency numbers, confirmed and tested
7. Trademark and domain
8. ID check vendor that covers that country's documents
9. Rules for each trade, such as licences for electricians
