# R Factor Family ... architecture review

Written for you, Ryan, not for an engineer. The goal is that you can read this top to bottom and understand what you own, how it fits together, where the soft spots are, and what to do next. No jargon without a plain-English translation.

## What the app is

R Factor Family is a web app that teaches E+R=O to kids and parents through short weekly lessons. A family signs in with Google, creates a profile for each kid (or for a parent learner), and each week the app generates a realistic scenario tailored to that person. The kid reads a situation, sees the two ways to respond (the disciplined response and the default reaction), picks one, answers a reflection question, and moves to the next week. There are 13 weeks per program. A subscription through Stripe gates ongoing access, and the app emails reminders and a welcome.

## How one request flows, start to finish

A parent opens the journey page for their child. The browser asks your app for that page. The page runs on Vercel's servers, checks that the person is logged in, loads that child from the database, figures out which week they are on, and sends back finished HTML. When the lesson needs an AI scenario, the page calls one of your own API endpoints, which builds a prompt from the child's profile, asks Claude to write the scenario, caches the result so the same week does not get regenerated, and returns it. Nothing about your AI keys or database password ever reaches the browser. That separation is the single most important security property of the whole app, and it is built correctly here.

## The stack in plain terms

The app is built on Next.js, which is a framework that lets one codebase handle both the pages people see and the backend logic behind them. It runs on Vercel, which hosts the app and redeploys automatically every time you push to GitHub. Data lives in a PostgreSQL database (hosted on Supabase) and the app talks to it through Prisma, a translation layer that turns database rows into normal code objects so you are not writing raw database queries by hand. Logins run through NextAuth with Google as the provider. Payments run through Stripe. Email runs through Resend. The look of the app is styled with Tailwind. That is the entire toolset, and it is a mainstream, well-supported set of choices ... nothing exotic that would be hard to hire for or hand off later.

## How the code is organized

The codebase is laid out in deliberate layers, which is unusual and frankly better than most apps this size. The layers exist so that the rules of your business live in one place and the plumbing lives somewhere else, and the two do not bleed into each other.

The `domain` folder holds the core ideas with no plumbing attached: what a child profile is, what a lesson navigator does, what a repository must be able to do. The `application` folder holds the use-cases, the actual steps of "create a family" or "get a scenario." The `infrastructure` folder holds the real implementations that touch the outside world: the Prisma database code, the Claude scenario generator, the rate limiter. The `lib` folder is the everyday toolbox: the database connection, the auth config, the email sender, the prompt builder, Stripe helpers. The `app` folder is everything a user actually reaches ... pages and API endpoints. The `content` folder holds the curriculum: the week titles and the lesson material for both the kid and parent programs. The `components` folder holds the reusable visual pieces. The `__tests__` folder holds automated checks.

The payoff of this layout is that when something breaks, the cause is usually findable in one layer. The Settings crash and the scenario error we fixed earlier were both single-layer problems for exactly this reason.

## What gets stored

The database has fifteen tables. The ones that matter to you day to day are Family, Child, LessonProgress, ChallengeResponse, and ScenarioCache, plus the subscription and organization tables for billing and group accounts. There is one design decision worth knowing about because it caused two of the bugs we fixed.

Each Child row stores almost everything about that learner in a single flexible column called `profile` rather than in one column per field. So the child's name, age, grade, friends, triggers, and the rest all live together inside `profile`. Only `track` (which program they are on) and the ownership links sit in their own columns. This is a reasonable choice ... it lets you add new profile questions without changing the database every time. The catch is that code has to remember to read from inside `profile` rather than expecting a plain column, and the two crashes earlier happened precisely where some older code forgot. Those spots are fixed. The thing to carry forward is that any new feature touching a child's details must go through the profile, not around it.

## Two programs, one engine

The kid program and the new parent program do not duplicate each other. They share the same lesson engine, the same scenario generator, the same progress tracking, the same screens. The only thing that changes is the `track` value on the learner and a small set of branches that read it. The curriculum text lives in separate files (the kid weeks and the adult weeks), the AI prompt picks a parent framing or a kid framing based on track, and as of today the profile editor shows parent-appropriate questions for adults instead of grade and school. This is the right way to have built it. Adding a third program later (say, a teen track) would mostly be new content plus a new branch, not a new app.

The one piece of fragility here is that "which fields and which framing apply to which track" is decided in a few different files rather than one. We centralized the list of valid tracks into a single file earlier, which helps, but the form fields and the prompt framing still live apart. That is a maintainability note, not a bug.

## How AI scenarios work

When a lesson needs a scenario, the prompt builder assembles a description of the learner and the week's concept, then asks Claude to return the scene as structured data. Three things protect this path. First, user text is sanitized before it goes into the prompt, so a mischievous profile entry cannot hijack the AI. Second, results are cached per child per week, so you are not paying to regenerate the same scenario and the lesson loads instantly the second time. Third, there is a rate limiter so a single account cannot hammer the AI endpoint. This is a mature setup for an app at this stage.

## Money, email, and login

Billing runs through Stripe with a webhook, meaning Stripe notifies your app when a payment succeeds or a subscription lapses, and the app updates access accordingly. Email runs through Resend and is now hardened so that a bad key announces itself loudly instead of failing silently, which is the change we shipped this week. Login is Google-only through NextAuth in token mode, which is simple and avoids you ever storing passwords. All three are wired correctly. The one open item is that email currently sends from a Resend test address that only reaches your own inbox until you verify a real sending domain.

## What is tested

There are five automated test files covering the highest-stakes logic: organization isolation (making sure one family cannot see another's data), API validation, subscription logic, the email journey, and the lesson navigator. Those are the right things to have guarded. The coverage is thin relative to the size of the app, but it is pointed at the areas where a silent failure would hurt most, which is the correct instinct when you cannot test everything.

## The honest rough edges, ranked

First, TypeScript safety checks are turned off at build time. There is a setting (`ignoreBuildErrors: true`) that tells the build to ship even if the code has type mistakes. This is why the two crashes reached production instead of being caught beforehand. It was likely switched on to get past a deadline. The single highest-value improvement you could make is to fix the handful of type errors and turn that setting back off, so the computer catches this category of bug before your users do.

Second, the profile-in-one-column design is powerful but unforgiving. It has no guardrails ... nothing stops code from reading a field that is not there. The fix is not to redesign it but to route every read through the one entity that knows its shape, which most of the code already does.

Third, track-specific behavior is spread across a few files. As the parent program grows, consider pulling "what does this track look like" into one configuration object that the form, the prompt, and the navigation all read from.

Fourth, test coverage is light. Not alarming for where you are, but each time you fix a bug, the cheapest insurance is to add one small test that would have caught it.

None of these are emergencies. The app is in good shape. These are the things that, handled in this order, keep it healthy as it grows.

## What I would do next

In rough priority: verify a real email domain in Resend so welcome and reminder emails reach families, not just you. Then schedule a short pass to clear the type errors and turn build checking back on. Then, as you add parent content, fold the track rules into one place. Everything else is working and does not need your attention right now.
