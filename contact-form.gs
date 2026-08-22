/**
 * Contact form backend for chinmay4github1987.github.io/portfolio_global
 * -------------------------------------------------
 * Does two things on every submission:
 *   1. appends a row to the bound Google Sheet  (your database)
 *   2. emails you the details from your own Gmail
 *
 * Setup — about five minutes:
 *   1. Go to sheets.new and name the sheet e.g. "Portfolio enquiries".
 *   2. Extensions -> Apps Script. Delete the placeholder code.
 *   3. Paste this whole file in. Save.
 *   4. Set NOTIFY_EMAIL below if you want it to go somewhere else.
 *   5. Deploy -> New deployment -> type: Web app
 *        Execute as:        Me
 *        Who has access:    Anyone            <- must be "Anyone", not "Anyone with Google account"
 *      Authorize when prompted (the "unverified app" warning is your own script — Advanced -> Go to ...).
 *   6. Copy the Web app URL. It ends in /exec.
 *   7. Paste it into index.html as CONTACT.APPS_SCRIPT_URL.
 *
 * After changing this file you must Deploy -> Manage deployments -> edit -> Version: New version,
 * otherwise the live URL keeps serving the old code.
 */

var NOTIFY_EMAIL = 'chinmaymoharana2011@gmail.com';
var SHEET_NAME   = 'Enquiries';
var HEADERS      = ['Timestamp', 'Name', 'Email', 'Subject', 'Message', 'Page', 'IP hint'];

function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};

    // Honeypot: bots fill the hidden "company" field. Accept silently, store nothing.
    if (p.company) return json({ result: 'success', message: 'ok' });

    var name    = clean(p.name, 80);
    var email   = clean(p.email, 120);
    var subject = clean(p.subject, 120);
    var message = clean(p.message, 4000);

    if (!name || !message)     return json({ result: 'error', message: 'Name and message are required.' });
    if (!isEmail(email))       return json({ result: 'error', message: 'A valid email address is required.' });

    var when = new Date();
    var row  = [when, name, email, subject || '(no subject)', message, clean(p.page, 300), ''];

    sheet().appendRow(row);
    notify(name, email, subject, message, when);

    return json({ result: 'success', message: 'Saved and sent.' });
  } catch (err) {
    return json({ result: 'error', message: String(err) });
  }
}

/** Lets you open the /exec URL in a browser to check the deployment is live. */
function doGet() {
  return json({ result: 'success', message: 'Contact endpoint is running.' });
}

function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 160);
    sh.setColumnWidth(5, 460);
  }
  return sh;
}

function notify(name, email, subject, message, when) {
  var line = subject || 'Portfolio enquiry';
  var body =
    'New message from your portfolio contact form.\n\n' +
    'Name:    ' + name + '\n' +
    'Email:   ' + email + '\n' +
    'Subject: ' + (subject || '(none)') + '\n' +
    'Time:    ' + Utilities.formatDate(when, Session.getScriptTimeZone(), 'd MMM yyyy, HH:mm') + '\n\n' +
    '--------------------------------------------\n' +
    message + '\n' +
    '--------------------------------------------\n\n' +
    'Reply straight to this email to answer ' + name + '.';

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: '[Portfolio] ' + line,
    body: body,
    replyTo: email,
    name: 'Portfolio contact form'
  });
}

function clean(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Run this once from the editor to check the sheet and email both work. */
function testSubmission() {
  var out = doPost({ parameter: {
    name: 'Test sender',
    email: 'test@example.com',
    subject: 'Test submission',
    message: 'If you can read this in the sheet and in your inbox, the backend is working.',
    page: 'manual test'
  }});
  Logger.log(out.getContent());
}
