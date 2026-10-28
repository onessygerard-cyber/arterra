import { termsDoc } from "./legal-terms";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDoc = {
  title: string;
  updated: string;
  intro: string[];
  sections: LegalSection[];
};

export { termsDoc };

export const privacyDoc: LegalDoc = {
  title: "Privacy Policy",
  updated: "[[DATE OF LAST UPDATE]]",
  intro: [
    "This policy explains what personal information ARTERRA collects, why, who can see it, and what choices you have.",
    "ARTERRA is operated by [[LEGAL NAME OF THE BUSINESS, REGISTRATION NUMBER AND ADDRESS]]. In this policy, we means that business.",
    "Personal data is handled under Rwanda's data protection law (Law No. 058/2021) where it applies. [[LAWYER: confirm this, whether ARTERRA must register with a regulator, and any statements the law requires.]]",
  ],
  sections: [
    {
      heading: "1. What we collect",
      bullets: [
        "When you request a commission: your name, email or WhatsApp number, a description of what you want, art type, style, size, budget, deadline, delivery location, optional notes, and any reference images you upload.",
        "When you ask about an artwork: your name, contact details and message.",
        "When you apply as an artist: your name, contact details, location, biography, portfolio description, price range, turnaround time, and the art types you work in.",
        "If we ask you to verify your identity: the identity details and supporting documents you send us. [[OWNER: how identity documents are stored and how long they are kept.]]",
        "When you have an artist login: your login email and a password, which is stored only in a scrambled (hashed) form by our authentication provider, plus any profile photo, artwork images and details you add.",
        "For artist payouts and tax, once payouts run through ARTERRA: [[DESCRIBE THE PAYOUT AND TAX DETAILS COLLECTED.]]",
        "During a commission: messages, progress photos, buyer responses to photos, and any review you write.",
        "Technical information: our hosting and authentication providers process details such as your IP address and browser information to deliver the site and keep it secure.",
        "To limit spam on forms, we keep a scrambled (hashed) form of your IP address with the form name and time. It is deleted automatically, normally within a day or two. It is still treated as personal information because it can identify a connection.",
      ],
      paragraphs: [
        "We do not collect payment details, because ARTERRA does not take payments on the site. [[UPDATE THIS WHEN ONLINE PAYMENTS ARE ADDED. THE TERMS DESCRIBE BUYER PAYMENTS, ORDERS AND DELIVERY ADDRESSES.]]",
      ],
    },
    {
      heading: "2. How we use it",
      bullets: [
        "To review artists, match requests with artists, and run commissions from request to delivery.",
        "To show artist profiles, artwork and reviews on the site.",
        "To contact you about your request, inquiry or application.",
        "To keep the site safe, including limiting spam and removing content or accounts that break our terms.",
        "To meet legal obligations.",
      ],
      paragraphs: [
        "We do not sell personal information, and we do not use it for advertising.",
        "[[LAWYER: add the legal basis for each use, as the applicable law requires.]]",
      ],
    },
    {
      heading: "3. Who can see it",
      bullets: [
        "Everyone: an approved artist's public profile (name, location, biography, photo if added, art types, price range, turnaround and shipping details), their approved artwork, and published reviews with the buyer's first name and last initial.",
        "A matched artist: the buyer's name, the request details, reference images, messages and responses to progress photos. We do not give the artist the buyer's contact details.",
        "A buyer: the matched artist's name, the agreed price and timeline, progress photos and messages.",
        "The ARTERRA team: all of the information above, including contact details, so that we can run the service.",
      ],
      paragraphs: [
        "Reference images and progress photos are stored privately and shown only through links that expire after a short time.",
      ],
    },
    {
      heading: "4. Service providers",
      paragraphs: [
        "We use other companies to run ARTERRA. They process information on our behalf.",
      ],
      bullets: [
        "Supabase: our database, artist logins and file storage.",
        "Vercel: hosting and delivery of the website.",
        "An email service: used to send internal notifications to the ARTERRA team, such as a short summary of a new request. [[KEEP ONLY IF EMAIL ALERTS ARE TURNED ON.]]",
        "[[PAYMENT AND SHIPPING PROVIDERS, once they are used. The Terms say ARTERRA may use them.]]",
        "Google Fonts: your browser loads the site's fonts from Google, which means Google receives your IP address and browser details.",
        "WhatsApp and Pinterest: if you use a share button, you are taken to that service, which has its own privacy policy.",
        "[[OWNER AND LAWYER: state where the data is stored (the Supabase project region) and how transfers outside the user's country are handled.]]",
      ],
    },
    {
      heading: "5. Cookies and similar technology",
      paragraphs: [
        "ARTERRA does not use advertising or analytics cookies. Artist and team logins use your browser's storage to keep you signed in. Pieces you save with the heart button are stored only in your own browser and are never sent to us. [[UPDATE THIS IF ANALYTICS ARE ADDED.]]",
      ],
    },
    {
      heading: "6. How long we keep it",
      bullets: [
        "Spam-limit records: deleted automatically, normally within a day or two.",
        "[[OWNER AND LAWYER: how long commission records, messages, reference images and progress photos are kept after a commission ends.]]",
        "[[OWNER AND LAWYER: how long records of rejected artist applications are kept.]]",
      ],
    },
    {
      heading: "7. Your choices and rights",
      bullets: [
        "You can ask what we hold about you, ask us to correct it, or ask us to delete it.",
        "Artists can edit their profile and remove their own artwork and profile photo at any time.",
        "Deleting is not always possible, for example where we must keep records, or where messages have already been shared with the other person in a commission.",
      ],
      paragraphs: [
        "To make a request, contact us at [[CONTACT EMAIL]]. We will reply within [[RESPONSE TIME]].",
        "[[LAWYER: list the rights the applicable law gives people, and how to complain to the regulator.]]",
      ],
    },
    {
      heading: "8. Security",
      paragraphs: [
        "Reference images and progress photos are stored in private storage. Access to the admin area is limited and protected by a login. No system is perfectly secure, so please tell us straight away if you think your information or your tracking link has been exposed.",
      ],
    },
    {
      heading: "9. Children",
      paragraphs: [
        "ARTERRA is for adults, or for people acting through an authorised adult or legal representative. We do not knowingly collect information from children.",
      ],
    },
    {
      heading: "10. Changes to this policy",
      paragraphs: [
        "We may update this policy. The date at the top shows when it last changed.",
      ],
    },
    {
      heading: "11. Contact",
      paragraphs: ["[[CONTACT EMAIL OR WHATSAPP NUMBER]]"],
    },
  ],
};

export function countPlaceholders(doc: LegalDoc): number {
  return (JSON.stringify(doc).match(/\[\[/g) || []).length;
}

export function legalPublished(): boolean {
  return (
    process.env.NEXT_PUBLIC_LEGAL_PUBLISHED === "true" &&
    countPlaceholders(termsDoc) === 0 &&
    countPlaceholders(privacyDoc) === 0
  );
}