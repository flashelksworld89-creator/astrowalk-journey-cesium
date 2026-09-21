# AstroWalk location-astrology method (v3.6.1)

This app keeps three layers separate and combines them only at interpretation time:

1. **Natal Jyotish layer (Lahiri sidereal)** — natal planets, houses, house lords and transit contacts. The default journey emphasis is the 1st lord (self), 3rd lord (communication and short travel) and 7th lord (others, contracts and business relationships). Users may add more houses/lords.
2. **Relocation / astrocartography layer** — the birth instant is recast for the current and destination coordinates. Planetary degrees remain the natal degrees while the location-dependent angles and houses change. The engine records natal planets within 5 degrees of ASC/DSC/MC/IC. Both tropical angle contacts (Western relocation convention) and sidereal angle contacts are retained as distinct evidence.
3. **Local Space layer** — natal planetary azimuths are calculated for the current location using the birth instant. The journey bearing is compared with both arms of each planetary direction. Contacts within 12 degrees are supplied to the interpretation engine.

The app treats these as symbolic astrological techniques, not physical causal mechanisms or guaranteed event predictions. Transit timing remains date-sensitive: changing Journey Time recalculates the transit chart and all transit-to-natal contacts.

Research basis used for this implementation includes Astro.com material on relocated charts and Local Space, plus contemporary Jyotish sources describing the 3rd/9th/12th travel distinction and the role of house lords and transits. Exact implementation choices (5-degree angularity threshold, 12-degree Local Space route threshold) are AstroWalk defaults and can be made configurable later.
