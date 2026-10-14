// Plugin Vite: lê src/data/*.json e escreve no HTML, no build e no dev, as
// seções #cafes, #reviews e #faq, as citações de clientes, os botões da página
// /review e o JSON-LD. Também gera robots.txt, sitemap.xml, llms.txt e os QR
// codes da página /review. O JS do navegador só acrescenta o status "open now"
// dos cafés.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import QRCode from "qrcode";
import { formatTime } from "../src/status.js";
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

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Texto do cliente exatamente como está, entre aspas curvas. Parágrafos
// separados por linha em branco viram <p>.
function quoteHtml(text) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => escape(p.trim()).replace(/\n/g, "<br />"));
  paragraphs[0] = `“${paragraphs[0]}`;
  paragraphs[paragraphs.length - 1] += "”";
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

const STAR =
  "M10 1.4l2.6 5.5 6 .8-4.4 4.2 1.1 6L10 15l-5.3 2.9 1.1-6L1.4 7.7l6-.8z";

function stars(rating) {
  const paths = [0, 1, 2, 3, 4]
    .map(
      (i) =>
        `<path d="${STAR}" transform="translate(${i * 22} 0)"${i < rating ? "" : ' class="star-empty"'} />`,
    )
    .join("");
  return `<svg class="stars" viewBox="0 0 108 20" role="img" aria-label="${rating} out of 5">${paths}</svg>`;
}

const locationName = (id, locations) =>
  locations.find((loc) => loc.id === id)?.name;

// Citação curta dentro de uma seção (Gifts e cards dos cafés).
function sectionQuote(review, className) {
  return `<figure class="${className}">
              <blockquote>${quoteHtml(review.quote)}</blockquote>
              <figcaption>${escape(review.name)} · Google review</figcaption>
            </figure>`;
}

function reviewsSection(data, locations) {
  // Primeiro os destacados (featured 1, 2, 3…), depois os outros na ordem do
  // arquivo. Os que têm "section" aparecem na seção indicada, não aqui.
  const inCarousel = data.reviews.filter((r) => !r.section);
  const featured = inCarousel
    .filter((r) => r.featured)
    .sort((a, b) => a.featured - b.featured);
  const ordered = [...featured, ...inCarousel.filter((r) => !r.featured)];
  const cards = ordered
    .map((r) => {
      const place = locationName(r.location, locations);
      return `
          <figure class="review-card${r.quote.length > 260 ? " is-long" : ""}">
            ${stars(r.rating)}
            <blockquote>${quoteHtml(r.quote)}</blockquote>
            <figcaption>
              <strong>${escape(r.name)}</strong>${place ? `\n              <span class="review-tag">${escape(place)}</span>` : ""}
              <span class="review-source">Google review</span>
            </figcaption>
          </figure>`;
    })
    .join("");
  const badges = locations
    .map((loc) => {
      const r = data.ratings[loc.id];
      return `
            <p class="rating-badge">
              <span class="rating-place">${escape(loc.name)}</span>
              <span aria-hidden="true">·</span>
              <span><span aria-hidden="true">★</span> ${r.rating.toFixed(1)}</span>
              <span aria-hidden="true">·</span>
              <span>${r.count} Google reviews</span>
            </p>`;
    })
    .join("");
  const [year, month] = data.ratings[locations[0].id].checked.split("-");
  const buttons = locations
    .map(
      (loc) =>
        `<a class="button small" href="${escape(data.ratings[loc.id].reviewUrl)}" target="_blank" rel="noopener" data-track="leave_review" data-track-cafe="${loc.id}" data-track-place="reviews"
              >Review ${escape(loc.name)} <span>↗</span></a
            >`,
    )
    .join("");
  return `<section id="reviews" class="reviews section" aria-labelledby="reviews-title">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">From our regulars</p>
            <h2 id="reviews-title">
              <span class="br">Nice things</span> <em>people have said.</em>
            </h2>
          </div>
          <div class="gallery-controls">
            <button id="reviews-prev" aria-label="Previous review">←</button
            ><button id="reviews-next" aria-label="Next review">→</button>
          </div>
        </div>
        <div class="rating-badges reveal">${badges}
          <p class="rating-note">Google ratings, ${MONTHS[Number(month) - 1]} ${year}</p>
        </div>
        <div
          class="review-track"
          id="review-track"
          role="region"
          aria-label="Customer reviews"
          tabindex="0"
        >${cards}
        </div>
        <div class="carousel-progress" aria-hidden="true"><span></span></div>
        <div class="reviews-foot">
          <p>Been in? Tell people about it.</p>
          <div class="reviews-actions">
            ${buttons}
          </div>
        </div>
      </section>`;
}

