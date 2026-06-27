// lib/email.ts
//
// Email service using Resend (resend.com).
// Free tier: 3,000 emails/month — covers ~1,000 families with weekly reminders.
//
// Setup:
//   1. resend.com → Create account → Get API key
//   2. Verify your domain (optional but improves deliverability)
//   3. Add RESEND_API_KEY to Vercel environment variables
//   4. Add RESEND_FROM_EMAIL to Vercel (e.g., "R Factor <hello@rfactorfamily.com>")
//
// All templates are plain TypeScript strings — no React Email dependency needed.
// The HTML uses inline styles (email client compatibility requires this).
// Every email includes: unsubscribe link, physical address (CAN-SPAM).

import { Resend } from 'resend'
import { logger, LogEvents } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY ?? '')
const FROM = process.env.RESEND_FROM_EMAIL ?? 'R Factor <hello@rfactorfamily.com>'
const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://rfactor-family.vercel.app'

// ─── CAN-SPAM footer ──────────────────────────────────────────────────────────
// Required by US law: physical mailing address + unsubscribe link.
// Update the address to Ryan's actual business address before launch.

function footer(unsubscribeToken?: string): string {
  const unsubUrl = unsubscribeToken
    ? `${BASE_URL}/api/v1/unsubscribe?token=${unsubscribeToken}`
    : `${BASE_URL}/settings`
  return `
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #E2E8F0;text-align:center;">
      <p style="font-size:11px;color:#9CA3AF;line-height:1.6;margin:0;">
        R Factor Family App · 201 E Fifth Street Suite 700, Cincinnati OH 45202<br>
        <a href="${unsubUrl}" style="color:#9CA3AF;">Unsubscribe</a>
        &nbsp;·&nbsp;
        <a href="${BASE_URL}/settings" style="color:#9CA3AF;">Manage notifications</a>
      </p>
    </div>
  `
}

// ─── Base email wrapper ────────────────────────────────────────────────────────

function wrap(content: string, title: string, previewText = ''): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <meta name="description" content="${previewText}">
  <!-- Preview text hack for Gmail -->
  <span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>
</head>
<body style="margin:0;padding:0;background:#F4F6FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0" role="presentation">
          <!-- Header -->
          <tr>
            <td style="background:#0F2645;border-radius:14px 14px 0 0;padding:32px 32px 24px;">
              <p style="margin:0;font-size:9px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.4);">R Factor Family</p>
              <h1 style="margin:8px 0 0;font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.5px;line-height:1.2;">${title}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#fff;padding:32px;border-radius:0 0 14px 14px;">
              ${content}
              ${footer()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;padding:14px 24px;background:#FF5C35;color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;margin:20px 0;">${text}</a>`
}

// ─── Email templates ──────────────────────────────────────────────────────────

export interface WelcomeEmailData {
  to: string
  familyName: string
  childName: string
  weekOneTitle: string
}

export function welcomeHtml(data: WelcomeEmailData): string {
  const content = `
    <p style="font-size:16px;color:#374151;line-height:1.7;margin:0 0 16px;">
      Hi ${data.familyName} family,
    </p>
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
      You've just started something real. Over the next 13 weeks, ${data.childName} will learn 
      the most practical life skill there is: that they control the R in every E+R=O situation.
    </p>
    <p style="font-size:14px;color:#6B7280;margin:0 0 8px;font-weight:700;">
      First up: ${data.weekOneTitle}
    </p>
    ${button(`Start ${data.childName}'s first lesson →`, `${BASE_URL}/dashboard`)}
    <div style="background:#F4F6FA;border-radius:10px;padding:16px 20px;margin:24px 0 0;">
      <p style="font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#6B7280;margin:0 0 8px;">Add to your home screen</p>
      <p style="font-size:13px;color:#374151;margin:0;line-height:1.5;">
        <strong>iPhone:</strong> Open in Safari → Share → Add to Home Screen<br>
        <strong>Android:</strong> Open in Chrome → ⋮ → Add to Home screen
      </p>
    </div>
  `
  return wrap(content, 'Welcome to R Factor', `${data.childName}'s first lesson is ready.`)
}

// ─── Weekly reminder ──────────────────────────────────────────────────────────

export interface ReminderEmailData {
  to: string
  childName: string
  weekNumber: number
  weekTitle: string
  weekEmoji: string
}

export function reminderHtml(data: ReminderEmailData): string {
  const content = `
    <p style="font-size:32px;margin:0 0 16px;">${data.weekEmoji}</p>
    <p style="font-size:16px;color:#374151;line-height:1.7;margin:0 0 20px;">
      Week ${data.weekNumber} is ready for ${data.childName}: <strong>${data.weekTitle}</strong>.
    </p>
    <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0 0 20px;">
      Each lesson takes about 10 minutes. The best time is whenever you're both calm — 
      dinner done, homework finished, before the next thing starts.
    </p>
    ${button(`Start Week ${data.weekNumber} →`, `${BASE_URL}/dashboard`)}
  `
  return wrap(content, `Week ${data.weekNumber} is ready`, `${data.childName}'s Week ${data.weekNumber} lesson — ${data.weekTitle}`)
}

// ─── Completion email ─────────────────────────────────────────────────────────

export interface CompletionEmailData {
  to: string
  parentName: string
  childName: string
  completedAt: string
  certificateUrl: string
}

