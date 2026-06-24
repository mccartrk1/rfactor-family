# Organization Onboarding Guide

How to set up a new organization (school, church, Focus 3 cohort, corporate partner).

---

## Prerequisites

- Migration 005 applied (Organization tables)
- Migration 006 applied (billing fields + Waitlist + Referral)
- Admin logged into app with email in ADMIN_EMAILS env var

---

## Step 1: Create the organization

**Via admin UI (recommended):**

1. Sign in at rfactor-family.vercel.app/auth/login
2. Navigate to /admin/orgs
3. Click "+ New organization"
4. Fill in:
   - **Slug**: URL-safe identifier (e.g., `focus3`, `westside-church`)
   - **Name**: Display name (e.g., "Focus 3", "Westside Church")
   - **Tier**: pilot / pro / enterprise
   - **Max families**: Number of families allowed
   - **Brand color**: Hex color for their white-label header
   - **Admin email**: Their admin's email (must have signed in before)

**Via API (for programmatic setup):**
```bash
curl -X POST https://rfactor-family.vercel.app/api/v1/admin/orgs \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "focus3",
    "name": "Focus 3",
    "tier": "enterprise",
    "maxFamilies": 500,
    "primaryColor": "#0056D6",
    "adminEmail": "andy@focus3.com"
  }'
```

---

## Step 2: Create invite codes for the org

**Via admin UI:**
1. Go to /admin/orgs/focus3
2. Click "+ Create" next to Invite codes
3. Create codes (e.g., `focus3-2025`, `focus3-team1`, `focus3-team2`)

**Via API:**
```bash
curl -X POST https://rfactor-family.vercel.app/api/v1/admin/invites \
  -H "Cookie: ..." \
  -H "Content-Type: application/json" \
  -d '{ "code": "focus3-2025", "note": "Focus 3 cohort Jan 2025", "organizationId": "org_..." }'
```

**Note:** Invite codes created via the admin invites page currently go to the default org.
To create org-scoped invite codes, use the API with `organizationId` parameter.
UI improvement for org-scoped invite creation is in the backlog.

---

## Step 3: Assign branding

1. Go to /admin/orgs/[slug]/settings
2. Update:
   - **Brand color**: Their primary brand color (#RRGGBB format)
   - **Logo URL**: Public HTTPS URL to their logo image
3. Preview in the branding block on the settings page
4. Save — changes take effect immediately for all families in this org

**Logo requirements:**
- Must be HTTPS URL
- Recommended size: 200×50px (horizontal)
- Transparent background preferred
- Will appear inverted white in the dashboard header

---

## Step 4: Share enrollment instructions with the org

Send this to the org admin to share with their families:

---
**Enrollment instructions for [Org Name] families:**

1. Go to: rfactor-family.vercel.app
2. Sign in with Google
3. Use invite code: `[code]` when prompted
4. Complete the 5-minute onboarding for each child
5. Install to your home screen for the best experience

**Your access:** [Org Name] families have access through [org end date or "the partnership"].

---

## Step 5: Verify the setup

```bash
# Check org was created
curl https://rfactor-family.vercel.app/api/v1/admin/orgs/focus3 \
  -H "Cookie: ..."

# Should return:
# { data: { org: { slug: "focus3", name: "Focus 3", familyCount: 0, ... } } }
```

---

## Org tier capabilities

| Tier | Max families | Custom branding | Analytics export | Support |
|------|---|---|---|---|
| Pilot | 50 | No (default R Factor colors) | No | Email |
| Pro | 500 | Yes | Yes | Priority email |
| Enterprise | Unlimited | Yes (+ logo) | Yes + research data | Dedicated manager |

---

## Focus 3 specific setup

For the Focus 3 partnership (Focus 3 using R Factor Family for their employees/clients):

1. Create org slug: `focus3`
2. Tier: `enterprise`
3. Admin email: Andy Hills' account (andy@focus3.com or equivalent)
4. Brand color: Focus 3 orange (#FF5C00 — confirm with their brand guide)
5. Max families: start at 100, increase as needed
6. Special feature: Connect to LEAD NOW CORPORATE system when ready

---

## Troubleshooting

**Family can't join with invite code:**
- Check the invite code belongs to the right org (admin/orgs/[slug] → invite codes)
- Verify the code hasn't been used (each code is single-use)
- Verify the org's maxFamilies limit hasn't been reached

**Branding not showing:**
- Verify family belongs to the org (admin/families/[id] → check organizationId)
- Verify org.isActive = true (inactive orgs don't apply branding)
- Verify the family is NOT in the default 'org_default_pilot' org

**Org admin can't see their dashboard:**
- Verify their email is in OrganizationMember table with role='admin'
- Org member admin view is not yet built — they use the standard /admin with org filter
- Full org-admin self-service portal is in Phase 2 roadmap