// Botões grandes da página /review: direto para a tela de avaliar no Google.
function reviewButtons(data, locations) {
  return locations
    .map(
      (loc) =>
        `<a class="review-choice" href="${escape(data.ratings[loc.id].reviewUrl)}"
          data-track="leave_review" data-track-cafe="${loc.id}" data-track-place="review_page"
          >${escape(loc.name)} <span aria-hidden="true">↗</span></a
        >`,
    )
    .join("\n        ");
}

// Selo "Open from 7am / Saturdays from 8am": abertura mais cedo entre as
// lojas, em dia de semana e no sábado.
function cafesStamp(locations) {
  const earliest = (day) =>
    locations
      .map((loc) => loc.hours[day]?.[0])
      .filter(Boolean)
      .sort()[0];
  return `<div class="stamp cafes-stamp" aria-hidden="true">
            <span>Open from</span> <strong>${formatTime(earliest("mon"))}</strong>
            <span>Saturdays from ${formatTime(earliest("sat"))}</span>
          </div>`;
}

// Lojas no menu mobile: nome, status ao vivo (main.js) e rota.
function menuCafes(locations) {
  const items = locations
    .map(
      (loc) => `
        <li data-hours='${escape(JSON.stringify(loc.hours))}'>
          <strong>${escape(loc.name)}</strong>
          <span class="cafe-status" data-status hidden></span>
          <a href="${escape(loc.directionsUrl)}" target="_blank" rel="noopener" data-track="directions" data-track-cafe="${loc.id}" data-track-place="menu"
            >Directions ↗</a
          >
        </li>`,
    )
    .join("");
  return `<ul class="menu-cafes" aria-label="Our cafés">${items}
      </ul>`;
}

