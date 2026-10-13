// Plugin Vite: lê src/data/*.json e escreve no index.html, no build e no dev,
// as seções #cafes e #faq e o JSON-LD. Também gera robots.txt, sitemap.xml e
// llms.txt a partir dos mesmos dados. O JS do navegador só acrescenta o status
// "open now" dos cafés.
import { readFileSync } from "node:fs";
import { INSTAGRAM_URL, SITE_URL } from "./site.config.mjs";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_NAMES = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const readJson = (file) =>
  JSON.parse(readFileSync(new URL(`../src/data/${file}`, import.meta.url)));

const escape = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// "07:00" -> "7am", "15:50" -> "3.50pm"
export function formatTime(time) {
  const [h, m] = time.split(":").map(Number);
  const hour = h % 12 || 12;
  return `${hour}${m ? `.${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

// Junta dias seguidos com o mesmo horário: Monday–Friday, Saturday, Sunday.
function groupHours(hours) {
  const groups = [];
  for (const day of DAYS) {
    const key = JSON.stringify(hours[day]);
    const last = groups.at(-1);
    if (last && last.key === key) last.days.push(day);
    else groups.push({ key, days: [day], hours: hours[day] });
  }
  return groups;
}

const groupLabel = (days) =>
  days.length === 1
    ? DAY_NAMES[days[0]]
    : `${DAY_NAMES[days[0]]}–${DAY_NAMES[days.at(-1)]}`;

const hoursText = (hours) =>
  hours ? `${formatTime(hours[0])}–${formatTime(hours[1])}` : "Closed";

function cafesSection(locations) {
  const cards = locations
    .map((loc) => {
      const rows = groupHours(loc.hours)
        .map(
          (g) => `
                <tr data-days="${g.days.join(" ")}">
                  <th scope="row">${groupLabel(g.days)}</th>
                  <td>${hoursText(g.hours)}</td>
                </tr>`,
        )
        .join("");
      const todo = loc.noteTodo ? ` <!-- TODO: ${loc.noteTodo} -->` : "";
      return `
          <article
            class="cafe-card reveal"
            id="cafe-${loc.id}"
            aria-labelledby="cafe-${loc.id}-name"
            data-hours='${escape(JSON.stringify(loc.hours))}'
          >
            <!-- TODO: foto da fachada -->
            <figure class="cafe-photo" hidden></figure>
            <h3 class="cafe-name" id="cafe-${loc.id}-name">${escape(loc.name)}</h3>
            <p class="cafe-status" data-status hidden></p>
            <address>
              ${escape(loc.streetAddress)},<br />
              ${escape(loc.locality)}, ${escape(loc.postalCode)}
            </address>
            <table class="cafe-hours">
              <caption class="visually-hidden">Opening hours in ${escape(loc.name)}</caption>
              <tbody>${rows}
              </tbody>
            </table>
            <p class="cafe-note">${escape(loc.note)}${todo}</p>
            <div class="cafe-actions">
              <a class="button small" href="${escape(loc.directionsUrl)}" target="_blank" rel="noopener"
                >Directions <span>↗</span></a
              ><a class="text-link" href="${escape(loc.mapsUrl)}" target="_blank" rel="noopener"
                >See on Google Maps <span>↗</span></a
              >
            </div>
          </article>`;
    })
    .join("");
  return `<section id="cafes" class="cafes section" aria-labelledby="cafes-title">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">Find us</p>
            <h2 id="cafes-title">
              <span class="br">Two cafés,</span> <em>south Dublin.</em>
            </h2>
          </div>
        </div>
        <div class="cafe-grid">${cards}
        </div>
      </section>`;
}

function faqSection(faq) {
  const items = faq
    .map(
      (item) => `
          <details class="faq-item">
            <summary>${escape(item.q)}</summary>
            <p>${escape(item.a)}</p>${item.todo ? `\n            <!-- TODO: ${item.todo} -->` : ""}
          </details>`,
    )
    .join("");
  return `<section id="faq" class="faq section" aria-labelledby="faq-title">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">Good to know</p>
            <h2 id="faq-title">Before you <em>pop in.</em></h2>
          </div>
        </div>
        <div class="faq-list reveal">${items}
        </div>
      </section>`;
}

function jsonLd(locations, faq) {
  const org = `${SITE_URL}#org`;
  const cafes = locations.map((loc) => ({
    "@type": "CafeOrCoffeeShop",
    "@id": `${SITE_URL}#${loc.id}`,
    name: `Happy Sheep Dublin – ${loc.name}`,
    parentOrganization: { "@id": org },
    url: `${SITE_URL}#cafes`,
    image: `${SITE_URL}assets/img/coffee-brownie-902.webp`,
    servesCuisine: "Coffee",
    priceRange: "€",
    address: {
      "@type": "PostalAddress",
      streetAddress: loc.streetAddress,
      addressLocality: loc.locality,
      postalCode: loc.postalCode,
      addressRegion: "Co. Dublin",
      addressCountry: "IE",
    },
    geo: { "@type": "GeoCoordinates", latitude: loc.lat, longitude: loc.lng },
    hasMap: loc.mapsUrl,
    openingHoursSpecification: groupHours(loc.hours)
      .filter((g) => g.hours)
      .map((g) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: g.days.map((d) => DAY_NAMES[d]),
        opens: g.hours[0],
        closes: g.hours[1],
      })),
    amenityFeature: [
      ["dog-friendly", "Dog-friendly"],
      ["outdoor-seating", "Outdoor seating"],
    ]
      .filter(([feature]) => loc.features.includes(feature))
      .map(([, name]) => ({
        "@type": "LocationFeatureSpecification",
        name,
        value: true,
      })),
  }));
  const graph = [
    {
      "@type": "Organization",
      "@id": org,
      name: "Happy Sheep Dublin",
      url: SITE_URL,
      logo: `${SITE_URL}icon-512.png`,
      sameAs: [INSTAGRAM_URL],
    },
    ...cafes,
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}#faq`,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
  const json = JSON.stringify(
    { "@context": "https://schema.org", "@graph": graph },
    null,
    2,
  );
  return `<script type="application/ld+json">\n${json.replace(/</g, "\\u003c")}\n    </script>`;
}

