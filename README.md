# Gmail Recruitment Email Sender

A local Node.js + TypeScript application that sends a professional, personalized HTML email to job candidates — one by one — from your Gmail account using Nodemailer and a Gmail App Password.

Built for HR/Admin teams to notify candidates after the hiring process, with retries, logging, statistics, clipboard shortcuts, and exported result files.

## Features

- Sends emails **individually** (one recipient per email — addresses are never exposed to other candidates)
- Modern, responsive HTML template with inline CSS (renders correctly in Gmail, Outlook, mobile)
- Personalized greeting per candidate
- Random 5–10 second delay between emails
- Up to 3 attempts per email; failed emails are skipped and the run continues
- Colored console logs + persistent `output/email-log.txt`
- Final statistics (total / success / failed / execution time)
- Interactive menu: copy success/failed/all emails to clipboard, open output folder
- Auto-exported result files (txt, csv, json)
- `npm run retry` — resend **only** to previously failed recipients

## Requirements

- Node.js 18+ (LTS recommended)
- A Gmail account with **2-Step Verification** enabled
- A Gmail **App Password** — create one at https://myaccount.google.com/apppasswords

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env        # Windows: copy .env.example .env

# 3. Edit .env and set at minimum:
#    GMAIL_USER=your-email@gmail.com
#    GMAIL_APP_PASSWORD=your 16-character app password
#    (also update company/signature details)

# 4. Add your candidates
#    Edit src/data/candidates.ts

# 5. Run
npm run dev
```

## Scripts

| Command             | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Send to all candidates in `src/data/candidates.ts`   |
| `npm run retry`     | Resend only to recipients that failed in the last run |
| `npm run build`     | Compile TypeScript to `dist/`                        |
| `npm start`         | Run the compiled build                               |
| `npm run typecheck` | Type-check without emitting files                    |

## Changing the subject / content

- **Subject:** set `EMAIL_SUBJECT` in `.env` (default: `Regarding Your Job Application`)
- **Sender name & signature:** `SENDER_NAME`, `HR_NAME`, `HR_TITLE`, `HR_EMAIL`, `HR_PHONE`, `COMPANY_NAME`, `COMPANY_WEBSITE`, optional `COMPANY_LOGO_URL` in `.env`
- **Message body / design:** edit `src/templates/rejectionEmail.ts`
- **Delays & retries:** `MIN_DELAY_SECONDS`, `MAX_DELAY_SECONDS`, `MAX_RETRIES`, `RETRY_DELAY_SECONDS` in `.env`

## Output files

After every run, the `output/` folder contains:

```
output/
├── success-emails.txt      # one successful address per line
├── failed-emails.txt       # one failed address per line
├── success-emails.csv      # email,name,status,attempts,sent_at,error
├── failed-emails.csv       # same columns for failed sends
├── failed-recipients.json  # {email, name} objects — used by `npm run retry`
├── summary.json            # totals, counts, execution time, timestamps
└── email-log.txt           # full timestamped log of every run (appended)
```

## Interactive menu

When the run finishes you'll see:

```
Press:

[S] → Copy Successful Emails
[F] → Copy Failed Emails
[A] → Copy All Recipient Emails
[O] → Open Output Folder
[Q] → Quit
```

Clipboard support is built in for Windows (`clip`), macOS (`pbcopy`) and Linux (`xclip`/`xsel`). If no clipboard tool is available, the list is printed to the console instead — and it's always saved in `output/` regardless.

## Project structure

```
src/
├── config/
│   └── env.ts               # dotenv loading + validation
├── data/
│   └── candidates.ts        # recipient list
├── logger/
│   └── logger.ts            # console + file logger
├── services/
│   ├── emailService.ts      # SMTP, retries, sequential sending
│   └── exportService.ts     # txt/csv/json exports
├── templates/
│   └── rejectionEmail.ts    # responsive HTML + plain-text template
├── types/
│   └── index.ts             # shared interfaces
├── utils/
│   ├── clipboard.ts         # cross-platform clipboard
│   ├── delay.ts             # sleep / random delay
│   ├── openFolder.ts        # open output folder in file explorer
│   └── time.ts              # duration formatting
└── index.ts                 # entry point / orchestration
```

## Important notes

- **Never commit `.env`** — it contains your Gmail App Password (already ignored via `.gitignore`).
- Gmail has daily sending limits (~500/day for personal accounts, ~2,000/day for Google Workspace). For very large batches, split across days.
- The random delay between emails keeps sending behaviour natural and reduces the chance of Gmail rate-limiting the account.

## Troubleshooting

| Problem                          | Fix                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| `Invalid login: 535 ...`         | Use an **App Password**, not your normal password; enable 2-Step Verification first. |
| `Missing required environment…`  | Copy `.env.example` to `.env` and fill in `GMAIL_USER` / `GMAIL_APP_PASSWORD`.       |
| Emails land in spam              | Add a real `COMPANY_LOGO_URL`, keep the subject professional, warm up the account.   |
| Clipboard doesn't work on Linux  | Install `xclip` (`sudo apt install xclip`) or use the files in `output/`.            |