export function completionHtml(data: CompletionEmailData): string {
  const content = `
    <div style="text-align:center;padding:8px 0 24px;">
      <p style="font-size:48px;margin:0 0 8px;">🎉</p>
      <p style="font-size:20px;font-weight:900;color:#0F2645;margin:0 0 8px;">${data.childName} finished R Factor.</p>
      <p style="font-size:14px;color:#6B7280;margin:0;">Completed ${data.completedAt}</p>
    </div>

    <!-- Certificate card -->
    <div style="background:#0F2645;border-radius:14px;padding:32px;text-align:center;margin:0 0 24px;">
      <p style="font-size:9px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:0 0 16px;">Certificate of Completion</p>
      <p style="font-size:28px;font-weight:900;color:#fff;margin:0 0 8px;">${data.childName}</p>
      <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0 0 16px;">completed all 13 weeks of the R Factor Family Program</p>
      <p style="font-size:11px;color:rgba(255,255,255,0.4);margin:0;">E + R = O · Character is built one response at a time.</p>
    </div>

    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
      Hi ${data.parentName}, you and ${data.childName} did something most families don't. 
      You showed up 13 times and did the work. That's the R in every E+R=O.
    </p>
    ${button('Download the certificate →', data.certificateUrl)}
    <p style="font-size:13px;color:#9CA3AF;margin:16px 0 0;">
      The program is still there. ${data.childName} can revisit any week, try different scenarios, or start again with a younger sibling.
    </p>
  `
  return wrap(content, `${data.childName} finished R Factor! 🎉`, `All 13 weeks complete. Certificate ready.`)
}

// ─── Re-engagement email ──────────────────────────────────────────────────────

export interface ReengagementEmailData {
  to: string
  childName: string
  weekNumber: number
  daysSinceActive: number
}

export function reengagementHtml(data: ReengagementEmailData): string {
  const content = `
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
      It's been a couple of weeks since ${data.childName} was in R Factor. Week ${data.weekNumber} is still waiting.
    </p>
    <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0 0 20px;">
      No pressure — these things happen. When you're ready, the lesson will take about 10 minutes.
    </p>
    ${button(`Pick up Week ${data.weekNumber} →`, `${BASE_URL}/dashboard`)}
  `
  return wrap(content, `Ready when you are`, `Week ${data.weekNumber} is waiting for ${data.childName}.`)
}

// ─── Send functions ───────────────────────────────────────────────────────────

export type EmailResult = { success: true; id: string } | { success: false; error: string }

// SEC-01 FIX: Never log email addresses in plain text.
// Use a truncated hash as a correlation ID — readable in logs, not reversible.
import { createHash } from 'crypto'
function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 8)
}

// An invalid or expired RESEND_API_KEY is a fixable misconfiguration, not a
// transient send failure. Resend rejects it with an auth-style message. Detect
// that case so it can be logged loudly (and once), and so we stop calling the
// API for the life of this warm instance once we know the key is bad.
let keyRejected = false
function isInvalidKeyError(message: string): boolean {
  const m = message.toLowerCase()
  return (m.includes('api key') && m.includes('invalid')) ||
    m.includes('unauthorized') ||
    m.includes('missing api key') ||
    m.includes('restricted to')
}

async function send(to: string, subject: string, html: string, tag: string): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('email.skipped', { tag, reason: 'RESEND_API_KEY not configured' })
    return { success: false, error: 'Email not configured' }
  }
  if (keyRejected) {
    // Already learned this instance's key is bad. Skip the call rather than
    // hammering Resend and flooding logs; the misconfig was logged once below.
    logger.warn('email.skipped', { tag, reason: 'RESEND_API_KEY previously rejected as invalid' })
    return { success: false, error: 'Email key invalid' }
  }

  const recipientHash = hashEmail(to)  // e.g. 'a3f7c291' — correlatable, not reversible

  function handleFailure(message: string): EmailResult {
    if (isInvalidKeyError(message)) {
      keyRejected = true
      logger.error('email.misconfigured', {
        tag,
        recipientHash,
        error: message,
        action: 'RESEND_API_KEY is set but Resend rejected it as invalid. Replace it in the Vercel project (Settings -> Environment Variables) with a valid key from resend.com, then redeploy. No emails are being delivered until then.',
      })
    } else {
      logger.error('email.send_failed', { tag, recipientHash, error: message })
    }
    return { success: false, error: message }
  }

  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) return handleFailure(error.message)
    logger.info('email.sent', { tag, recipientHash, id: data?.id })
    return { success: true, id: data?.id ?? '' }
  } catch (e) {
    return handleFailure(e instanceof Error ? e.message : String(e))
  }
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  return send(
    data.to,
    `Welcome to R Factor, ${data.familyName} family!`,
    welcomeHtml(data),
    'welcome'
  )
}

export async function sendReminderEmail(data: ReminderEmailData): Promise<EmailResult> {
  return send(
    data.to,
    `${data.childName}'s Week ${data.weekNumber} lesson is ready`,
    reminderHtml(data),
    'reminder'
  )
}

export async function sendCompletionEmail(data: CompletionEmailData): Promise<EmailResult> {
  return send(
    data.to,
    `${data.childName} finished R Factor! 🎉`,
    completionHtml(data),
    'completion'
  )
}

export async function sendReengagementEmail(data: ReengagementEmailData): Promise<EmailResult> {
  return send(
    data.to,
    `Ready when you are — Week ${data.weekNumber} is waiting`,
    reengagementHtml(data),
    'reengagement'
  )
}