function robots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`;
}

function sitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
  </url>
</urlset>
`;
}

function llms(locations) {
  const cafes = locations
    .map((loc) => {
      const hours = groupHours(loc.hours)
        .map((g) => `  - ${groupLabel(g.days)}: ${hoursText(g.hours)}`)
        .join("\n");
      return `### ${loc.name}

- Address: ${loc.streetAddress}, ${loc.locality}, ${loc.postalCode}
- Opening hours:
${hours}
- ${loc.note}
- Directions: ${loc.directionsUrl}`;
    })
    .join("\n\n");
  return `# Happy Sheep Dublin

> Independent coffee shop with two cafés on the south side of Dublin, Ireland: Dundrum and Terenure. Coffee, homemade bakes, lunch and a few gifts.

Website: ${SITE_URL}
Instagram: ${INSTAGRAM_URL}

## Cafés

${cafes}

## What we serve

- Coffee made with our Original Blend, which we also sell by the bag.
- Flat white (also with oat or coconut milk), cappuccino, iced latte, iced mocha.
- Plant milks, oat and coconut among them.
- Brownies, brookies and cookies.
- Bagels, vegetarian sandwiches, salads, soup and vegan options.

## Good to know

- Terenure is dog-friendly: water bowl inside and treats at the counter. It has sofas, sells cosmetics, has paid on-street parking nearby and is wheelchair accessible but a small space. Kids welcome.
- Dundrum is mostly takeaway, with tables outside and a couple of seats in.
- Gifts: official Peanuts (Snoopy) mugs, Good Vibes rainbow mugs, Happy Sheep tote bags and insulated cups.
- No gift cards at the moment.
- Both cafés are closed on Sundays.
`;
}

export default function siteData() {
  const load = () => ({
    locations: readJson("locations.json"),
    faq: readJson("faq.json"),
  });
  const files = () => {
    const { locations } = load();
    return {
      "robots.txt": robots(),
      "sitemap.xml": sitemap(),
      "llms.txt": llms(locations),
    };
  };
  return {
    name: "happy-sheep-site-data",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const body = files()[req.url?.slice(1)];
        if (!body) return next();
        res.setHeader(
          "Content-Type",
          req.url.endsWith(".xml")
            ? "application/xml"
            : "text/plain; charset=utf-8",
        );
        res.end(body);
      });
    },
    transformIndexHtml(html) {
      const { locations, faq } = load();
      return html
        .replaceAll("%SITE_URL%", SITE_URL)
        .replace("<!-- @cafes -->", cafesSection(locations))
        .replace("<!-- @faq -->", faqSection(faq))
        .replace("<!-- @jsonld -->", jsonLd(locations, faq));
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(files())) {
        this.emitFile({ type: "asset", fileName, source });
      }
    },
  };
}