function cafesSection(locations, data) {
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
      const review = data.reviews.find((r) => r.section === `cafe-${loc.id}`);
      const quote = review
        ? `\n            ${sectionQuote(review, "cafe-quote")}`
        : "";
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
            <p class="cafe-note">${escape(loc.note)}${todo}</p>${quote}
            <div class="cafe-actions">
              <a class="button small" href="${escape(loc.directionsUrl)}" target="_blank" rel="noopener"
                data-track="directions" data-track-cafe="${loc.id}" data-track-place="cafes"
                >Directions <span>↗</span></a
              ><a class="text-link" href="${escape(loc.mapsUrl)}" target="_blank" rel="noopener"
                >See on Google Maps <span>↗</span></a
              ><a class="text-link" href="${escape(data.ratings[loc.id].reviewUrl)}" target="_blank" rel="noopener"
                data-track="leave_review" data-track-cafe="${loc.id}" data-track-place="cafes"
                >Leave a review <span>↗</span></a
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
          ${cafesStamp(locations)}
        </div>
        <div class="cafe-grid">${cards}
        </div>
      </section>`;
}

// Horário resumido do rodapé: "Mon–Fri 7am–3.50pm · Sat 8am–3pm".
const SHORT_DAYS = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};
const shortHours = (hours) =>
  groupHours(hours)
    .filter((g) => g.hours)
    .map((g) => {
      const days =
        g.days.length === 1
          ? SHORT_DAYS[g.days[0]]
          : `${SHORT_DAYS[g.days[0]]}–${SHORT_DAYS[g.days.at(-1)]}`;
      return `${days} ${hoursText(g.hours)}`;
    })
    .join(" · ");

function footerCafes(locations) {
  const cafes = locations
    .map(
      (loc) => `
        <div class="footer-cafe">
          <p class="footer-cafe-name">${escape(loc.name)}</p>
          <address>
            ${escape(loc.streetAddress)},<br />
            ${escape(loc.locality)}, ${escape(loc.postalCode)}
          </address>
          <p>${shortHours(loc.hours)}</p>
          <a href="${escape(loc.directionsUrl)}" target="_blank" rel="noopener" data-track="directions" data-track-cafe="${loc.id}" data-track-place="footer"
            >Directions ↗</a
          >
        </div>`,
    )
    .join("");
  const handle = new URL(INSTAGRAM_URL).pathname.replaceAll("/", "");
  return `<div class="footer-cafes">${cafes}
        <div class="footer-cafe">
          <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener" data-track="instagram" data-track-place="footer">Instagram ↗</a>
          <p>@${handle}</p>
        </div>
      </div>`;
}

function faqSection(faq) {
  const items = faq
    .map(
      (item) => `
          <details class="faq-item">
            <summary>${escape(item.q)}</summary>
            <div class="faq-answer"><p>${escape(item.a)}</p></div>${item.todo ? `\n            <!-- TODO: ${item.todo} -->` : ""}
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
        <div class="faq-layout">
          <div class="faq-list reveal">${items}
          </div>
          <aside class="faq-card reveal" aria-labelledby="faq-card-title">
            <p class="eyebrow">Still wondering?</p>
            <h3 id="faq-card-title">
              Something we <em>haven't covered?</em>
            </h3>
            <p>
              Send us a message on Instagram and one of us will get back to you.
            </p>
            <a class="button" href="${INSTAGRAM_URL}" target="_blank" rel="noopener" data-track="instagram" data-track-place="faq"
              >Message us on Instagram <span>↗</span></a
            >
          </aside>
        </div>
      </section>`;
}

// Maior arquivo gerado de uma foto (src/data/images.json).
const largestImage = (name) => {
  const image = readJson("images.json")[name];
  return `${SITE_URL}assets/img/${name}-${Math.max(...image.widths)}.webp`;
};

function jsonLd(locations, faq) {
  const org = `${SITE_URL}#org`;
  const cafes = locations.map((loc) => ({
    "@type": "CafeOrCoffeeShop",
    "@id": `${SITE_URL}#${loc.id}`,
    name: `Happy Sheep Dublin – ${loc.name}`,
    parentOrganization: { "@id": org },
    url: `${SITE_URL}#cafes`,
    image: largestImage(loc.photo),
    // Só se existirem nos dados: nada de telefone ou email inventado.
    ...(loc.telephone && { telephone: loc.telephone }),
    ...(loc.email && { email: loc.email }),
    servesCuisine: "Coffee",
    priceRange: "€",
    address: {
      "@type": "PostalAddress",
      // O bairro vai no endereço; a cidade é Dublin.
      streetAddress: `${loc.streetAddress}, ${loc.locality.split(",")[0]}`,
      addressLocality: "Dublin",
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

// "Reviews: rated 4.7 (Dundrum) and 4.5 (Terenure) on Google, October 2026"
function googleRatings(locations, reviews) {
  const rated = locations
    .map((loc) => `${reviews.ratings[loc.id].rating.toFixed(1)} (${loc.name})`)
    .join(" and ");
  const [year, month] = reviews.ratings[locations[0].id].checked.split("-");
  return `Reviews: rated ${rated} on Google, ${MONTHS[Number(month) - 1]} ${year}`;
}

function llms(locations, reviews) {
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
- [Directions to ${loc.name}](${loc.directionsUrl})
- [${loc.name} on Google Maps](${loc.mapsUrl})`;
    })
    .join("\n\n");
  return `# Happy Sheep Dublin

> Independent coffee shop with two cafés on the south side of Dublin, Ireland: Dundrum and Terenure. Coffee, homemade bakes, lunch and a few gifts.

- [Website](${SITE_URL})
- [Instagram](${INSTAGRAM_URL})

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
- Both cafés are closed on Sundays.
- ${googleRatings(locations, reviews)}
`;
}

// QR codes da página /review, para imprimir (balcão, copos). Ficam em
// public/qr/ e só são reescritos quando mudam.
async function writeQrCodes() {
  const url = `${SITE_URL}review`;
  const options = {
    margin: 4,
    color: { dark: "#202d22", light: "#f5efd9" },
  };
  const dir = new URL("../public/qr/", import.meta.url);
  mkdirSync(dir, { recursive: true });
  const write = (name, content) => {
    const file = new URL(name, dir);
    let current = null;
    try {
      current = readFileSync(file);
    } catch {}
    if (!current || !Buffer.from(content).equals(current)) {
      writeFileSync(file, content);
    }
  };
  write(
    "review-qr.svg",
    await QRCode.toString(url, { ...options, type: "svg" }),
  );
  write(
    "review-qr.png",
    await QRCode.toBuffer(url, { ...options, type: "png", width: 2000 }),
  );
}

export default function siteData() {
  const load = () => ({
    locations: readJson("locations.json"),
    faq: readJson("faq.json"),
    reviews: readJson("reviews.json"),
  });
  const files = () => {
    const { locations, reviews } = load();
    return {
      "robots.txt": robots(),
      "sitemap.xml": sitemap(),
      "llms.txt": llms(locations, reviews),
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
    async buildStart() {
      await writeQrCodes();
    },
    transformIndexHtml(html) {
      const { locations, faq, reviews } = load();
      return html
        .replaceAll("%SITE_URL%", SITE_URL)
        .replace("<!-- @reviews -->", reviewsSection(reviews, locations))
        .replace(/<!-- @quote (\w+) -->/g, (_, id) => {
          const review = reviews.reviews.find((r) => r.id === id);
          if (!review)
            throw new Error(`Review ${id} não existe em reviews.json`);
          return sectionQuote(review, "section-quote");
        })
        .replace("<!-- @review-buttons -->", reviewButtons(reviews, locations))
        .replace("<!-- @cafes -->", cafesSection(locations, reviews))
        .replace("<!-- @menu-cafes -->", menuCafes(locations))
        .replace("<!-- @footer-cafes -->", footerCafes(locations))
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
