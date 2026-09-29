import "server-only";
import { Resend } from "resend";

type Mail = { to: string; subject: string; text: string; html?: string };

/**
 * Sends through Resend when a key is configured. Without one (local dev,
 * tests) it logs the message so nothing silently disappears.
 */
export async function sendEmail(mail: Mail): Promise<{ sent: boolean; id?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email not sent: no RESEND_API_KEY] to=${mail.to} subject=${JSON.stringify(mail.subject)}\n${mail.text}`);
    return { sent: false };
  }
  const resend = new Resend(key);
  const from = process.env.EMAIL_FROM ?? "Clubroom <no-reply@clubroom.local>";
  const { data, error } = await resend.emails.send({ from, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html });
  if (error) throw new Error(error.message);
  return { sent: true, id: data?.id };
}

export function inviteEmail(opts: { clubName: string; role: string; inviterName: string | null; link: string }): Omit<Mail, "to"> {
  const who = opts.inviterName ? `${opts.inviterName} from ${opts.clubName}` : opts.clubName;
  const roleWord = { admin: "an admin", coach: "a coach", parent: "a parent", player: "a player" }[opts.role] ?? opts.role;
  const text = `${who} has added you as ${roleWord} on Clubroom.\n\nOpen this link to set up your login:\n${opts.link}\n\nThe link works for 14 days. If you weren't expecting this, you can ignore it.`;
  return {
    subject: `${opts.clubName} on Clubroom`,
    text,
    html: `<p>${who} has added you as ${roleWord} on Clubroom.</p><p><a href="${opts.link}">Open this link to set up your login</a></p><p style="color:#777">The link works for 14 days. If you weren't expecting this, you can ignore it.</p>`,
  };
}
