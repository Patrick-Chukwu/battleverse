import { Link, useLocation } from "react-router-dom";

const pages = {
  privacy: {
    title: "Privacy Policy",
    updated: "9 September 2026",
    sections: [
      {
        heading: "Who we are",
        body: "Battleverse is a quiz and exam-practice app. This page explains what we collect and why, in plain language. We follow Nigeria’s NDPR and keep child-safety defaults tight for ages 6–16.",
      },
      {
        heading: "What we collect",
        body: "If you create an account: email, a username, an emoji avatar, and an optional age band. If you opt in so friends can find you, we store a hash of your email and (optionally) phone — never a public phone book. We also store quiz answers, XP, badges, and battle membership so the product works. Guests play locally; we do not put guest scores on the global leaderboard.",
      },
      {
        heading: "What we do not collect",
        body: "No precise GPS, no contacts dump, no face photos, no payment cards, and no chat (there is no chat). We do not sell personal data or run behavioural ads.",
      },
      {
        heading: "How findability works",
        body: "Discoverability is off until you turn it on. Search is an exact match, not “people near you.” Under-13 age bands stay hidden from email and phone search even if discoverability is on.",
      },
      {
        heading: "Your choices",
        body: "You can change username, avatar, age band, and findability in Profile. You can sign out any time. To delete an account, write from the same email you signed in with (reply to a Battleverse sign-in message). We will remove the profile and stop using the hashes for search.",
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    updated: "9 September 2026",
    sections: [
      {
        heading: "The short version",
        body: "Battleverse is a free learning game. Be kind, do not cheat live battles, and do not use someone else’s account. Practice can work offline; live battles and challenges need a connection.",
      },
      {
        heading: "Accounts and guests",
        body: "You may continue as a guest for Practice. Guests are not ranked on the global leaderboard and cannot start live battles or challenges. Creating an account means you agree to these Terms and the Privacy Policy.",
      },
      {
        heading: "Children",
        body: "The app is meant for learners from about 6 years old upward, plus older exam candidates. Under-13 accounts default to not being findable by email or phone. A parent or guardian should help with the first sign-in when the learner is under 13.",
      },
      {
        heading: "Content and scores",
        body: "Questions may be practice items, not official exam papers. Timed exam mode hides hints until you submit. Server XP and battle scores are the source of truth; the device may show an optimistic number first.",
      },
      {
        heading: "Acceptable use",
        body: "Do not harass other players, scrape the question bank, or try to break matchmaking. We may suspend accounts that abuse invites or the leaderboard.",
      },
      {
        heading: "Contact",
        body: "Account deletion and privacy questions: send a message from the email you use to sign in (reply to a Battleverse magic-link email). There is no in-app chat.",
      },
    ],
  },
} as const;

const LegalPage = () => {
  const { pathname } = useLocation();
  const slug = pathname.includes("terms") ? "terms" : "privacy";
  const page = slug === "terms" ? pages.terms : pages.privacy;

  return (
    <div className="min-h-screen bg-background px-4 pt-24 pb-16">
      <article className="glass-card mx-auto w-full max-w-2xl rounded-3xl p-8 sm:p-12">
        <p className="mb-2 text-xs font-black tracking-widest text-primary uppercase">Legal</p>
        <h1 className="mb-2 text-4xl font-black tracking-tight">{page.title}</h1>
        <p className="mb-8 text-sm font-bold text-muted-foreground">Last updated {page.updated}</p>
        <div className="space-y-6">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-2 text-xl font-black">{section.heading}</h2>
              <p className="font-medium leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm font-bold text-muted-foreground">
          Also see{" "}
          <Link to={slug === "terms" ? "/privacy" : "/terms"} className="text-primary underline">
            {slug === "terms" ? "Privacy Policy" : "Terms of Use"}
          </Link>
          {" · "}
          <Link to="/login" className="text-primary underline">
            Sign in
          </Link>
        </p>
      </article>
    </div>
  );
};

export default LegalPage;
