import type { LegalDocument } from './documents';

export const LEGAL_DOCUMENTS_EN: LegalDocument[] = [
  {
    slug: 'aszf',
    title: 'Terms and Conditions',
    short: 'Terms',
    updated: '24 November 2026',
    body: `
These Terms and Conditions (Terms) set out the conditions for using the services provided under the name {{szolgaltatas.nev}} on the {{weboldal}} website: **Avenge PC Check** (a PC Check scanning tool for Minecraft servers) and the **Avenge Foundry** store (sale of Minecraft plugins and models). By registering, purchasing or subscribing you accept these Terms.

## 1. The provider
{{szolgaltato.tabla}}

Payments and invoicing are handled by {{viszontelado.nev}} as reseller (merchant of record); its details are in the [Imprint](/jogi/impresszum).

## 2. Definitions
- **Customer / User**: anyone who creates a customer account on avenge.hu, purchases plugins or models, or subscribes.
- **Plugin**: a downloadable Minecraft server extension developed by the Provider (digital content).
- **Model**: a downloadable Minecraft 3D model, texture or resource pack made by the Provider (e.g. in Blockbench, ModelEngine, ItemsAdder, Oraxen or Nexo format; digital content).
- **Product**: plugins and models together.
- **PC Check**: the Avenge PC Check scanning tool (Windows client program and web panel).
- **Subscription**: the monthly, automatically renewing right to use PC Check.
- **Provider**: {{szolgaltato.nev}} ({{szolgaltato.jogallas}}), the operator of {{szolgaltatas.nev}}.
- **Tebex**: {{viszontelado.nev}}, which handles payments as reseller (merchant of record).

## 3. Registration and account
1. Purchasing and downloading are only possible with a customer account (email address, password and Minecraft name). Tebex uses the Minecraft name to identify the payment, so the name given at registration cannot be changed later; in case of a typo, customer support corrects it.
2. The User is responsible for the accuracy of the details provided and for keeping their password secret.
3. One person may use one account; the account cannot be transferred or passed on.
4. The Provider may suspend or delete the account if the User breaches these Terms or the License terms (e.g. unauthorized distribution of a Product, abusive chargeback, fraud).
5. The User can delete their account any time on the My account page.

## 4. Purchasing plugins and models
1. The price of the Products is shown on their pages; a sale price applies during the sale period. The final prices, including applicable tax, are shown on the Tebex payment page.
2. The order is concluded on the Tebex payment page when the payment is completed. Payment and invoicing are carried out by Tebex; Tebex's own customer terms also apply to the payment ({{viszontelado.feltetelek}}).
3. After a successful payment the Product becomes downloadable in the User's account immediately, together with its later updates.
4. By purchasing, the User does **not acquire ownership of the Product**, but a non-exclusive right of use under the [License terms](/jogi/licenc).
5. Compatibility details (Minecraft version, server software, model engine plugin or format) are for information; before purchasing, the User should check that the Product suits their server. Using models may require an external plugin named in the description (e.g. ModelEngine, ItemsAdder), which the User obtains themselves.

## 5. The PC Check subscription
1. The subscription has a monthly fee and **renews automatically every month** until the User cancels it; Tebex charges the fee to the payment method provided.
2. After the first successful payment the User gets their own organization and Owner access to the PC Check panel, where they can set the permissions of their team's Admin and Staff roles themselves.
3. The subscription can be cancelled any time with one button on the Subscription or My account page; access remains until the end of the period already paid, and no further charge is made after that. If Tebex still charges after the cancellation, we refund the charge.
4. If the subscription expires (after the end of the paid period, with a 3-day grace period), the organization is permanently deleted one day later **with all of its data** (members, scans and results, plugin keys, activity log); when the customer account is deleted, this happens immediately. With a new subscription the User gets a new, empty organization.
5. PC Check may only be used to scan a person who starts the scan themselves with the code they received. The User (server) is responsible for carrying out the scan lawfully, with the player properly informed, and for using the results only to filter out cheating.
6. The PC Check result is professional help for the decision, not infallible: the final decision (e.g. a ban) is up to the server's staff.

## 6. Right of withdrawal
Under Government Decree 45/2014 (II. 26.), a consumer is generally entitled to a 14-day right of withdrawal. However, for **digital content not supplied on a tangible medium** (plugin, model), the right of withdrawal ends if performance has begun with the consumer's express prior consent and the consumer acknowledged that they thereby lose the right of withdrawal (Section 29 (1) m)). We ask for this consent with a separate checkbox before purchase; the Product becomes downloadable immediately after payment.

Regardless of this, a Product that has **not been downloaded yet** is refunded on request **within 3 days** of payment. After downloading, or after 3 days, the purchase cannot be refunded; your statutory rights arising from defective performance are not affected. Details: [Refund Policy](/jogi/visszaterites).

## 7. Warranty, liability
1. The Provider supplies the Products working as described, and fixes defects through updates. In case of defective performance, the consumer is entitled to the rights under the Hungarian Civil Code and Government Decree 373/2021 (VI. 30.).
2. The Provider is not liable for damage resulting from improper use of the Product, conflicts with other plugins or resource packs, or incorrect server configuration, or for lost profit - except where the law does not allow this to be excluded.
3. The Provider strives for continuous availability of the service, but temporary outages may occur due to maintenance or malfunction.

## 8. Complaints, disputes
1. You can submit complaints {{kapcsolat}}; we reply in writing within 30 days.
2. In a consumer dispute you can turn to the conciliation body of your place of residence, and you can also use the EU online dispute resolution platform: https://ec.europa.eu/consumers/odr.
3. The contract is governed by Hungarian law; the mandatory consumer protection rules of the consumer's place of residence apply regardless.

## 9. Changes
The Provider may change these Terms; changes are published on the website. Purchases already concluded are governed by the Terms in force at the time of purchase; for subscriptions, we notify you of material changes before the next charge.
`
  },
  {
    slug: 'adatkezeles',
    title: 'Privacy Policy',
    short: 'Privacy',
    updated: '25 November 2026',
    body: `
Based on Regulation (EU) 2016/679 of the European Parliament and of the Council (GDPR) and the Hungarian Privacy Act (Act CXII of 2011), this policy describes what personal data we process, why and for how long.

## 1. Controller
{{szolgaltato.tabla}}

## 2. Customer account and store
| Data | Purpose | Legal basis | Retention |
|---|---|---|---|
| Email address, password (hashed only), Minecraft name | account, sign-in, communication, identifying the Tebex payment | performance of contract (GDPR Art. 6(1)(b)) | until the account is deleted |
| Profile picture (if uploaded) | personalizing the account | consent (GDPR Art. 6(1)(a)), can be removed any time on the My account page | until removed or the account is deleted |
| Time and version of accepting the Terms | proof of consent | legal obligation / legitimate interest | until the account is deleted |
| Orders (items, amount, time, Tebex ID) | fulfilment, accounting, fraud prevention | legal obligation (Accounting Act) | 8 years; without a name after the account is deleted |
| Purchase and refund receipts (name, email address, items, amount, time, Tebex ID) | proof of payments and refunds, settlement, accounting | legal obligation (Accounting Act), legitimate interest (settling disputes) | 8 years; unchanged even after the account is deleted |
| Purchased plugins and models, number of downloads | providing the download right | performance of contract | until the account is deleted |
| Subscription status, Tebex reference | managing the monthly subscription | performance of contract | until the account is deleted |
| Reason for a ban (if any) | preventing abuse | legitimate interest | until the account is deleted |
| Discord account ID and name (if you link it) | adding the Avenge bot to your apps, and automatically assigning roles (Subscriber, Plugin buyer) on the Avenge Discord | consent (GDPR Art. 6(1)(a)), can be unlinked any time on the My account page | until unlinked or the account is deleted |

**Discord linking**: if you link your Discord account on the My account page, Discord only gives us your user ID and your name (identify); we do not store the Discord access token. Based on the ID, the bot assigns roles on the Avenge Discord according to your purchases and subscription, and removes them on expiry, refund, unlinking and account deletion.

**Support tickets**: if you open a ticket on the website's Support page, we record with your customer account the ticket's topic, subject, the ID you provide (e.g. receipt number), the correspondence with you and the attached images, and the time of opening, replies and closing. Purpose: answering your request and enforcing the "one open ticket at a time, a new one every 3 days" rule; legal basis: fulfilling your request (GDPR Art. 6(1)(b)) and legitimate interest ((f)). Tickets are kept for 1 year after closing, and deleted immediately with their attachments when your account is deleted. Only images are accepted as attachments; do not send passwords or card details.

**We do not process card details**: payment is carried out by {{viszontelado.nev}} (United Kingdom) as an independent controller; the data provided for payment is covered by Tebex's privacy policy (https://www.tebex.io/privacy). From Tebex we only receive the fact of the payment, its amount, its ID and the customer's email address; we pass the Minecraft name given at registration to Tebex for the payment.

## 3. PC Check scans
The player starts the scan themselves with the code received from the staff member; the program indicates that connecting starts the scan, and the staff sees the result.

During the scan, the program looks for traces of known cheat programs and autoclickers on the computer. To do this it analyzes **files stored on the computer** (their names, sizes, fingerprints and - for jar files - their content), **execution history and system logs** (e.g. Prefetch, Windows logs, traces of deleted files), **running processes** (including Minecraft's memory), **installed programs and their settings** (e.g. macros of mouse software), and cheat-related entries of browser and DNS history.

The **result** of the scan is sent to the server: the hits (file name, path, timestamp, severity and the details supporting the hit - e.g. the steps of a mouse macro, a cheat-related browser or DNS entry), the Minecraft username, the start time, client and version of the Minecraft running during the scan, a fingerprint derived from the PC's hardware ID, the time of the scan and the IP address. We do not collect personal documents, images, messages or passwords.

- **Purpose**: filtering out cheating on Minecraft servers.
- **Legal basis**: the server's legitimate interest in ensuring fair play (GDPR Art. 6(1)(f)), which the player acknowledges by voluntarily starting the scan.
- **Controller**: the server (organization) whose staff member requested the scan; in this case the Provider stores the result on the server's behalf, as processor. For scans carried out on the Provider's own servers, the Provider is the controller.
- **Retention**: according to the organization's setting (by default until the organization is deleted, or deleted automatically after the configured number of days). For a subscription organization, all of its data is deleted automatically after the subscription expires (3-day grace period plus 1 more day), and immediately when the customer account is deleted. A share link is valid for at most 3 days.
- **The Provider's access**: to operate the service, troubleshoot and investigate abuse, the Provider can view the organizations' data (members, scans and results, subscription, plugin keys). Every such view is logged.
- **Minecraft plugin**: if the server uses the Avenge Velocity plugin, when a scan code is requested the organization's activity log records the player's name and UUID, the name of the staff member requesting the scan and the server's name. Log messages about PC Check events (start, start of the scan, its result and most important hits, refusal, automatic ban, leaving, end of the PC Check) are sent to the Provider's Discord server, and, if the server has configured it, to the server's own Discord server too. The message contains the player's and the staff member's names, the server's and the organization's names, the scan code, the result and the link to the result. Purpose: tracking scans and abuse; legal basis: the legitimate interest of the Provider and the server (GDPR Art. 6(1)(f)).

## 4. Technical data
For sign-in, the website stores a sign-in token in the browser's local storage (localStorage), and remembers the site's current theme and the chosen language. We do not use tracking (marketing or analytics) cookies. For security, the server logs the IP address and time of requests, and records the staff's actions in the organization's activity log. {{naplo.megorzes}} Details: [Cookie notice](/jogi/cookie).

## 5. Processors, recipients
- **{{viszontelado.nev}}** (United Kingdom) - payment, invoicing (independent controller).
- **Discord Inc.** (USA) - if you contact us on our Discord server ({{kapcsolat.discord}}), Discord processes your messages under its own privacy policy. The messages of the Minecraft plugin's PC Check log are stored by Discord too, and Discord linking and role assignment also take place on Discord.
- **Hosting providers** (processors):
{{tarhely.lista}}

Data transfers to the United Kingdom take place on the basis of the European Commission's adequacy decision, and transfers to the United States with appropriate safeguards (EU-US Data Privacy Framework, or standard contractual clauses).

## 6. Your rights
You can request access to your personal data, its rectification or erasure, restriction of processing, object to processing based on legitimate interest, and request your data in a portable format. You can submit your request {{kapcsolat}}; we reply within 1 month. You can also delete your customer account yourself on the My account page.

You can lodge a complaint with the Hungarian National Authority for Data Protection and Freedom of Information (NAIH, 1055 Budapest, Falk Miksa utca 9-11., https://naih.hu), or go to court.
`
  },
  {
    slug: 'visszaterites',
    title: 'Refund Policy',
    short: 'Refunds',
    updated: '24 November 2026',
    body: `
## 1. Plugins and models (digital content)
Plugins and models are digital content not supplied on a tangible medium: they can be downloaded immediately after payment. Before purchasing you expressly consent to performance starting immediately, and acknowledge that you thereby **lose your statutory right of withdrawal** (Government Decree 45/2014 (II. 26.), Section 29 (1) m)).

**Refund before download, for 3 days:** if you **have not downloaded** the Product yet, we refund its full price on request **within 3 days** of payment. The system records the first download; a downloaded Product, or a purchase after 3 days, is not refunded.

Apart from this, we only give a refund if:
- the Product **works substantially defectively** in the supported environment stated in its description (e.g. the model loads incorrectly or is incomplete), and we do not fix the defect within 14 days of the report (this policy does not limit your statutory rights arising from defective performance);
- you **paid twice** for the same Product;
- after payment the Product **did not become downloadable**, and we do not remedy this within 48 hours.

We do not give a refund if you have already downloaded the Product, or if the Product does not work because of your server's configuration, an unsupported version, a missing model engine plugin or another plugin, or if you simply changed your mind after downloading.

## 2. PC Check subscription
- You can cancel the subscription any time; we do not charge you for the next month.
- The fee for the month already started is not refunded, but you can use the service until the end of the month.
- If within 3 days of payment the service could not be used through our fault, we refund the monthly fee on request; in this case the subscription ends immediately.
- The organization belonging to an expired subscription is deleted with all of its data after the expiry (3-day grace period plus 1 more day).

## 3. How to request a refund?
You can request a refund for a Product you have not downloaded yet **within 3 days** of payment; for a defective Product or a double payment, report it as soon as possible after noticing the problem. Write to **{{kapcsolat.email}}** from your customer account's email address, or open a ticket on the website's **Support** page (avenge.hu/tamogatas); give the receipt number (you find it in the Invoices section of your account) and a description of the problem. We start a justified refund through Tebex, for the full amount, to the original payment method; the money usually arrives within 5-10 business days. You get a refund receipt, which can be downloaded in your account.

## 4. Chargeback
Before starting a chargeback at your bank, please contact us. In case of a refund or chargeback, the right to download the Product ends and the license becomes invalid; in case of an abusive chargeback we may suspend the account.
`
  },
  {
    slug: 'licenc',
    title: 'License terms (plugins and models)',
    short: 'License',
    updated: '13 November 2026',
    body: `
These terms apply to the use of the Minecraft plugins and models sold by Avenge Foundry (together: Products). By purchasing or downloading a Product you accept them.

## 1. The license
By purchasing you get a **non-exclusive, non-transferable, perpetual** right to use the Product on your own Minecraft server network (the servers of one owner or operator, including development/test servers).

## 2. Allowed
- Running the plugin on your own server network, with an unlimited number of players.
- Freely changing the configuration and the texts.
- Modifying the source code for your own use, if the plugin comes with source code.
- Including the model in your server's resource pack that players connecting to the server download; this does not count as redistribution.
- Recoloring, resizing and modifying the model for use on your own server.

## 3. Forbidden
- **Passing on, reselling, sharing** or publicly publishing the Product or a modified version of it (e.g. on "leak" sites), even for free.
- Releasing the model's source files (e.g. .bbmodel) or models extracted from the server's resource pack, or using them in another product.
- Reverse engineering the plugin in order to use or distribute parts of it in another product.
- Circumventing or removing the license check or the buyer identification.
- Using the Product in a service provided to other clients (e.g. as part of a sold server package) without separate permission.

## 4. Updates, support
Updates of a purchased Product can be downloaded free of charge in your account for as long as we develop the Product. We provide support {{kapcsolat}} within a reasonable time.

## 5. Termination of the license
The license ends if you breach these terms, and in case of a refund or chargeback. In that case you must delete the Product from your servers and your resource pack. In case of infringing distribution we may ban your account, and take legal action for copyright infringement.

## 6. Copyright
The copyright of the Products belongs to the Provider ({{szolgaltato.nev}}). Minecraft is a trademark of Mojang AB; Avenge Foundry is not affiliated with Mojang or Microsoft.
`
  },
  {
    slug: 'impresszum',
    title: 'Imprint',
    short: 'Imprint',
    updated: '13 November 2026',
    body: `
Under Act CVIII of 2001 on electronic commerce services:

## Provider
{{szolgaltato.tabla}}

## Reseller (payment and invoicing)
The fees for purchases and subscriptions are collected by the following company as reseller (merchant of record), which also issues the invoice:

{{viszontelado.tabla}}

## Hosting providers
{{tarhely.tabla}}

## Supervisory authorities
- Consumer protection: the government office of your place of residence, or the conciliation body
- Data protection: Hungarian National Authority for Data Protection and Freedom of Information (https://naih.hu)

Minecraft is a trademark of Mojang AB. {{szolgaltatas.nev}} is not affiliated with Mojang or Microsoft.
`
  },
  {
    slug: 'cookie',
    title: 'Cookie notice',
    short: 'Cookies',
    updated: '25 November 2026',
    body: `
## What do we store in your browser?
avenge.hu **does not use tracking, advertising or analytics cookies**, so we do not ask for consent with a cookie banner.

Data needed for operation, stored in the browser's local storage (localStorage):

| Key | Purpose | Lifetime |
|---|---|---|
| \`avenge_customer_token\` | customer sign-in | at most 7 days, or until sign-out |
| \`avenge_staff_token\` | staff (PC Check panel) sign-in | at most 8 hours, or until sign-out |
| \`avenge.siteTheme\` | remembering the site's current (seasonal) theme, so it does not flash on load | until you delete it |
| \`avenge.lang\` | the chosen language (Hungarian or English) | until you delete it |

These are strictly necessary for signing in and for the appearance you requested (the exception under Article 5(3) of the ePrivacy Directive), and they are only in your browser.

## Third parties
At checkout you are taken to the **Tebex** payment page; there Tebex uses its own cookies to process the payment securely, under its own notice.

## How can you delete them?
The token is deleted when you sign out; you can delete the data stored by avenge.hu in your browser settings any time.
`
  }
];
