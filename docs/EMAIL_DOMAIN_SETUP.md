# Email sending domain ... setup runbook

Plain-English steps to move email off the Resend test address and onto your own domain, so welcome and reminder emails reach real families instead of only your Gmail. Total time once you own the domain is about ten minutes. Do these in order.

## Before you start

You need a domain you own. Recommended: rfactorfamily.com. Buying it through Vercel (vercel.com/domains) is easiest because your app already runs on Vercel and the DNS records below get added almost automatically. Any registrar works, you just paste the records by hand.

Note on the name: "R Factor" is the trademarked program of Tim Kight and Focus 3. Personal and family use is not a concern. If you ever plan to sell or publicly market this, talk to Focus 3 first or choose a different brand name.

## Step 1 ... buy the domain

Go to vercel.com/domains, search rfactorfamily.com, and complete the purchase. This is yours to do. Claude cannot buy it for you.

## Step 2 ... add the domain in Resend

Log in at resend.com. Go to Domains. Click Add Domain. Type rfactorfamily.com and submit. Resend then shows you a list of DNS records, usually three or four: one or more for DKIM (proves the mail is really from you), one for SPF (says which servers may send for you), and an optional DMARC record (policy for handling fakes). Leave this screen open.

## Step 3 ... add the DNS records at your registrar

If you bought through Vercel: open the Vercel dashboard, go to the domain, and add each record Resend listed (type, name, and value, copied exactly). Vercel makes this a simple form.

If you bought elsewhere: log into that registrar, find the DNS settings for the domain, and add each record Resend listed, copying type, name, and value exactly. A single wrong character is the usual reason verification fails.

## Step 4 ... verify in Resend

Back on the Resend Domains screen, click Verify. DNS can take a few minutes to an hour to propagate. When all records show verified, the domain is live for sending. If it stalls, recheck each record value character for character.

## Step 5 ... point the app at the new address

In Vercel, open the rfactor-family project, go to Settings, then Environment Variables. Edit RESEND_FROM_EMAIL and set it to:

    R Factor Family <hello@rfactorfamily.com>

The part in angle brackets must be on your verified domain. The friendly name in front can be anything. Save, then redeploy (Deployments tab, redeploy the latest, or just push any commit).

## Step 6 ... confirm it works

Tell Claude the deploy is up. Claude runs a test send and checks the production logs for an email.sent line and a real delivery to an outside address, not just your own inbox. Once that passes, email is fully production-ready and families will receive welcome and reminder messages.

## What Claude can and cannot do here

Claude can: tell you the exact records to paste, check whether DNS looks right, set up the test, read the logs, and confirm delivery.

Claude cannot: buy the domain, log into Resend or your registrar, or type secret values into any field. Those stay with you, by design. Everything in Steps 1 through 5 is yours to click. Claude handles Step 6 and troubleshooting.
