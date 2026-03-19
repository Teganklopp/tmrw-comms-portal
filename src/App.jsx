import { useState, useEffect, useCallback } from "react";

// === DATA ===
const STATUSES = ["Live", "Approved", "Planned", "Blocked", "Cut"];
const SM = {
  Live: { c: "#10b981", bg: "#ecfdf5", i: "L" },
  Approved: { c: "#3b82f6", bg: "#eff6ff", i: "A" },
  Planned: { c: "#eab308", bg: "#fefce8", i: "P" },
  Blocked: { c: "#ef4444", bg: "#fef2f2", i: "B" },
  Cut: { c: "#94a3b8", bg: "#f8fafc", i: "X" },
};
const CHANNELS = ["Email", "SMS", "WhatsApp", "Call", "Slack"];
const CM = {
  Email: { c: "#1e40af", bg: "#dbeafe" },
  SMS: { c: "#92400e", bg: "#fef3c7" },
  WhatsApp: { c: "#065f46", bg: "#d1fae5" },
  Call: { c: "#7e22ce", bg: "#f3e8ff" },
  Slack: { c: "#0f172a", bg: "#e2e8f0" },
};
const FD = {
  waitlist: { name: "Waitlist Funnel", color: "#6366f1", doc: "Waitlist_Pre-Registration.docx" },
  "dead-zone": { name: "Dead Zone", color: "#0891b2", doc: "TMRW-Dead-Zone-Final.docx" },
  "dashboard-unlock": { name: "Dashboard Unlock", color: "#d946ef", doc: "dashboard-unlock-v2.docx" },
  "blood-test": { name: "Blood Test", color: "#dc2626", doc: "tmrw-blood-test-v4.docx" },
  "precision-pods": { name: "Precision Pods", color: "#ea580c", doc: "TMRW_Precision_Pod_Emails.docx" },
};
const STAGES = [
  "Waitlist & Pre-Registration", "Registration & Checkout", "Health Story & Welcome Call",
  "Kit Fulfillment & Sample", "Lab Processing & Analysis", "Results & Insights Call",
  "Supplement Conversions", "Ongoing Journey", "Retention & Churn",
  "Supplement Adherence", "Retest Cycle", "Post-Retest",
  "Medical Membership", "Supplement Fulfillment", "Advanced Testing", "Manual Templates",
];
const STAGE_SHORT = ["Waitlist", "Checkout", "Health Story", "Kit", "Lab", "Results", "Supps", "Ongoing", "Retention", "Adherence", "Retest", "Re-Loop", "Medical", "Fulfil", "Testing", "Templates"];

const T = (id, seq, title, subj, stage, status, ch, flow, cat, notes) => ({
  id, seq: seq || "", title, subject: subj || "", stage, status,
  channels: ch, flow: flow || null, cat, notes: notes || "",
});

const INIT_TPS = [
  // Waitlist - New funnel (replaces old live items)
  T("w01", "0.1", "Waitlist Signup Confirmation", "You're on the list.", STAGES[0], "Live", ["Email", "SMS"], "waitlist", "new", ""),
  T("w02", "0.2", "Nurture: What TMRW Actually Does", "Most people wait. You didn't.", STAGES[0], "Live", ["Email"], "waitlist", "new", ""),
  T("w03", "0.3", "Nurture: Proof It Works", "TBD", STAGES[0], "Blocked", ["Email"], "waitlist", "new", "Awaiting confirmed member story"),
  T("w04", "0.4", "Your Spot Is Coming", "Your spot opens in five days.", STAGES[0], "Approved", ["Email", "SMS"], "waitlist", "new", "TRIGGER: Needs manual scheduling or date field. No automated trigger exists yet."),
  T("w05", "0.5", "Your Spot Is Ready", "Your spot is ready.", STAGES[0], "Approved", ["Email", "SMS"], "waitlist", "new", "TRIGGER: Needs event for when spot opens. Currently manual send. 48hr window starts here."),
  T("w06", "0.6", "Your Spot Expires Tomorrow", "Your spot expires tomorrow.", STAGES[0], "Approved", ["Email", "SMS"], "waitlist", "new", "TRIGGER: 24hrs before 48hr window closes. Needs timer from 0.5 send time."),
  T("w07a", "0.7a", "One Question Before You Go", "Did we get the timing wrong?", STAGES[0], "Approved", ["Email", "SMS"], "waitlist", "new", "TRIGGER: 24-48hrs after expiry, if still active. Needs timer + condition check."),
  T("w07b", "0.7b", "Reengagement (Lapsed)", "We owe you an update.", STAGES[0], "Approved", ["Email", "SMS"], "waitlist", "new", "TRIGGER: Members silent 3+ months. Needs segment identification in CRM."),
  // Registration - Live
  T("rc1", "", "Order Confirmation", "Your membership is confirmed", STAGES[1], "Live", ["Email"], null, "live", "CRM 1.1"),
  T("rc3", "", "Cart Abandon 1 Hour", "Your body is already writing tomorrow", STAGES[1], "Live", ["Email"], null, "live", "CRM 1.3"),
  T("rc4", "", "Cart Abandon 24 Hours", "This is the part where most people bounce", STAGES[1], "Live", ["Email"], null, "live", "CRM 1.4"),
  T("rc6", "", "Cart Abandon (+72h) Social Proof", "", STAGES[1], "Live", ["Email"], null, "live", ""),
  T("rc7", "", "Payment Reminder Sequence", "", STAGES[1], "Live", ["Email", "SMS"], null, "live", ""),
  T("rc8", "", "Payment Failed (+1d)", "", STAGES[1], "Live", ["Email"], null, "live", ""),
  T("rc9", "", "Referral/Advocate Confirmation", "", STAGES[1], "Live", ["Email"], null, "live", ""),
  // Health Story - Live
  T("hs1", "", "Login Reminder (+24h)", "Login to share your Health Story", STAGES[2], "Live", ["Email"], null, "live", "CRM 2.1"),
  T("hs2", "", "First Login Celebration", "", STAGES[2], "Live", ["Email"], null, "live", ""),
  T("hs3", "", "Login Reminder (+3 days)", "Your TMRW journey is waiting for you", STAGES[2], "Live", ["Email"], null, "live", "CRM 2.3"),
  T("hs4", "", "Collection Day Prep Reminder", "", STAGES[2], "Live", ["SMS"], null, "live", ""),
  T("hs5", "", "Health Story Started Not Complete (+48h)", "Complete your Story to unlock your Big Insights", STAGES[2], "Live", ["Email"], null, "live", "CRM 2.4"),
  T("hs6", "", "Health Story Completed", "Your Story is complete. What happens next.", STAGES[2], "Live", ["Email"], null, "live", "CRM 2.5"),
  T("hs7", "", "Welcome Call Booking (+1d)", "", STAGES[2], "Live", ["Email", "WhatsApp"], null, "live", ""),
  T("hs8", "", "Welcome Call Check-in (+3d)", "", STAGES[2], "Live", ["Email"], null, "live", ""),
  T("hs8b", "", "We're Making Your Goal (+7d)", "", STAGES[2], "Live", ["Email"], null, "live", ""),
  T("hs9", "", "Welcome Call Invite", "", STAGES[2], "Live", ["Email"], null, "live", ""),
  T("hs10", "", "Welcome Call Booking Confirmation", "", STAGES[2], "Live", ["Email"], null, "live", ""),
  T("hs10b", "", "Welcome Call Booking Reminder", "", STAGES[2], "Live", ["Email", "SMS"], null, "live", ""),
  T("hs11", "", "Welcome Call Reminder (Day Of)", "", STAGES[2], "Live", ["Email", "SMS"], null, "live", ""),
  T("hs12", "", "Welcome Call No-Show Follow-up", "", STAGES[2], "Live", ["Email", "WhatsApp"], null, "live", ""),
  T("hs13", "", "Call at TMRW Office", "", STAGES[2], "Live", ["Email"], null, "live", ""),
  // Kit Fulfillment - Live + Blood Test new
  T("kf1", "", "Kit Shipped + Prep Instructions", "Little Prick Test is on the way", STAGES[3], "Live", ["Email"], null, "live", "CRM 3.1"),
  T("kf2", "", "Kit Delivered Confirmation", "", STAGES[3], "Live", ["Email"], null, "live", ""),
  T("kf3", "", "Sample Treated Content (+3d)", "", STAGES[3], "Live", ["Email"], null, "live", ""),
  T("kf4", "", "Sample Kit Waiting (+7d)", "", STAGES[3], "Live", ["Email", "SMS"], null, "live", ""),
  T("kf5", "", "Sample Not Received (+14d)", "", STAGES[3], "Live", ["Email", "WhatsApp"], null, "live", ""),
  T("kf6", "", "Bloods Ready / Blood Sample Call", "", STAGES[3], "Live", ["Email"], null, "live", ""),
  T("kf7", "", "Kit Hassle / Expired (+14d)", "", STAGES[3], "Live", ["Email"], null, "live", ""),
  T("kf8", "", "QC Pass + Coach Assigned", "Sample collected and on its way to our lab", STAGES[3], "Live", ["Email"], null, "live", "CRM 3.5"),
  T("bt1", "BT-1", "Requisition Sent", "Your blood test requisition is ready", STAGES[3], "Approved", ["Email", "SMS", "Slack"], "blood-test", "new", "TRIGGER: VA moves member to Requisition Sent in pipeline. Pipeline needs building in Attio/CRM."),
  T("bt2", "BT-2", "Blood Test 5-Day Follow-Up", "Have you had your blood test?", STAGES[3], "Approved", ["Email"], "blood-test", "new", "TRIGGER: 5 business day delay after BT-1. Confirm with Kosta: business day delays or 7 calendar days?"),
  T("bt3", "BT-3", "Blood Test Results Received", "Your blood test results are in.", STAGES[3], "Approved", ["Email", "SMS", "Slack"], "blood-test", "new", "TRIGGER: VA uploads to Oracle then moves to Results Received. Two manual actions required."),
  // Lab Processing - Dead Zone (replaces old live items)
  T("dz1", "DZ-1", "Sample Received - Lab Started", "Your sample is with us.", STAGES[4], "Approved", ["Email", "SMS"], "dead-zone", "new", "TRIGGER: sample_received_lab event. Needs platform build."),
  T("dz2", "DZ-2", "Inside Scoop: Sleep (+3d)", "Inside Scoop (Sleep)", STAGES[4], "Approved", ["Email"], "dead-zone", "new", "TRIGGER: sample_received + 3 days. Automated delay."),
  T("dz3", "DZ-3", "Inside Scoop: Brain Fog (+7d)", "Inside Scoop (Brain Fog)", STAGES[4], "Approved", ["Email"], "dead-zone", "new", "TRIGGER: sample_received + 7 days. Automated delay."),
  T("dz4", "DZ-4", "Results Preview (+12d)", "Your results are getting closer.", STAGES[4], "Approved", ["Email", "SMS"], "dead-zone", "new", "TRIGGER: sample_received + 12 days. Automated delay."),
  T("dz5", "DZ-5", "Inside Scoop: Health Habits (+16d)", "Inside Scoop (Health Habits)", STAGES[4], "Approved", ["Email"], "dead-zone", "new", "TRIGGER: sample_received + 16 days AND results not ready. Needs condition gate."),
  T("dz6", "DZ-6", "Still Here Check-in (+18d)", "Still here.", STAGES[4], "Approved", ["Email"], "dead-zone", "new", "TRIGGER: sample_received + 18 days AND results not ready. Needs condition gate."),
  T("dz7", "DZ-7", "Delay Acknowledgment (+22d)", "An update on your results.", STAGES[4], "Approved", ["Email", "SMS"], "dead-zone", "new", "TRIGGER: sample_received + 22 days AND results not ready. Needs condition gate."),
  T("dz8", "DZ-8", "Clinician Manual Outreach (+28d)", "Personal email or call", STAGES[4], "Approved", ["Email", "Call"], "dead-zone", "new", "TRIGGER: Day 28 or member replies with frustration. Creates task in HubSpot. Not automated."),
  T("dzq1", "QC-1", "QC Fail: Internal", "We need to redo your test.", STAGES[4], "Approved", ["Email", "SMS"], "dead-zone", "new", "TRIGGER: qc_fail_internal event. Needs flag in system."),
  T("dzq2", "QC-2", "QC Fail: Lab", "Something went wrong on our end.", STAGES[4], "Approved", ["Email", "SMS", "Call"], "dead-zone", "new", "TRIGGER: qc_fail_lab event. Needs flag in system + phone call from clinician."),
  // Results - Live + Dashboard Unlock new
  T("ri1", "", "Insights Call Booking Confirmation", "Your Better TMRW Plan Call is confirmed", STAGES[5], "Live", ["Email"], null, "live", "CRM 5.1"),
  T("ri2", "", "Day Before Call Reminder", "Your Better TMRW Plan Call is tomorrow", STAGES[5], "Live", ["Email"], null, "live", "CRM 5.2"),
  T("ri3", "", "Day Of Call Reminder", "Your Better TMRW Plan Call is today", STAGES[5], "Live", ["Email", "SMS"], null, "live", "CRM 5.3"),
  T("ri4", "", "Call Rescheduled", "Your Better TMRW Plan Call has been rescheduled", STAGES[5], "Live", ["Email"], null, "live", "CRM 5.4"),
  T("ri5", "", "Call Cancelled", "Your Better TMRW Plan Call has been cancelled", STAGES[5], "Live", ["Email"], null, "live", "CRM 5.5"),
  T("ri6", "", "Call No Show", "We missed you today", STAGES[5], "Live", ["Email", "SMS"], null, "live", "CRM 5.6"),
  T("ri7", "", "Dashboard Unlocked", "", STAGES[5], "Live", ["Email"], null, "live", ""),
  T("du1", "DU-1", "Dashboard Is Live", "Your TMRW Dashboard is live", STAGES[5], "Blocked", ["Email", "SMS"], "dashboard-unlock", "new", "BLOCKED: Waiting on Membership ID to trigger. Needs Oracle checkbox integration."),
  T("du2", "DU-2", "Nudge: Biological Clocks (+3d)", "Have you seen your biological clocks?", STAGES[5], "Approved", ["Email", "SMS"], "dashboard-unlock", "new", "TRIGGER: 3 days after DU-1. Stop if member replies or books call."),
  T("du3", "DU-3", "Name the Friction (+8d)", "Quick question", STAGES[5], "Approved", ["Email"], "dashboard-unlock", "new", "TRIGGER: 8 days after DU-1. Stop if member replies or books call. No SMS."),
  T("du4", "DU-4", "Clinician Manual Outreach (+10d)", "Personal message", STAGES[5], "Approved", ["Email", "Call", "Slack"], "dashboard-unlock", "new", "TRIGGER: Day 10, no engagement. Clinician task, not automated."),
  // Supplement Conversions - Live + Broadcast
  T("sc1", "", "Supplement Plan Explained", "", STAGES[6], "Live", ["Email"], null, "live", ""),
  T("sc2", "", "Monthly Fitness Check-in", "", STAGES[6], "Live", ["Email"], null, "live", ""),
  // Ongoing
  T("oj1", "", "Post Results Check-in (+7d)", "One week on: how are your results landing?", STAGES[7], "Live", ["Email"], null, "live", "CRM 6.1"),
  // Retention
  T("oj2", "", "Monthly Clinician Check-in (3-monthly)", "Book your check-in call", STAGES[8], "Live", ["Email"], null, "live", "CRM 6.2"),
  T("ret1", "", "NPS Survey", "", STAGES[8], "Live", ["Email"], null, "live", ""),
  // Adherence - Live
  T("sa1", "", "Daily Sachet Delivered", "", STAGES[9], "Live", ["Email"], null, "live", ""),
  T("sa2", "", "How Are Your Supplements? (+7d)", "", STAGES[9], "Live", ["Email", "WhatsApp"], null, "live", ""),
  T("sa3", "", "Restock Kit Shipped", "", STAGES[9], "Live", ["Email"], null, "live", ""),
  T("sa4", "", "Restock Kit Delivered", "", STAGES[9], "Live", ["Email"], null, "live", ""),
  T("sa5", "", "Update Call Booking Confirmation", "", STAGES[9], "Live", ["Email"], null, "live", ""),
  T("sa6", "", "Update Call Reminder", "", STAGES[9], "Live", ["Email", "SMS"], null, "live", ""),
  T("sa7", "", "Update Call Day Of Reminder", "", STAGES[9], "Live", ["Email", "SMS"], null, "live", ""),
  T("sa8", "", "Update Call No-Show", "", STAGES[9], "Live", ["Email", "WhatsApp"], null, "live", ""),
  // Retest - Live
  T("rt1", "", "Retest Preparation", "Time for your little prick re-test", STAGES[10], "Live", ["Email"], null, "live", "CRM 7.1"),
  T("rt1b", "", "Updated Health Story Call", "Time for a Check-In", STAGES[10], "Live", ["Email"], null, "live", "CRM 7.2"),
  T("rt2", "", "Retest Kit Shipped", "", STAGES[10], "Live", ["Email"], null, "live", ""),
  T("rt3", "", "Retest Kit Delivered", "", STAGES[10], "Live", ["Email"], null, "live", ""),
  T("rt4", "", "Retest Kit Registered", "", STAGES[10], "Live", ["Email"], null, "live", ""),
  // Supplement Fulfillment - Live + Precision Pods new
  T("sf1", "", "Daily Sachet - Order Confirmed", "", STAGES[13], "Live", ["Email"], null, "live", ""),
  T("sf2", "", "Daily Sachet - With Pharmacy", "", STAGES[13], "Live", ["Email"], null, "live", ""),
  T("sf3", "", "Daily Sachet - Shipped", "", STAGES[13], "Live", ["Email", "SMS"], null, "live", ""),
  T("sf4", "", "Sachet Restock Confirmation", "", STAGES[13], "Live", ["Email"], null, "live", ""),
  T("sf5", "", "Precision Pod - Order Confirmed", "", STAGES[13], "Live", ["Email"], null, "live", ""),
  T("sf6", "", "Precision Pod - With Pharmacy", "", STAGES[13], "Live", ["Email"], null, "live", ""),
  T("sf7", "", "Precision Pod - Shipped", "", STAGES[13], "Live", ["Email", "SMS"], null, "live", ""),
  T("sf8", "", "Precision Pod - Delivered", "", STAGES[13], "Live", ["Email"], null, "live", ""),
  T("sf9", "", "Precision Pod - Renewal Reminder", "", STAGES[13], "Live", ["Email", "SMS"], null, "live", ""),
  T("sf10", "", "Precision Pod - Measure Reminder", "", STAGES[13], "Live", ["Email"], null, "live", ""),
  T("pp0", "PP-1.0", "Order Placed", "Order confirmed", STAGES[13], "Approved", ["Email", "SMS"], "precision-pods", "new", "TRIGGER: Order complete event. Straightforward."),
  T("pp1", "PP-1.1", "Quality Check by Pharmacist", "Your order is with our pharmacy team", STAGES[13], "Approved", ["Email"], "precision-pods", "new", "TRIGGER: TSI API - pharmacist checking order open. Needs API integration."),
  T("pp2", "PP-1.2", "Order Shipped", "Your Precision Pods have shipped.", STAGES[13], "Approved", ["Email", "SMS"], "precision-pods", "new", "TRIGGER: TSI API - package out for delivery. Needs API integration."),
  T("pp3", "PP-1.3", "Order Delivered", "Your Precision Pods have arrived.", STAGES[13], "Approved", ["Email"], "precision-pods", "new", "TRIGGER: Tracking number delivered event. Needs carrier webhook."),
  T("pp4", "PP-1.4", "2-Week Check-in", "How are the pods going?", STAGES[13], "Approved", ["Email"], "precision-pods", "new", "TRIGGER: ~14 days after delivery. Needs timer from PP-1.3."),
  T("pp5", "PP-1.5", "Membership Renewal Reminder", "Your next Precision Pods are on the way.", STAGES[13], "Approved", ["Email", "SMS"], "precision-pods", "new", "TRIGGER: Subscription renewal - 3 days (e.g. Stripe invoice.upcoming). Needs Stripe webhook."),
  // Advanced Testing - Live
  T("at1", "", "Advanced Hormone Test - Order Placed", "", STAGES[14], "Live", ["Email"], null, "live", ""),
  T("at2", "", "Advanced Hormone Test - Shipped", "", STAGES[14], "Live", ["Email", "SMS"], null, "live", ""),
  T("at3", "", "Advanced Hormone Test - Bath", "", STAGES[14], "Live", ["Email"], null, "live", ""),
  T("at4", "", "MBR Synergy Test - Order Placed", "", STAGES[14], "Live", ["Email"], null, "live", ""),
  T("at5", "", "MBR Synergy Test - Results Ready", "", STAGES[14], "Live", ["Email"], null, "live", ""),
  T("at6", "", "Omega 3 Test - Order Placed", "", STAGES[14], "Live", ["Email"], null, "live", ""),
  T("at7", "", "Omega 3 Test - Results Ready", "", STAGES[14], "Live", ["Email"], null, "live", ""),
  // Manual Templates - Live
  T("mt1", "", "First Call Confirmation", "", STAGES[15], "Live", ["Email"], null, "live", ""),
  T("mt2", "", "Health Coach: Reschedule", "", STAGES[15], "Live", ["Email"], null, "live", ""),
  T("mt3", "", "Health Coach: Welcome Response", "", STAGES[15], "Live", ["Email"], null, "live", ""),
  T("mt4", "", "Results and Bulk Questions", "", STAGES[15], "Live", ["Email"], null, "live", ""),
  T("mt5", "", "Pricing and Bulk Questions", "", STAGES[15], "Live", ["Email"], null, "live", ""),
  T("mt6", "", "Reschedule to Customer Care", "", STAGES[15], "Live", ["Email"], null, "live", ""),
];

const INIT_LEG = [
  T("lg1", "", "Pre-Invitation Teaser", "", STAGES[0], "Planned", ["Email", "SMS"], null, "legacy", ""),
  T("lg2", "", "New Sport/Interest Testimonial", "", STAGES[0], "Planned", ["Email"], null, "legacy", ""),
  T("lg3", "", "New Start Is Ready", "", STAGES[1], "Planned", ["Email", "SMS"], null, "legacy", ""),
  T("lg4", "", "Cart Abandon (+7d) Objection", "", STAGES[1], "Planned", ["Email"], null, "legacy", ""),
  T("lg5", "", "Welcome Content Strategy", "", STAGES[1], "Planned", ["Email"], null, "legacy", ""),
  T("lg6", "", "Sample Kit Map (Post-Collection)", "", STAGES[2], "Planned", ["Email"], null, "legacy", ""),
  T("lg7", "", "Health Story Content Strategy", "", STAGES[2], "Planned", ["Email"], null, "legacy", ""),
  T("lg8", "", "Courier Personal Result (+14d)", "", STAGES[3], "Planned", ["Email"], null, "legacy", ""),
  T("lg9", "", "Dead Zone Content Strategy", "", STAGES[4], "Planned", ["Email"], null, "legacy", ""),
  T("lg10", "", "Post-Call Survey", "", STAGES[5], "Planned", ["Email"], null, "legacy", ""),
  T("lg11", "", "Results Ready Content Strategy", "", STAGES[5], "Planned", ["Email"], null, "legacy", ""),
  T("lg12", "", "Post-Delivery Content Strategy", "", STAGES[5], "Planned", ["Email"], null, "legacy", ""),
  T("lg13", "", "First Allergens Don't Have (+3d)", "", STAGES[6], "Planned", ["Email"], null, "legacy", ""),
  T("lg14", "", "4-Day Retention Content Strategy", "", STAGES[6], "Planned", ["Email"], null, "legacy", ""),
  T("lg15", "", "Monthly Fitness Check-in (M1-M6)", "", STAGES[7], "Planned", ["Email"], null, "legacy", ""),
  T("lg16", "", "Monthly Check-in Summary", "", STAGES[7], "Planned", ["Email"], null, "legacy", ""),
  T("lg17", "", "Monthly Value Email", "", STAGES[7], "Planned", ["Email"], null, "legacy", ""),
  T("lg18", "", "Thinking About Health? (+M3)", "", STAGES[8], "Planned", ["Email"], null, "legacy", ""),
  T("lg19", "", "One Year Mark", "", STAGES[8], "Planned", ["Email"], null, "legacy", ""),
  T("lg20", "", "Churn Risk: Is It Reboot?", "", STAGES[8], "Planned", ["Email"], null, "legacy", ""),
  T("lg21", "", "Win-back", "", STAGES[8], "Planned", ["Email", "SMS"], null, "legacy", ""),
  T("lg22", "", "Missed Results Ready", "", STAGES[9], "Planned", ["Email"], null, "legacy", ""),
  T("lg23", "", "Retest Coming 3 Weeks", "", STAGES[10], "Planned", ["SMS"], null, "legacy", ""),
  T("lg24", "", "Retest Coming Next Week", "", STAGES[10], "Planned", ["Email"], null, "legacy", ""),
  T("lg25", "", "Year Month Milestone", "", STAGES[11], "Planned", ["Email"], null, "legacy", ""),
  T("lg26", "", "Medical Membership Welcome", "", STAGES[12], "Planned", ["Email"], null, "legacy", ""),
  T("lg27", "", "Telehealth Consultation Brief", "", STAGES[12], "Planned", ["Email"], null, "legacy", ""),
  T("lg28", "", "Prescription Notification", "", STAGES[12], "Planned", ["Email", "SMS"], null, "legacy", ""),
  T("lg29", "", "Advanced Hormone Test - Results", "", STAGES[14], "Planned", ["Email"], null, "legacy", ""),
  T("lg30", "", "GFP Registration Invitation", "", STAGES[14], "Planned", ["Email"], null, "legacy", ""),
];

const INIT_BCS = [
  { id: "bc-re", title: "Re-Engagement: Lapsed Waitlist", subject: "A few things have changed", status: "Approved", channels: ["Email"], audience: "Seg 1 + Seg 2", notes: "4 variants. CEO sender. Sent to Kosta.", variants: [
    { id: "1A", label: "Seg 1 - Invited", status: "Approved" },
    { id: "1B", label: "Seg 1 - Waitlist", status: "Approved" },
    { id: "2A", label: "Seg 2 - Invited Upgraded", status: "Approved" },
    { id: "2B", label: "Seg 2 - Waitlist Upgraded", status: "Approved" },
  ]},
  { id: "bc-pods", title: "Precision Pods in Your Shop", subject: "We built something for you.", status: "Approved", channels: ["Email", "SMS"], audience: "Existing members", notes: "CEO sender. Sent to Kosta.", variants: null },
];

// Email content for documented flows
const EMAIL_CONTENT = {
  "w01": { subject: "You're on the list. Here's what that means.", preview: "What TMRW actually does, and what happens when your spot opens.", from: "The TMRW Team", body: "Acknowledges signup. Explains what TMRW actually does — complete map of biology across 1,700+ data points, personalised plan by real doctor and health coach, supplements compounded to results. Retest every four months. Reply invitation included." },
  "w02": { subject: "Most people wait. You didn't.", preview: "Why that decision matters more than it might seem.", from: "The TMRW Team", body: "Builds informed belief without repeating product explanation from 0.1. Makes member feel the decision to join was philosophically right. Zero product features. TMRW positioned as guide, not hero. Emotional centre: 'You put your hand up before that happened.'" },
  "w04": { subject: "Your spot opens in five days.", preview: "Something worth looking forward to.", from: "The TMRW Team", body: "Deliberately short. Rebuilds emotional temperature before invitation lands. Specific date used — concrete is always more compelling than vague. The invitation carries the urgency, this email just warms the room." },
  "w05": { subject: "Your spot is ready.", preview: "Your registration code and everything you need to get started.", from: "The TMRW Team", body: "Trigger immediate action. Product detail kept to one paragraph. 'You're helping us build something worth building' shifts member from customer to partner. 48-hour window stated twice as fact, not pressure. Registration code and link included." },
  "w06": { subject: "Your spot expires tomorrow.", preview: "This is the last reminder we'll send.", from: "The TMRW Team", body: "Recover hesitators. Three groups: genuinely undecided, meaning to get to it, stuck on unanswered question. 'You waited for this spot. Whatever brought you to TMRW in the first place is still true today.' Only urgency language in entire funnel." },
  "w07a": { subject: "Did we get the timing wrong?", preview: "No pressure. Just one question.", from: "The TMRW Team", body: "Re-open the door without making member feel chased or guilty. Subject line takes responsibility rather than placing it on the member. No CTA button — this email asks for a conversation, not a click." },
  "w07b": { subject: "We owe you an update.", preview: "You've been on the TMRW waitlist for a while.", from: "Mark Britt, CEO", body: "'That's on us' does the heaviest lifting. Two words that own the silence without over-apologising. Brief product reminder for members who received 0.1 months ago. 'When it opens, you'll hear from us with everything you need to get started.' After this, they enter active funnel at 0.4." },
  "bt1": { subject: "Your blood test requisition is ready", preview: "Here's how to prepare.", from: "The TMRW Team", body: "Prep instructions as prose: Fast 10-12 hours, water fine, avoid strenuous exercise, collection centre before 10am. Bring: referral, Medicare card, photo ID. 'Hit reply and let us know' closes blind spot. SMS covers essentials, points to email for detail." },
  "bt2": { subject: "Have you had your blood test?", preview: "Just checking in.", from: "The TMRW Team", body: "Gentle nudge, not a nag. 'Hit reply and let us know' is primary ask. Repeats key prep info for anyone who deleted first email. No SMS — check-in text feels like a dentist reminder." },
  "bt3": { subject: "Your blood test results are in.", preview: "Your clinical team is reviewing them now.", from: "The TMRW Team", body: "Shortest email in set. One job: confirm receipt and tell them someone's looking at it. 'Nothing you need to do on your end. We'll reach out when the review is done.' SMS added because this is a moment people want to know about immediately." },
  "dz1": { subject: "Your sample is with us.", preview: "Here's what happens from here.", from: "The TMRW Team", body: "Confirm receipt. Set timeline (2-4 weeks). Set communication contract: we won't go quiet. 'We'll be in touch at every step — you won't be left wondering.'" },
  "dz2": { subject: "Inside Scoop (Sleep)", preview: "Something you can act on right now.", from: "TMRW Health", body: "+3 days. Uses Kareema's existing Inside Scoop sleep video email. Give member something to act on immediately. Sleep is the universal first recommendation. Only intro block changes from template." },
  "dz3": { subject: "Inside Scoop (Brain Fog)", preview: "Why your brain feels different.", from: "TMRW Health", body: "+7 days. Break the silence at one week. Address the near-universal concern. Brain fog video content. Make the member feel understood." },
  "dz4": { subject: "Your results are getting closer.", preview: "What to expect when they arrive.", from: "The TMRW Team", body: "+12 days. Build anticipation. Reduce anxiety. Prepare member for receiving results. Set expectations for what comes next." },
  "dz5": { subject: "Inside Scoop (Health Habits)", preview: "Small changes while you wait.", from: "TMRW Health", body: "+16 days, results not ready. Prepare for behaviour change before plan arrives. Health habits video content. Only fires if results aren't back yet." },
  "dz6": { subject: "Still here.", preview: "Just a quick note.", from: "The TMRW Team", body: "+18 days, results not ready. Brevity is warmth. Show someone is still paying attention. Short email — the shortness IS the message." },
  "dz7": { subject: "An update on your results.", preview: "They're taking longer than expected.", from: "The TMRW Team", body: "+22 days, results not ready. Acknowledge the wait has exceeded the timeline. Proactive honesty. Don't pretend the delay isn't happening." },
  "dz8": { subject: "N/A — personal email or call", preview: "", from: "Member's clinician", body: "Day 28 or member replies with frustration. No template. No automated copy. The clinician sends a personal email or calls directly. A task is created in HubSpot. This member is a genuine outlier — they need a person, not a system." },
  "dzq1": { subject: "We need to redo your test.", preview: "This one's on us.", from: "The TMRW Team", body: "QC fail internal. Take complete ownership. The member must not feel like they failed. Replacement kit dispatched. Sentiment score: 30 — highest-stakes moment." },
  "dzq2": { subject: "Something went wrong on our end.", preview: "We're fixing it.", from: "The TMRW Team", body: "QC fail at lab. This is the moment they are most likely to cancel. Save the member. Phone call from clinician included. Complete ownership, immediate action, no ambiguity." },
  "du1": { subject: "Your TMRW Dashboard is live", preview: "Your results are ready. Here's how to get in.", from: "TMRW Health", body: "Log in at app.startmytomorrow.com. 6-digit code as password. Inside: biological age clocks, health goals, Better TMRW Plan, Precision Pod formulation. 'Take your time with it.' Book Insights Call link. SMS from clinician name." },
  "du2": { subject: "Have you seen your biological clocks?", preview: "One part of your dashboard worth looking at first.", from: "TMRW Health", body: "+3 days. 'If you've already been through your dashboard, skip this one.' Biological Clocks are the hook — 'It's usually the first thing members want to talk about on their Insights Call.' Social proof without being heavy." },
  "du3": { subject: "Quick question", preview: "Is there anything I can help with?", from: "Your clinician", body: "+8 days. Names the three most likely reasons they haven't booked: feeling overwhelmed, not knowing what to expect, not knowing where to start. Resolves all three: 'We start wherever you are.' Email only, no SMS — six messages in 8 days is too much." },
  "du4": { subject: "N/A — personal message", preview: "", from: "Member's clinician", body: "Day 10. Not automated. Not templated. The system notifies the clinician that the member completed the full sequence without engagement. The clinician reaches out personally. The value is that it feels different from the automated sequence." },
  "pp0": { subject: "Order confirmed", preview: "Your Precision Pods are being made.", from: "The TMRW Team", body: "Formulated from your biology, checked by clinical team, compounded under pharmacist supervision. 'It takes a bit longer than pulling something off a shelf, but that's the point.' Order goes through clinical review, then formulation, then ships. Dashboard link for tracking." },
  "pp1": { subject: "Your order is with our pharmacy team", preview: "Everything's on track.", from: "The TMRW Team", body: "Licensed compounding pharmacist reviewing formulation for accuracy and safety. Once approved, compounded and dispatched within 48-72 hours. 'This is the part where your biology becomes something you can hold in your hand.'" },
  "pp2": { subject: "Your Precision Pods have shipped.", preview: "Plus how to take them when they land.", from: "The TMRW Team", body: "Tracking link. How to take: tear seal, create hollow on tongue, pour granules, sip water, tilt head, swallow. Repeat. Tips: don't try whole serving at once. Alternative: sprinkle on yoghurt. Storage: below 25 degrees. Side effects: hit reply." },
  "pp3": { subject: "Your Precision Pods have arrived.", preview: "Everything you need to get started.", from: "The TMRW Team", body: "Video embed: how to take your Precision Pods. Full instructions repeated. 'Built from your biology, reviewed by your clinical team, and now in your hands.' Storage and side effects info. Dashboard link." },
  "pp4": { subject: "How are the pods going?", preview: "Your clinical team would like to check in.", from: "Your TMRW Clinical Team", body: "~14 days after delivery. 'Some people notice changes in energy, sleep, or digestion early. Some notice shifts in focus or mood. Some don't notice much yet. All of that is useful information.' Interested in subtle things: how you're waking up, afternoon energy, gut. 'Just hit reply and let us know.'" },
  "pp5": { subject: "Your next Precision Pods are on the way.", preview: "Your new formulation begins in 3 days.", from: "The TMRW Team", body: "3 days before renewal. Payment will process, formulation moves to pharmacy team. 'Same precision, personalised to your biology, reviewed by your clinical team.' Dashboard link for changes, pause, or updates." },
  "re1a": { subject: "A few things have changed", preview: "Your registration code is still active.", from: "Mark Britt, CEO", body: "Seg 1 invited didn't convert. Acknowledges life got in the way. What's new: Precision Pods (107 ingredients, reformulated on retest), expanded clinical team, retest every 3 months, rebuilt platform. Code WELCOMEBACK: 50% off joining + monthly for 3 months. 48hr window. 'Reply here. I read these.'" },
  "re1b": { subject: "Your TMRW spot is ready", preview: "It's been a while. Here's what we've been building.", from: "Mark Britt, CEO", body: "Seg 1 waitlist never invited. Acknowledges the wait. Same product updates as 1A. 'We set it aside because you were one of the first to put your hand up.' 48hr window. Code WELCOMEBACK." },
  "re2a": { subject: "A few things have changed", preview: "Including your offer.", from: "Mark Britt, CEO", body: "Seg 2 invited, code upgraded 25% to 50%. Framed as pricing restructure, not response to inaction. Same product updates. 'Your code has been upgraded to 50%.' 48hr window." },
  "re2b": { subject: "Your TMRW spot is ready", preview: "It's been a while. Here's what we've been building.", from: "Mark Britt, CEO", body: "Seg 2 waitlist, never received original 25% code. No mention of upgrade. Same as 1B. 'Your code WELCOMEBACK gives you 50% off.' 48hr window." },
};

const STORAGE_KEY = "tmrw-portal-v10c";

const EMAIL_DOCS = [
  { flow: "Waitlist Funnel", file: "Waitlist_Pre-Registration.docx", emails: [
    { id: "0.1", title: "Waitlist Signup Confirmation", subject: "You're on the list. Here's what that means.", preview: "What TMRW actually does, and what happens when your spot opens.", from: "The TMRW Team", channels: "Email + SMS",
      body: "Hi {{first_name}},\n\nYou're on the TMRW waitlist.\n\nTMRW is a complete map of your biology. 1,700+ data points across epigenetics, blood pathology, and functional assessments. A personalised plan built by a real doctor and health coach. Supplements compounded specifically to what your results show. And a retest every four months, so the findings build on each other over time.\n\nWhen your spot opens, we'll send you everything you need to get started.\n\nIn the meantime, reply here if you have any questions.\n\nThe TMRW Team",
      sms: "You're on the TMRW waitlist. We'll be in touch when your spot opens. Reply here if you have questions." },
    { id: "0.2", title: "Nurture: What TMRW Actually Does", subject: "Most people wait. You didn't.", preview: "Why that decision matters more than it might seem.", from: "The TMRW Team", channels: "Email",
      body: "Hi {{first_name}},\n\nMost people say they'll do something about their health eventually. Most people put it off.\n\nYou put your hand up before that happened. That's not a small thing.\n\nTMRW exists because the health system wasn't built to find things early. It was built to respond once something goes wrong. By then, you're already behind.\n\nWhat you've signed up for is the opposite of that. A system that watches, measures, and responds before symptoms show up. That gets sharper every time it retests. That treats your biology as something worth understanding properly.\n\nYou'll hear from us when your spot opens. Until then, know that you're in the right place.\n\nThe TMRW Team" },
    { id: "0.3", title: "Nurture: Proof It Works", subject: "TBD", preview: "TBD", from: "The TMRW Team", channels: "Email",
      body: "[BLOCKED] Awaiting a confirmed member story from the wider team. A specific finding with a specific outcome is required — a composite or generalised story will not achieve the required impact. Brief is ready. Copy to follow once story is confirmed." },
    { id: "0.4", title: "Your Spot Is Coming", subject: "Your spot opens in five days.", preview: "Something worth looking forward to.", from: "The TMRW Team", channels: "Email + SMS",
      body: "Hi {{first_name}},\n\nYour TMRW spot opens on {{date}}.\n\nYou'll receive a registration code and a link to get started. From there, the process is simple: complete your Health Story, and your clinical team takes it from there.\n\nWe'll be in touch on {{date}}.\n\nThe TMRW Team",
      sms: "Your TMRW spot opens on {{date}}. Keep an eye on your inbox." },
    { id: "0.5", title: "Your Spot Is Ready", subject: "Your spot is ready.", preview: "Your registration code and everything you need to get started.", from: "The TMRW Team", channels: "Email + SMS",
      body: "Hi {{first_name}},\n\nYour spot is open. Here's everything you need.\n\nYour registration code: {{code}}\nRegister here: {{link}}\n\nOnce you register, you'll complete your Health Story — a detailed questionnaire about your health, goals, lifestyle, and medical history. Your clinical team uses this to build your personalised plan and formulate your first Precision Pod.\n\nYour code is active for the next 48 hours.\n\nYou're helping us build something worth building. If you have questions before you register, reply here.\n\nThe TMRW Team",
      sms: "Your TMRW spot is ready. Code: {{code}}. Register here: {{link}}. Active for 48 hours." },
    { id: "0.6", title: "Your Spot Expires Tomorrow", subject: "Your spot expires tomorrow.", preview: "This is the last reminder we'll send.", from: "The TMRW Team", channels: "Email + SMS",
      body: "Hi {{first_name}},\n\nYour TMRW registration code expires tomorrow.\n\nYou waited for this spot. Whatever brought you to TMRW in the first place is still true today.\n\nYour code: {{code}}\nRegister here: {{link}}\n\nNow is the moment.\n\nThe TMRW Team\n\nClaim your spot now: {{link}}",
      sms: "Your TMRW spot expires tomorrow. Register here: {{link}}" },
    { id: "0.7a", title: "One Question Before You Go", subject: "Did we get the timing wrong?", preview: "No pressure. Just one question.", from: "The TMRW Team", channels: "Email + SMS",
      body: "Hi {{first_name}},\n\nYour TMRW registration window has closed. We're not going to chase you.\n\nBut before we move on, one question: was it the timing, or was it something else?\n\nIf you're still interested but the timing wasn't right, reply here and we'll hold your spot for when it is.\n\nThe TMRW Team",
      sms: "Your TMRW spot has closed. If the timing wasn't right, reply to this email and we'll hold your place: hello@startmytomorrow.com" },
    { id: "0.7b", title: "Reengagement (Lapsed Waitlist)", subject: "We owe you an update.", preview: "You've been on the TMRW waitlist for a while. Here's where things stand.", from: "Mark Britt, CEO", channels: "Email + SMS",
      body: "Hi {{first_name}},\n\nYou joined the TMRW waitlist a few months ago, and we haven't been in touch since. That's on us, and I wanted to change that.\n\nWe've been building carefully. Keeping the member group small so every person gets the clinical depth this process deserves. Your place on the list has been held throughout.\n\nYour spot is getting closer. When it opens, you'll hear from us with everything you need to get started.\n\nWhat you're stepping into when that arrives: a complete map of your biology across 1,700+ data points, a personalised plan built by a real doctor and health coach, and supplements compounded specifically to what your results show. Then a retest every four months, so the findings build on each other over time.\n\nIf anything has changed since you signed up, or you have questions before your invitation arrives, reply here. I read these.\n\nHere's to more good tomorrows, strung together.\n\nMark Britt\nCEO, TMRW",
      sms: "Hi, just a quick update. You're still on the TMRW waitlist and your place has been held. We'll be in touch when your spot opens. Good things are coming." },
  ]},
  { flow: "Blood Test Flow", file: "tmrw-blood-test-email-flow-v4.docx", emails: [
    { id: "BT-1", title: "Requisition Sent", subject: "Your blood test requisition is ready", preview: "Here's how to prepare.", from: "The TMRW Team", channels: "Email + SMS + Slack",
      body: "Hi {{first_name}},\n\nYour blood test requisition has been sent through. Here's what you need to know before you go.\n\nPreparation:\nFast for 10 to 12 hours beforehand. Water is fine, and drink plenty of it the morning of. Avoid any strenuous exercise that morning. Try to get to the collection centre before 10am if you can.\n\nWhat to bring:\nYour referral (printed or on your phone), your Medicare card, and a photo ID.\n\nIf your clinical team has flagged any specific prep for your test, like cortisol timing or glucose tolerance, those instructions will be on your requisition.\n\nThat's it. Once your bloods are done, hit reply and let us know.\n\nThe TMRW Team",
      sms: "Your blood test requisition has been sent. Fast 10 to 12 hours, drink plenty of water, and try to go before 10am. Check your email for the full prep details." },
    { id: "BT-2", title: "Blood Test 5-Day Follow-Up", subject: "Have you had your blood test?", preview: "Just checking in.", from: "The TMRW Team", channels: "Email",
      body: "Hi {{first_name}},\n\nWe sent your blood test requisition through a few days ago. Just checking in to see if you've had a chance to get it done.\n\nIf you have, hit reply and let us know. Your results will come through to us directly and we'll be in touch the moment they're in.\n\nIf you haven't got around to it yet, no stress. Just a reminder to fast for 10 to 12 hours and try to go before 10am. The sooner your bloods are done, the sooner your clinical team can get to work.\n\nThe TMRW Team" },
    { id: "BT-3", title: "Blood Test Results Received", subject: "Your blood test results are in.", preview: "Your clinical team is reviewing them now.", from: "The TMRW Team", channels: "Email + SMS + Slack",
      body: "Hi {{first_name}},\n\nYour blood test results have come through. Your clinical team is reviewing them now and will be in touch once they've had a proper look.\n\nNothing you need to do on your end. We'll reach out when the review is done.\n\nThe TMRW Team",
      sms: "Your blood test results are in. Your clinical team is reviewing them now and will be in touch soon." },
  ]},
  { flow: "Dashboard Unlock", file: "dashboard-unlock-v2.docx", emails: [
    { id: "DU-1", title: "Dashboard Is Live", subject: "Your TMRW Dashboard is live", preview: "Your results are ready. Here's how to get in.", from: "TMRW Health", channels: "Email + SMS",
      body: "Hi {{first_name}},\n\nYour clinical analysis is complete and your personalised TMRW Dashboard is live.\n\nLog in at app.startmytomorrow.com using your email address. You'll receive a 6-digit code as your password.\n\nInside you'll find your biological age clocks, your personalised health goals, your Better TMRW Plan, and your Precision Pod formulation. There's a lot in there, and it's all built from your data. Take your time with it.\n\nWhen you're ready, book your Insights Call with us. It's where we go through your results together, answer any questions, and make sure your plan makes sense for your life.\n\nBook your Insights Call here: {{booking_link}}\n\nCome with whatever's on your mind. That's what the call is for.\n\nTMRW Health",
      sms: "Hi {{first_name}}, it's {{clinician_name}} from TMRW. Your dashboard is live at app.startmytomorrow.com. Have a look through when you get a chance, then book your Insights Call with us here: {{booking_link}}" },
    { id: "DU-2", title: "Nudge: Biological Clocks (+3d)", subject: "Have you seen your biological clocks?", preview: "One part of your dashboard worth looking at first.", from: "TMRW Health", channels: "Email + SMS",
      body: "Hi {{first_name}},\n\nIf you've already been through your dashboard, you can skip this one. But if you haven't had a chance yet, we wanted to point you to one thing in particular.\n\nYour Biological Clocks show how your body is ageing at a cellular level compared to your actual age. It's usually the first thing members want to talk about on their Insights Call, and it's a good place to start.\n\nLog in at app.startmytomorrow.com and have a look. When you're ready to talk it through, book your Insights Call here: {{booking_link}}\n\nTMRW Health",
      sms: "Hi {{first_name}}, have you had a chance to check your TMRW dashboard yet? Start with your Biological Clocks. Book your Insights Call when you're ready: {{booking_link}}" },
    { id: "DU-3", title: "Name the Friction (+8d)", subject: "Quick question", preview: "Is there anything I can help with?", from: "TMRW Health", channels: "Email",
      body: "Hi {{first_name}},\n\nWe wanted to reach out one more time.\n\nYour dashboard and results have been ready for about a week now, and we haven't heard from you. That's completely fine. But we also know that sometimes the reason people don't book isn't because they're too busy. Sometimes it's because the dashboard feels like a lot to take in, or you're not sure what the call actually involves, or you're just not sure where to start.\n\nIf any of that sounds familiar, the Insights Call is designed for exactly that. It's a conversation, not a presentation. You don't need to have read everything first. We start wherever you are and work through it together.\n\nBook a time here: {{booking_link}}\n\nAnd if something else is going on, or you just have a question, hit reply. We are here.\n\nTMRW Health" },
    { id: "DU-4", title: "Clinician Manual Outreach (+10d)", subject: "N/A — personal message", preview: "", from: "Member's clinician", channels: "Email / Call / Slack",
      body: "[MANUAL] Day 10. Not automated. Not templated.\n\nThe system notifies the assigned clinician that the member has completed the full automated sequence without booking or replying. The clinician then reaches out personally via their preferred channel: email, phone call, or SMS.\n\nThis outreach should not follow a template. The value is that it feels distinctly different from the automated sequence. The clinician should reference what they know about the member and their data." },
  ]},
  { flow: "Precision Pods", file: "TMRW_Precision_Pod_Emails.docx", emails: [
    { id: "PP-1.0", title: "Order Placed", subject: "Order confirmed", preview: "Your Precision Pods are being made.", from: "The TMRW Team", channels: "Email + SMS",
      body: "Hi {{first_name}},\n\nYour Precision Pod order is confirmed.\n\nFormulated from your biology, checked by your clinical team, and compounded under pharmacist supervision. It takes a bit longer than pulling something off a shelf, but that's the point.\n\nYour order goes through clinical review, then formulation, then ships directly to you. You can track the progress in your Dashboard.\n\nTMRW Health" },
    { id: "PP-1.1", title: "Quality Check by Pharmacist", subject: "Your order is with our pharmacy team", preview: "Everything's on track.", from: "The TMRW Team", channels: "Email",
      body: "Hi {{first_name}},\n\nYour Precision Pod order is now with our pharmacy team.\n\nA licensed compounding pharmacist is reviewing your formulation for accuracy and safety. Once approved, your pod will be compounded and dispatched within 48 to 72 hours.\n\nThis is the part where your biology becomes something you can hold in your hand.\n\nTMRW Health" },
    { id: "PP-1.2", title: "Order Shipped", subject: "Your Precision Pods have shipped.", preview: "Plus how to take them when they land.", from: "The TMRW Team", channels: "Email + SMS",
      body: "Hi {{first_name}},\n\nYour Precision Pods are on their way.\n\nTracking: {{tracking_link}}\n\nHow to take them when they arrive: Tear the seal. Create a small hollow on your tongue. Pour the granules in. Take a sip of water, tilt your head slightly, and swallow. Repeat until the full serving is done.\n\nTip: Don't try the whole serving in one go. Two or three pours is easier.\n\nAlternative: Sprinkle the granules on yoghurt or into a smoothie.\n\nStorage: Below 25 degrees.\n\nSide effects: Most members experience none. If something feels off, hit reply.\n\nTMRW Health" },
    { id: "PP-1.3", title: "Order Delivered", subject: "Your Precision Pods have arrived.", preview: "Everything you need to get started.", from: "The TMRW Team", channels: "Email",
      body: "Hi {{first_name}},\n\nYour Precision Pods have been delivered.\n\n[Video embed: how to take your Precision Pods]\n\nBuilt from your biology, reviewed by your clinical team, and now in your hands.\n\nStorage: Below 25 degrees.\nSide effects: Most members experience none. If something feels off, hit reply.\n\nTMRW Health" },
    { id: "PP-1.4", title: "2-Week Check-in", subject: "How are the pods going?", preview: "Your clinical team would like to check in.", from: "Your TMRW Clinical Team", channels: "Email",
      body: "Hi {{first_name}},\n\nIt's been about two weeks since your Precision Pods arrived. We wanted to check in.\n\nSome people notice changes in energy, sleep, or digestion early. Some notice shifts in focus or mood. Some don't notice much yet. All of that is useful information.\n\nWe're particularly interested in the subtle things: how you're waking up, how your energy feels in the afternoon, whether your gut feels any different.\n\nJust hit reply and let us know how it's going. Even a sentence or two helps your clinical team stay on top of things.\n\nYour TMRW Clinical Team" },
    { id: "PP-1.5", title: "Membership Renewal Reminder", subject: "Your next Precision Pods are on the way.", preview: "Your new formulation begins in 3 days.", from: "The TMRW Team", channels: "Email + SMS",
      body: "Hi {{first_name}},\n\nYour Precision Pod subscription renews in 3 days.\n\nPayment will process, and your updated formulation will move to our pharmacy team. Same precision, personalised to your biology, reviewed by your clinical team.\n\nIf you need to make any changes, pause, or update your details, head to your Dashboard.\n\nTMRW Health" },
  ]},
  { flow: "Re-Engagement Campaign", file: "tmrw-re-engagement-final.docx", emails: [
    { id: "1A", title: "Seg 1 - Invited, Didn't Convert", subject: "A few things have changed", preview: "Your registration code is still active.", from: "Mark Britt, CEO", channels: "Email",
      body: "Hi {{first_name}},\n\nYou signed up to TMRW a while ago. We sent you an invitation, and life got in the way. That happens. But TMRW has changed quite a bit since then, and I thought you should know.\n\nNot a rebrand-and-hope kind of change. Since you last heard from us, we've been working with a small group of early members. We listened to what worked, what didn't, and what they needed from us. What exists now is built on what we learned from them.\n\nHere's what's new.\n\nPrecision Pods are now part of your membership.\nThese are personalised supplements compounded from 107+ available ingredients, dosed specifically to what your biology shows. One daily pod, reformulated every time you retest. When you last looked at TMRW, this didn't exist. Now it's included, not an add-on.\n\nThe clinical team has expanded.\nEvery member now works with a doctor, integrative clinician, nutritionist, health coaches, and an epigenetics specialist.\n\nWe retest every three months now, not six.\n\nAnd we've rebuilt the platform and the brand from the ground up.\n\nThe TMRW joining fee is $499 now, then $249 a month. Your code WELCOMEBACK brings that to $249.50 to join and $124.50 a month for your first three months.\n\nActive for the next 48 hours. No lock-in.\n\nIf you have questions before you register, reply here. I read these.\n\nMark Britt\nCEO, TMRW" },
    { id: "1B", title: "Seg 1 - Waitlist, Never Invited", subject: "Your TMRW spot is ready", preview: "It's been a while. Here's what we've been building.", from: "Mark Britt, CEO", channels: "Email",
      body: "Hi {{first_name}},\n\nYou signed up to the TMRW waitlist a while ago, and it's taken us longer than expected to get back to you. Here's why, and what's ready for you now.\n\nWe've been working with a small group of early members to get this right. We listened to what worked, what didn't, and what they needed from us. What exists now is built on what we learned from them. And it's ready for you.\n\n[Same product updates as 1A]\n\nYour code WELCOMEBACK brings that to $249.50 to join and $124.50 a month for your first three months. We set it aside because you were one of the first to put your hand up.\n\nYour spot is held for 48 hours. No lock-in.\n\nMark Britt\nCEO, TMRW" },
    { id: "2A", title: "Seg 2 - Invited, Upgraded (25% to 50%)", subject: "A few things have changed", preview: "Including your offer.", from: "Mark Britt, CEO", channels: "Email",
      body: "Hi {{first_name}},\n\nYou signed up to TMRW a while ago. We sent you a registration code, and the timing wasn't right. But TMRW looks quite different from what you saw, and I thought you should know.\n\n[Same product updates]\n\nWhen you first signed up, your code gave you 25% off. We've restructured our pricing since then, and your code has been upgraded to 50%.\n\nUse code WELCOMEBACK to register at $249.50 to join and $124.50 a month for your first three months.\n\nActive for the next 48 hours. No lock-in.\n\nMark Britt\nCEO, TMRW" },
    { id: "2B", title: "Seg 2 - Waitlist, Upgraded (never saw 25%)", subject: "Your TMRW spot is ready", preview: "It's been a while. Here's what we've been building.", from: "Mark Britt, CEO", channels: "Email",
      body: "Hi {{first_name}},\n\n[Same as 1B — no mention of upgrade since they never received the original 25% code]\n\nYour code WELCOMEBACK gives you 50% off, that's $249.50 to join and $124.50 a month for your first three months.\n\nYour spot is held for 48 hours. No lock-in.\n\nMark Britt\nCEO, TMRW" },
  ]},
  { flow: "CRM Journey (Live)", file: "TMRW_CRM_Journey_Framework.docx", emails: [
    { id: "crm-1.1", title: "Order Confirmation", subject: "Your membership is confirmed and your Little Prick Test is on its way", preview: "Here's what happens next.", from: "The TMRW Team", channels: "Email",
      body: "Big moment! You've joined a new kind of health journey, built to help you live better for longer.\n\nYour membership's now active and your Little Prick Test is on its way. It will ship within 48 business hours and you'll get the tracking info the moment it escapes the building. Inside that small box is the first clue to what's really going on in your body.\n\nHere's how the next chapter unfolds:\n1. Start by completing your Health Story. It's the part where you tell us the things your cells can't. Biology gives us the 'what', and you give us the 'why'.\n2. The Little Prick Test (your epigenetic test) will arrive. In it, you'll find everything you need to collect your sample.\n3. You'll receive your results as well as your personalised Better TMRW Plan and full dashboard access." },
    { id: "crm-1.3", title: "Cart Abandon 1 Hour", subject: "Your body is already writing tomorrow", preview: "You were just one step away from starting your transformation.", from: "The TMRW Team", channels: "Email",
      body: "You started building something most people never get - a personalised health journey built on real data, not guesswork.\n\nRight now your order is incomplete. That means your Little Prick Test hasn't been sent, and the big insights that might change your life are waiting." },
    { id: "crm-1.4", title: "Cart Abandon 24 Hours", subject: "This is the part where most people bounce", preview: "But you're not most people. So here's one last nudge.", from: "The TMRW Team", channels: "Email",
      body: "Let's be real. This is usually the point where people disappear. Tab left open. Life gets in the way. But that's not why you clicked in, is it?\n\nThe Better TMRW Plan we build is one of the most personalised, science-backed health tools out there.\n\nThis is your reminder to complete your order and claim your place." },
    { id: "crm-2.1", title: "Login Reminder (+24h)", subject: "Login to share your Health Story & Get Started", preview: "This is where your journey really begins.", from: "The TMRW Team", channels: "Email",
      body: "Your TMRW login is ready, and your first steps are waiting.\n\nHere's what to do next:\n1. Log in and explore your TMRW onboarding plan\n2. Complete Your Health Story - it unlocks everything that follows\n\nYour Health Story is more than a form. It's the lens that brings your biology into focus." },
    { id: "crm-2.4", title: "Health Story Started Not Complete", subject: "Complete your Story to unlock your Big Insights", preview: "You're so close to starting your transformation.", from: "The TMRW Team", channels: "Email",
      body: "You're so close to seeing the biggest picture of your health you've ever had.\n\nYou've logged in and already made a start, which is great. But you haven't completed Your Health Story yet. This is what unlocks everything else.\n\nThis takes about 20-30 minutes and unlocks your entire TMRW Journey." },
    { id: "crm-2.5", title: "Health Story Completed", subject: "Your Story is complete. What happens next.", preview: "Thank you for sharing your story with us.", from: "The TMRW Team", channels: "Email",
      body: "Your Health Story is complete. Thank you for sharing your background, concerns, and goals with us.\n\nYour TMRW team is now reviewing everything you've shared. Once we have your Little Prick Test results back, your health coach and integrative clinician will undertake a comprehensive analysis." },
    { id: "crm-3.1", title: "Kit Shipped + Prep", subject: "Little Prick Test is on the way + preparation", preview: "This marks the start of unlocking the deepest intelligence your body holds.", from: "The TMRW Team", channels: "Email",
      body: "Your Little Prick Test is now on its way (1-3 business days).\n\nHow to prepare:\n- Drink plenty of water the day before\n- Fast for 8 hours before collection (water fine)\n- Collect within 2 hours of waking\n\nWhen it arrives:\n1. Register your kit\n2. Watch the video guide\n3. Follow instructions, let card dry before sealing\n4. Drop off within 48 hours at any post office" },
    { id: "crm-5.1", title: "Insights Call Booked", subject: "Your Better TMRW Plan Call is confirmed", preview: "Looking forward to sharing your Big Insights.", from: "The TMRW Team", channels: "Email",
      body: "Your Better TMRW Plan Call with {{coach_name}} is confirmed!\n\nCall Details: Date, Time, 60 minutes, Join link\n\nWhat we'll cover: Comprehensive review of Body Signals, current health status, personalised recommendations, your Better TMRW Plan roadmap, timeline and next steps.\n\nHow to prepare: Find a quiet space, have a notepad ready, prepare questions, review your Health Story goals." },
    { id: "crm-6.1", title: "Post Results Check-in (+7d)", subject: "One week on: how are your results landing?", preview: "", from: "The TMRW Team", channels: "Email",
      body: "It's been about a week since your results and dashboard were shared with you, so we just wanted to gently check in.\n\nReceiving personalised health insights can bring up a mix of emotions - curiosity, clarity, relief, or even a few questions. However you're feeling right now is completely okay.\n\nYou don't need to have everything figured out. This is a journey, and we're here to support you every step of the way." },
    { id: "crm-7.1", title: "Retest Preparation", subject: "Time for your little prick re-test", preview: "", from: "The TMRW Team", channels: "Email",
      body: "You're coming up to an important milestone in your TMRW journey. It's now time to reflect on the last 6 months and complete your next little prick re-test.\n\nThis isn't just a re-test. It's seeing how far you have come.\n\nWhat happens next:\n- Your new test kit will be prepared soon\n- You'll receive a tracking link once it ships\n- Complete the test the same way as last time\n- You won't need to register this kit" },
  ]},
  { flow: "Pods Broadcast", file: "Precision_Pods_in_Your_Shop.docx", emails: [
    { id: "BC", title: "Precision Pods in Your Shop", subject: "We built something for you.", preview: "Precision Pods are now available in Your Shop.", from: "Mark Britt, CEO", channels: "Email + SMS",
      body: "Hi {{first_name}},\n\nWe've been working on something for a while, and it's ready.\n\nYou can now purchase Precision Pods directly from your Dashboard. This is probably the biggest thing we've added to the platform since you joined, and I wanted you to hear about it from me.\n\nSo what are they? Personalised supplements, compounded from 107+ available ingredients, dosed to what your biology actually shows. Your formulation is drawn from your results, reviewed by your clinical team, and a pharmacist oversees every dose. One pod a day.\n\nThe bit I'm most proud of: they don't stay the same. Every time you retest, your formulation updates. Your biology changes, your Pods change with it. It's the reason we built them in-house rather than partnering with someone else.\n\n$179 a month as a subscription. We've also stocked a range of additional supplements if you want to browse. You'll find everything in Your Shop in your Dashboard.\n\nQuestions about whether Pods are right for where you are right now? Hit reply, or ask your clinical team.\n\nMark Britt\nCEO, TMRW",
      sms: "Precision Pods are now available in your Dashboard. Personalised supplements built from your biology. Head to Your Shop to take a look: {{Dashboard Link}}" },
  ]},
];

const FUTURE_STAGES = [  "Waitlist & Pre-Registration", "Registration & Checkout", "Health Story & Onboarding",
  "Kit Fulfillment & Sample Collection", "Lab Processing & Active Wait", "Results & Insights",
  "Supplement Journey", "Ongoing Journey", "Retention & Churn",
  "Retest Cycle", "Post-Retest",
];
const FUT_PRI = { V1: { c: "#dc2626", bg: "#fef2f2" }, V2: { c: "#f59e0b", bg: "#fffbeb" }, V3: { c: "#94a3b8", bg: "#f8fafc" } };

const INIT_FUTURE = [
  // ── HEALTH STORY & ONBOARDING (the big changes) ──
  { id: "f-hs-email", seq: "HS-EMAIL", title: "Personalised Health Story Email", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "HIGHEST SENTIMENT (93). Clinician writes personalised response within 24hrs of HS completion. Goals, what stood out, what we're excited about. Blood requisition + Core Pod shipping confirmation included. Welcome Call is optional and does NOT gate this." },
  { id: "f-rebirth", seq: "REBIRTH", title: "Rebirth Certificate", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "Physical certificate shipped with first Core Pods. Recognises joining date and rebirth into proactive health. Future certificates celebrate biomarker improvements." },
  { id: "f-core-unlock", seq: "CORE-1", title: "Core Pod Unlock Email", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "Core Pod (30 ingredients) ready. Built from Health Story. Prescribed within 24hrs of HS completion. Ships with Rebirth Certificate. Member gets value from Week 2." },
  { id: "f-hs-complete", seq: "2.5", title: "Health Story Complete (REWRITE)", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "REWRITE. Must bridge to personalised email, not dead end. 'Your clinician is reviewing now. Personalised response within 24hrs.' Confirms pod prescription + blood requisition being processed." },
  { id: "f-ed1", seq: "ED-1", title: "Your Health Story Dashboard Is Live", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "KEY INNOVATION. Early Dashboard unlocked after Welcome Call or auto-unlocked. First data-driven wow moment. Health Story data visualised before results are back." },
  { id: "f-ed2", seq: "ED-2", title: "Explore Your Dashboard (+48h)", stage: "Health Story & Onboarding", priority: "V2", status: "To Do", channels: ["Email"], notes: "Nudge for non-login after dashboard unlock." },
  { id: "f-wc-invite", seq: "2.11", title: "Welcome Call Invite (REWRITE)", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "REWRITE. Welcome Call now OPTIONAL. 30-45min not 20min. Does NOT gate any clinical track. 'You've already heard from your clinician via email. The Welcome Call goes deeper.'" },
  { id: "f-wc-confirm", seq: "2.13", title: "Welcome Call Booking Confirmation (REWRITE)", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "REWRITE. 30-45min call. Agenda: Health Story review, goal-setting, Early Dashboard walkthrough." },
  { id: "f-wc-remind", seq: "2.14", title: "Welcome Call Reminder Day-Of (REWRITE)", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "REWRITE. Reflects expanded call. Primes for dashboard reveal." },
  { id: "f-wc-noshow", seq: "2.15", title: "Welcome Call No-Show (REWRITE)", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "REWRITE. First step in deeper no-show ladder (2.15 > 2.15B > 2.15C > 2.15D)." },
  { id: "f-wc-noshow-b", seq: "2.15B", title: "Welcome Call No-Show Rebook (+48h)", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "NEW. Second rebook prompt. Softer angle." },
  { id: "f-wc-noshow-c", seq: "2.15C", title: "Welcome Call No-Show - Coach Outreach (+7d)", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "NEW. Personal email from coach with specific times offered." },
  { id: "f-wc-noshow-d", seq: "2.15D", title: "Welcome Call No-Show - Ops Escalation (+14d)", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Call"], notes: "NEW. Internal ops flag. Phone call intervention. Churn risk." },
  { id: "f-wc-complete", seq: "2.16", title: "Welcome Call Complete - What's Next", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "NEW. Post-call bridge. Confirms goals set, links to Early Dashboard." },
  { id: "f-hs-kit-nudge", seq: "2.6", title: "Have You Received Your Kit? (+7d)", stage: "Health Story & Onboarding", priority: "V2", status: "To Do", channels: ["Email"], notes: "Kit ships day of payment. Re-engagement for members who haven't logged in." },
  { id: "f-hs-personal", seq: "2.7", title: "Personal Check-in (+14d)", stage: "Health Story & Onboarding", priority: "V2", status: "To Do", channels: ["Email"], notes: "Manual personal outreach for members inactive 14 days." },
  { id: "f-hs-holding", seq: "2.8", title: "We're Holding Your Spot (+21d)", stage: "Health Story & Onboarding", priority: "V2", status: "To Do", channels: ["Email"], notes: "Urgency-based nudge for members inactive 21 days." },

  // ── MEDICAL CONSULTATION (new flow) ──
  { id: "f-mc1", seq: "MC-1", title: "Book Your Medical Consultation", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "NEW FLOW. Optional medical consultation. Invitation to book." },
  { id: "f-mc2", seq: "MC-2", title: "Medical Consultation Booking Reminder (+48h)", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "First reminder to book." },
  { id: "f-mc3", seq: "MC-3", title: "Medical Consultation Booking Reminder (+5d)", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "Second reminder with SMS escalation." },
  { id: "f-mc4", seq: "MC-4", title: "Medical Consultation Booking Confirmation", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "Confirms booking with details." },
  { id: "f-mc5", seq: "MC-5", title: "Medical Consultation Day-Of Reminder", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "Day-of reminder." },
  { id: "f-mc6", seq: "MC-6", title: "Medical Consultation No-Show", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "No-show follow-up." },
  { id: "f-mc7", seq: "MC-7", title: "Medical Consultation No-Show Rebook (+48h)", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "Second rebook attempt." },
  { id: "f-mc8", seq: "MC-8", title: "Medical Consultation No-Show - Coach (+7d)", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "Personal coach outreach." },
  { id: "f-mc9", seq: "MC-9", title: "Medical Consultation No-Show - Ops (+14d)", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Call"], notes: "Internal ops flag." },
  { id: "f-mc10", seq: "MC-10", title: "Medical Consultation Complete - Pathology", stage: "Health Story & Onboarding", priority: "V1", status: "To Do", channels: ["Email"], notes: "Post-consultation. Confirms standard panel is bulk-billed. No out-of-pocket." },

  // ── REGISTRATION ──
  { id: "f-sms-opt", seq: "SMS-OPT", title: "SMS Opt-In", stage: "Registration & Checkout", priority: "V2", status: "To Do", channels: ["Email"], notes: "Opens SMS channel for downstream triggers." },
  { id: "f-pay1", seq: "PAY-1", title: "Payment Failed (REWRITE)", stage: "Registration & Checkout", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "REWRITE. Critical revenue leak. SMS ensures visibility." },
  { id: "f-pay2", seq: "PAY-2", title: "Payment Reminder (+48h)", stage: "Registration & Checkout", priority: "V1", status: "To Do", channels: ["Email"], notes: "Second dunning attempt." },
  { id: "f-pay3", seq: "PAY-3", title: "Membership Will Be Paused (+7d)", stage: "Registration & Checkout", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "Final notice before pause." },
  { id: "f-pay4", seq: "PAY-4", title: "Subscription Renewal Confirmation", stage: "Registration & Checkout", priority: "V1", status: "To Do", channels: ["Email"], notes: "Monthly receipt. Compliance requirement." },

  // ── KIT & SAMPLE COLLECTION (new options) ──
  { id: "f-blood-panel", seq: "3B.1", title: "What Your First Blood Panel Covers", stage: "Kit Fulfillment & Sample Collection", priority: "V2", status: "To Do", channels: ["Email"], notes: "Educational. 75+ biomarkers, 11 domains, fully bulk-billed. Prevents surprise-cost perception. Advanced investigations at retest." },
  { id: "f-phleb-home1", seq: "PHLEB-H1", title: "At-Home Phlebotomy - Booking", stage: "Kit Fulfillment & Sample Collection", priority: "V1", status: "To Do", channels: ["Email"], notes: "NEW SERVICE. Booking confirmation for at-home phlebotomy. 4-6 week timeline." },
  { id: "f-phleb-home2", seq: "PHLEB-H2", title: "At-Home Phlebotomy - Confirmation", stage: "Kit Fulfillment & Sample Collection", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "Appointment confirmed for at-home blood draw." },
  { id: "f-phleb-home3", seq: "PHLEB-H3", title: "At-Home Phlebotomy - Day-Of", stage: "Kit Fulfillment & Sample Collection", priority: "V1", status: "To Do", channels: ["SMS"], notes: "Day-of reminder for at-home blood draw." },
  { id: "f-phleb-gym1", seq: "PHLEB-G1", title: "In-Gym Collection - Booking (VRTUS/Foundation)", stage: "Kit Fulfillment & Sample Collection", priority: "V1", status: "To Do", channels: ["Email"], notes: "NEW SERVICE. Booking for in-gym phlebotomy at VRTUS or Foundation." },
  { id: "f-phleb-gym2", seq: "PHLEB-G2", title: "In-Gym Collection - Confirmation", stage: "Kit Fulfillment & Sample Collection", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "Appointment confirmed for in-gym blood draw." },
  { id: "f-pathreq", seq: "MED-2", title: "Pathology Requisition Sent", stage: "Kit Fulfillment & Sample Collection", priority: "V1", status: "To Do", channels: ["Email"], notes: "Confirms standard panel requisition. Explicitly bulk-billed, zero out-of-pocket. Any Australian pathology lab." },
  { id: "f-pathwait1", seq: "MED-2.11", title: "Your Blood Test Is Waiting (+7d)", stage: "Kit Fulfillment & Sample Collection", priority: "V2", status: "To Do", channels: ["Email"], notes: "Reminder for blood test not completed after 7 days." },
  { id: "f-pathwait2", seq: "MED-2.12", title: "Still Need to Get Bloods? (+14d)", stage: "Kit Fulfillment & Sample Collection", priority: "V2", status: "To Do", channels: ["Email"], notes: "Second reminder." },

  // ── LAB PROCESSING & ACTIVE WAIT ──
  { id: "f-bloods-email", seq: "BLOODS-EMAIL", title: "Personalised Bloods Experience Email", stage: "Lab Processing & Active Wait", priority: "V1", status: "To Do", channels: ["Email"], notes: "Personalised email summarising key blood findings. Links to My Records or bloods dashboard. V1 ships now." },
  { id: "f-perfect-unlock", seq: "PERFECT-1", title: "Perfect Pod Unlock Email", stage: "Lab Processing & Active Wait", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "Perfect Pod (70 ingredients) ready. Bloods unlocked ~35 additional ingredients. Doses refined. Member is now receiving from ~70 of 107 ingredients. Arrives ~2-3 weeks into journey." },
  { id: "f-survey-battery", seq: "SURVEY-BAT", title: "Post-Blood Survey Battery Release", stage: "Lab Processing & Active Wait", priority: "V1", status: "To Do", channels: ["Email"], notes: "Full battery of 8 branded assessments released. 'Your bloods are at the lab. While we wait, let's build a complete picture. More data = more precision.'" },
  { id: "f-bloods-received", seq: "MED-3.1", title: "Bloods Received Confirmation", stage: "Lab Processing & Active Wait", priority: "V1", status: "To Do", channels: ["Email"], notes: "Confirms blood test results have been received." },

  // ── RESULTS & INSIGHTS ──
  { id: "f-precision-unlock", seq: "PRECISION-1", title: "Precision Pod Unlock Email", stage: "Results & Insights", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "Precision Pod (full 107 ingredients) ready. Epigenetic data unlocks longevity compounds. Every ingredient, every dose, from complete biological picture. Arrives ~6-8 weeks." },
  { id: "f-call-summary", seq: "5.7A", title: "Insights Call Summary", stage: "Results & Insights", priority: "V2", status: "To Do", channels: ["Email"], notes: "Manual summary of key takeaways from Insights Call." },
  { id: "f-post-call-nps", seq: "5.7", title: "Post-Call NPS Survey (+3h)", stage: "Results & Insights", priority: "V2", status: "To Do", channels: ["Email"], notes: "NPS survey 3 hours after Insights Call." },
  { id: "f-post-call-q", seq: "5.8", title: "Questions from Your Call? (+24h)", stage: "Results & Insights", priority: "V2", status: "To Do", channels: ["Email"], notes: "Follow-up check for questions." },

  // ── SUPPLEMENT JOURNEY (new) ──
  { id: "f-sup-guide", seq: "SUP-GUIDE", title: "Getting the Most From Your Protocol", stage: "Supplement Journey", priority: "V2", status: "To Do", channels: ["Email"], notes: "Educational guide for optimising supplement protocol. Sent +2d after delivery." },
  { id: "f-sup-chk1", seq: "SUP-CHK1", title: "How Are Your Supplements? (+2wk)", stage: "Supplement Journey", priority: "V2", status: "To Do", channels: ["Email"], notes: "Two-week check-in on supplement experience." },
  { id: "f-sup-chk2", seq: "SUP-CHK2", title: "The Six-Week Mark", stage: "Supplement Journey", priority: "V3", status: "To Do", channels: ["Email"], notes: "Milestone celebrating supplement consistency." },
  { id: "f-sup-lapse", seq: "SUP-LAPSE", title: "Protocol Has Paused", stage: "Supplement Journey", priority: "V2", status: "To Do", channels: ["Email"], notes: "Alert for lapsed supplement subscription." },
  { id: "f-sup-reord", seq: "SUP-REORD", title: "Supplement Reorder Reminder", stage: "Supplement Journey", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "Proactive reminder before supplements run out. Estimated runout - 5 days." },
  { id: "f-sup-explain", seq: "5.11", title: "Supplement Plan Explained (+3d)", stage: "Supplement Journey", priority: "V2", status: "To Do", channels: ["Email"], notes: "Educational email explaining personalised supplement plan." },
  { id: "f-sup-social", seq: "5.12", title: "Most Members Start Here (+7d)", stage: "Supplement Journey", priority: "V2", status: "To Do", channels: ["Email"], notes: "Social proof nudge for supplement conversion." },

  // ── ONGOING JOURNEY ──
  { id: "f-pulse", seq: "PULSE", title: "Weekly Pulse Check (WHO-5)", stage: "Ongoing Journey", priority: "V1", status: "To Do", channels: ["Email"], notes: "WHO-5 wellbeing index. 5 items, under 60 seconds. Weekly Sunday evening. Push notification." },
  { id: "f-monthly-survey", seq: "SURVEY-M", title: "Monthly Core Check-in (Better Body + Mind)", stage: "Ongoing Journey", priority: "V1", status: "To Do", channels: ["Email"], notes: "~20 min. Tracks protocol response month over month." },
  { id: "f-monthly-checkin", seq: "6.2A", title: "Monthly Check-in Booking Prompt", stage: "Ongoing Journey", priority: "V1", status: "To Do", channels: ["Email"], notes: "Prompt to book monthly clinician check-in." },
  { id: "f-monthly-remind", seq: "6.2B", title: "Monthly Check-in Reminder (Day-Of)", stage: "Ongoing Journey", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "Day-of reminder." },
  { id: "f-monthly-summary", seq: "6.2C", title: "Monthly Check-in Summary", stage: "Ongoing Journey", priority: "V2", status: "To Do", channels: ["Email"], notes: "Post-call summary." },
  { id: "f-mile1", seq: "MILE-1", title: "One Month In", stage: "Ongoing Journey", priority: "V3", status: "To Do", channels: ["Email"], notes: "Milestone celebration." },
  { id: "f-mile2", seq: "MILE-2", title: "Three Months", stage: "Ongoing Journey", priority: "V3", status: "To Do", channels: ["Email"], notes: "Milestone celebration." },
  { id: "f-mile3", seq: "MILE-3", title: "Halfway to Retest", stage: "Ongoing Journey", priority: "V2", status: "To Do", channels: ["Email"], notes: "Builds anticipation for retest." },
  { id: "f-3m-review", seq: "6.4", title: "3-Month Clinician Review Prompt", stage: "Ongoing Journey", priority: "V1", status: "To Do", channels: ["Email"], notes: "Deeper clinician review at 3-month mark." },
  { id: "f-referral", seq: "REF-1", title: "Know Someone Who'd Benefit?", stage: "Ongoing Journey", priority: "V3", status: "To Do", channels: ["Email"], notes: "Referral prompt after 30 days of value." },

  // ── RETENTION & CHURN ──
  { id: "f-churn1", seq: "CHURN-1", title: "We Miss You (At-Risk)", stage: "Retention & Churn", priority: "V1", status: "To Do", channels: ["Email"], notes: "No login 30d + no coach booking. At-risk re-engagement." },
  { id: "f-churn2", seq: "CHURN-2", title: "Before You Go (Pre-Cancel)", stage: "Retention & Churn", priority: "V1", status: "To Do", channels: ["Email"], notes: "Retention attempt when cancellation initiated." },
  { id: "f-churn3", seq: "CHURN-3", title: "We Understand (+7d Post-Cancel)", stage: "Retention & Churn", priority: "V2", status: "To Do", channels: ["Email"], notes: "Graceful post-cancellation. Door open." },
  { id: "f-churn4", seq: "CHURN-4", title: "Your Biology Didn't Stop (+30d)", stage: "Retention & Churn", priority: "V2", status: "To Do", channels: ["Email"], notes: "Win-back 30 days after cancellation." },
  { id: "f-churn5", seq: "CHURN-5", title: "Still Thinking About Health? (+90d)", stage: "Retention & Churn", priority: "V3", status: "To Do", channels: ["Email"], notes: "Long-tail win-back 90 days post-cancel." },

  // ── RETEST CYCLE ──
  { id: "f-rt-prep", seq: "7.1", title: "Retest Preparation (REWRITE)", stage: "Retest Cycle", priority: "V1", status: "To Do", channels: ["Email"], notes: "REWRITE. Transparent pricing. Standard panel bulk-billed + targeted follow-up bulk-billed + optional advanced panels (additional cost, clinician-recommended)." },
  { id: "f-rt-2wk", seq: "7.1A", title: "Retest Coming in 2 Weeks", stage: "Retest Cycle", priority: "V2", status: "To Do", channels: ["Email"], notes: "Advance notice." },
  { id: "f-rt-1wk", seq: "7.1B", title: "Retest Coming Next Week", stage: "Retest Cycle", priority: "V2", status: "To Do", channels: ["Email"], notes: "One-week notice." },
  { id: "f-rt-overdue", seq: "7.2A", title: "Retest Overdue - Nudge", stage: "Retest Cycle", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "Nudge for overdue retest." },
  { id: "f-rt-results", seq: "7.8", title: "Retest Results Ready (REWRITE)", stage: "Retest Cycle", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "REWRITE. Structured: (1) standard panel vs baseline, (2) new targeted markers, (3) advanced panel results if ordered." },
  { id: "f-rt-book", seq: "7.9", title: "Book Update Insights Call", stage: "Retest Cycle", priority: "V1", status: "To Do", channels: ["Email", "SMS"], notes: "Prompt to book update call for retest results." },
  { id: "f-rt-remind", seq: "7.9A", title: "Update Call Booking Reminder (+48h)", stage: "Retest Cycle", priority: "V1", status: "To Do", channels: ["Email"], notes: "Reminder." },
  { id: "f-survey-retest", seq: "SURVEY-RT", title: "Full Survey Battery at Retest", stage: "Retest Cycle", priority: "V1", status: "To Do", channels: ["Email"], notes: "All 8 assessments repeated. Comparison to baseline. Longitudinal data." },

  // ── POST-RETEST ──
  { id: "f-pr-before-after", seq: "7.10", title: "Here's What Changed (Before/After)", stage: "Post-Retest", priority: "V1", status: "To Do", channels: ["Email"], notes: "Before/after comparison. Highest sentiment post-retest moment (92)." },
  { id: "f-pr-dashboard", seq: "7.11", title: "Dashboard Updated (Retest)", stage: "Post-Retest", priority: "V1", status: "To Do", channels: ["Email"], notes: "Dashboard updated with retest data." },
  { id: "f-pr-plan", seq: "7.12", title: "Plan Finalization Notification", stage: "Post-Retest", priority: "V1", status: "To Do", channels: ["Email"], notes: "Finalised plan based on retest results." },
  { id: "f-pr-next6", seq: "7.13", title: "Your Next 6 Months", stage: "Post-Retest", priority: "V1", status: "To Do", channels: ["Email"], notes: "Forward-looking. Sets up next cycle." },
];

// === SMALL UI ===
function Pill({ label, c, bg, small, onClick, active }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex", padding: small ? "1px 6px" : "2px 8px",
        borderRadius: 4, fontSize: small ? 9 : 10, fontWeight: 600,
        background: bg, color: c, whiteSpace: "nowrap", lineHeight: "16px",
        cursor: onClick ? "pointer" : "default",
        outline: active ? "2px solid " + c : "none", outlineOffset: -1,
      }}
    >
      {label}
    </span>
  );
}

function FlowBadge({ fid }) {
  const f = FD[fid];
  if (!f) return null;
  return <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: f.color + "18", color: f.color }}>{f.name}</span>;
}

function NewBadge({ cat }) {
  if (cat !== "new") return null;
  return <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, background: "#dbeafe", color: "#1e40af", marginLeft: 4 }}>NEW</span>;
}

function Bar({ n, d }) {
  const pct = d > 0 ? Math.round((n / d) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 80 }}>
      <div style={{ flex: 1, height: 3, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", background: pct >= 100 ? "#10b981" : "#0f172a", borderRadius: 2, width: pct + "%", transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>{n}/{d}</span>
    </div>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 540, maxHeight: "90vh", overflow: "auto", padding: 28 }}>
        {children}
      </div>
    </div>
  );
}

// === EDIT FORM ===
function EditForm({ tp, onSave, onDelete, onCancel, isNew }) {
  const [f, setF] = useState({ ...tp });
  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }));
  const toggleCh = (c) => setF((prev) => ({ ...prev, channels: prev.channels.includes(c) ? prev.channels.filter((x) => x !== c) : [...prev.channels, c] }));
  const iS = { width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" };
  const lS = { display: "block", fontSize: 9, fontWeight: 700, color: "#94a3b8", marginBottom: 3, textTransform: "uppercase" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{isNew ? "New Touchpoint" : "Edit Touchpoint"}</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ width: 70 }}><label style={lS}>Seq</label><input style={iS} value={f.seq} onChange={(e) => set("seq", e.target.value)} /></div>
        <div style={{ flex: 1 }}><label style={lS}>Title</label><input style={iS} value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
      </div>
      <div><label style={lS}>Subject</label><input style={iS} value={f.subject} onChange={(e) => set("subject", e.target.value)} /></div>
      {isNew && (
        <div><label style={lS}>Stage</label>
          <select style={iS} value={f.stage} onChange={(e) => set("stage", e.target.value)}>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}
      <div><label style={lS}>Status</label>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => set("status", s)} style={{ padding: "4px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer", border: f.status === s ? "2px solid " + SM[s].c : "1px solid #e2e8f0", background: f.status === s ? SM[s].bg : "#fff", color: f.status === s ? SM[s].c : "#94a3b8" }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div><label style={lS}>Channels</label>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {CHANNELS.map((c) => (
            <button key={c} onClick={() => toggleCh(c)} style={{ padding: "4px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer", border: f.channels.includes(c) ? "2px solid " + CM[c].c : "1px solid #e2e8f0", background: f.channels.includes(c) ? CM[c].bg : "#fff", color: f.channels.includes(c) ? CM[c].c : "#94a3b8" }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div><label style={lS}>Notes</label><textarea style={{ ...iS, resize: "vertical", minHeight: 56 }} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {!isNew && onDelete && <button onClick={() => { if (confirm("Delete?")) onDelete(); }} style={{ padding: "7px 14px", borderRadius: 7, fontSize: 11, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", cursor: "pointer", marginRight: "auto" }}>Delete</button>}
        <button onClick={onCancel} style={{ padding: "7px 14px", borderRadius: 7, fontSize: 11, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", cursor: "pointer" }}>Cancel</button>
        <button onClick={() => { if (f.title) onSave(f); }} style={{ padding: "7px 16px", borderRadius: 7, fontSize: 11, fontWeight: 700, background: "#0f172a", color: "#fff", border: "none", cursor: "pointer", opacity: f.title ? 1 : 0.3 }}>Save</button>
      </div>
    </div>
  );
}

// === TABLE ===
function TpTable({ items, onUpdate, onDelete, onAdd, stage, showFlow, onView }) {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const th = { padding: "5px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ background: "#fafbfc" }}>
            <th style={th}>#</th>
            <th style={th}>Title</th>
            <th style={th}>Subject</th>
            <th style={th}>Status</th>
            <th style={th}>Channels</th>
            {showFlow && <th style={th}>Flow</th>}
            <th style={th}>Notes</th>
            <th style={{ ...th, width: 24 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((tp, i) => {
            const isN = tp.cat === "new";
            return (
              <tr key={tp.id} style={{ borderBottom: i < items.length - 1 ? "1px solid #f8fafc" : "", background: isN ? "#f8fbff" : "" }}>
                <td style={{ padding: "7px 8px", fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: "#b0b8c4", width: 48 }}>{tp.seq || "-"}</td>
                <td style={{ padding: "7px 8px", fontWeight: 600, color: "#0f172a", maxWidth: 200 }}>
                  {EMAIL_CONTENT[tp.id] ? (
                    <span onClick={() => { if (onView) onView(tp); }} style={{ cursor: "pointer", borderBottom: "1px dashed #94a3b8" }}>{tp.title}</span>
                  ) : tp.title}
                  <NewBadge cat={tp.cat} />
                </td>
                <td style={{ padding: "7px 8px", color: "#64748b", fontStyle: "italic", maxWidth: 160, fontSize: 10 }}>{tp.subject || "-"}</td>
                <td style={{ padding: "7px 8px" }}><Pill label={tp.status} c={SM[tp.status].c} bg={SM[tp.status].bg} small /></td>
                <td style={{ padding: "7px 8px" }}>
                  <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {tp.channels.map((ch) => <Pill key={ch} label={ch} c={CM[ch].c} bg={CM[ch].bg} small />)}
                  </div>
                </td>
                {showFlow && <td style={{ padding: "7px 8px" }}>{tp.flow ? <FlowBadge fid={tp.flow} /> : ""}</td>}
                <td style={{ padding: "7px 8px", color: "#94a3b8", maxWidth: 140, fontSize: 9 }}>{tp.notes.length > 50 ? tp.notes.slice(0, 50) + "..." : tp.notes || "-"}</td>
                <td style={{ padding: "7px 8px", width: 24 }}>
                  <button onClick={() => setEditing(tp)} style={{ width: 22, height: 22, borderRadius: 4, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 10, color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center" }}>E</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {onAdd && (
        <div style={{ padding: "6px 8px" }}>
          <button onClick={() => setAdding(true)} style={{ padding: "4px 10px", borderRadius: 4, fontSize: 9, fontWeight: 600, background: "#f8fafc", color: "#64748b", border: "1px dashed #cbd5e1", cursor: "pointer" }}>+ Add</button>
        </div>
      )}
      {editing && (
        <Overlay onClose={() => setEditing(null)}>
          <EditForm tp={editing} onSave={(u) => { onUpdate(u); setEditing(null); }} onDelete={onDelete ? () => { onDelete(editing.id); setEditing(null); } : undefined} onCancel={() => setEditing(null)} />
        </Overlay>
      )}
      {adding && (
        <Overlay onClose={() => setAdding(false)}>
          <EditForm tp={T("new-" + Date.now(), "", "", "", stage || STAGES[0], "Planned", ["Email"], null, "new", "")} isNew onSave={(u) => { onAdd(u); setAdding(false); }} onCancel={() => setAdding(false)} />
        </Overlay>
      )}
    </div>
  );
}

// === ACCORDION ===
function Section({ title, items, flows, expanded, onToggle, children }) {
  const sc = {};
  items.forEach((t) => { sc[t.status] = (sc[t.status] || 0) + 1; });
  const prog = items.filter((t) => t.status === "Live" || t.status === "Approved").length;

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      <div onClick={onToggle} style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: expanded ? "1px solid #f1f5f9" : "none", userSelect: "none" }}>
        <span style={{ fontSize: 10, color: "#94a3b8", transform: expanded ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", width: 12, transition: "transform 0.2s" }}>&#9654;</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{title}</span>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>{items.length}</span>
            {(flows || []).map((fid) => <FlowBadge key={fid} fid={fid} />)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {Object.entries(sc).map(([s, c]) => (
            <span key={s} style={{ fontSize: 9, fontWeight: 700, color: SM[s].c, background: SM[s].bg, padding: "1px 5px", borderRadius: 3 }}>{c}</span>
          ))}
        </div>
        <div style={{ width: 90 }}><Bar n={prog} d={items.length} /></div>
      </div>
      {expanded && children}
    </div>
  );
}

// === MAIN ===
export default function TMRWPortal() {
  const [tps, setTps] = useState(null);
  const [bcs, setBcs] = useState(null);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exp, setExp] = useState({});
  const [tab, setTab] = useState("overview");
  const [stF, setStF] = useState([]);
  const [search, setSearch] = useState("");
  const [manageEditing, setManageEditing] = useState(null);
  const [manageAdding, setManageAdding] = useState(false);
  const [manageStage, setManageStage] = useState("all");
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = localStorage.getItem(STORAGE_KEY);
        if (r) {
          const d = JSON.parse(r);
          setTps(d.tps);
          setBcs(d.bcs);
          setLog(d.log || []);
        } else {
          const allTps = [...INIT_TPS, ...INIT_LEG];
          setTps(allTps);
          setBcs(INIT_BCS);
          setLog([]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ tps: allTps, bcs: INIT_BCS, log: [] }));
        }
      } catch (e) {
        setTps([...INIT_TPS, ...INIT_LEG]);
        setBcs(INIT_BCS);
        setLog([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = useCallback(async (nt, nb, nl) => {
    setTps(nt);
    setBcs(nb);
    setLog(nl);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tps: nt, bcs: nb, log: nl }));
    } catch (e) { /* silent */ }
  }, []);

  const updateTp = (u) => {
    const old = tps.find((t) => t.id === u.id);
    let nl = log;
    if (old && old.status !== u.status) {
      nl = [{ date: new Date().toISOString().slice(0, 10), title: u.title, from: old.status, to: u.status }, ...log].slice(0, 50);
    }
    save(tps.map((t) => t.id === u.id ? u : t), bcs, nl);
  };
  const deleteTp = (id) => save(tps.filter((t) => t.id !== id), bcs, log);
  const addTp = (n) => save([...tps, n], bcs, log);
  const updateBc = (u) => {
    const old = bcs.find((b) => b.id === u.id);
    let nl = log;
    if (old && old.status !== u.status) {
      nl = [{ date: new Date().toISOString().slice(0, 10), title: u.title, from: old.status, to: u.status }, ...log].slice(0, 50);
    }
    save(tps, bcs.map((b) => b.id === u.id ? u : b), nl);
  };

  if (loading || !tps) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui", color: "#94a3b8" }}>Loading...</div>;
  }

  const mainTps = tps.filter((t) => t.cat === "live" || t.cat === "new");
  const legTps = tps.filter((t) => t.cat === "legacy");
  const isF = stF.length > 0 || search.length > 0;

  const filter = (list) => list.filter((t) => {
    if (stF.length > 0 && !stF.includes(t.status)) return false;
    if (search) {
      const s = search.toLowerCase();
      return t.title.toLowerCase().includes(s) || t.subject.toLowerCase().includes(s) || t.notes.toLowerCase().includes(s);
    }
    return true;
  });

  // What's Next
  const blocked = tps.filter((t) => t.status === "Blocked");

  // Manage tab filtered
  const manageFiltered = tps.filter((t) => {
    if (manageStage !== "all" && t.stage !== manageStage) return false;
    if (stF.length > 0 && !stF.includes(t.status)) return false;
    if (search) {
      const s = search.toLowerCase();
      return t.title.toLowerCase().includes(s) || t.subject.toLowerCase().includes(s) || t.notes.toLowerCase().includes(s);
    }
    return true;
  });
  const flowApproved = {};
  tps.filter((t) => t.cat === "new" && t.status === "Approved" && t.flow).forEach((t) => {
    flowApproved[t.flow] = (flowApproved[t.flow] || 0) + 1;
  });

  const renderStages = (list, prefix, showFlow, canAdd) => {
    return STAGES.map((stage) => {
      const all = list.filter((t) => t.stage === stage);
      if (all.length === 0) return null;
      const show = isF ? filter(all) : all;
      if (show.length === 0 && isF) return null;
      const flows = [...new Set(show.filter((t) => t.flow).map((t) => t.flow))];
      const key = prefix + stage;

      return (
        <Section key={key} title={stage} items={show} flows={flows} expanded={!!exp[key]} onToggle={() => setExp((p) => ({ ...p, [key]: !p[key] }))}>
          <TpTable items={show} onUpdate={updateTp} onDelete={deleteTp} onAdd={canAdd ? addTp : undefined} stage={stage} showFlow={showFlow} onView={setViewing} />
        </Section>
      );
    });
  };

  const FilterBar = ({ statuses }) => (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." style={{ padding: "5px 9px", borderRadius: 5, border: "1px solid #d1d5db", fontSize: 10, width: 150, fontFamily: "inherit" }} />
      <span style={{ width: 1, height: 16, background: "#e2e8f0" }} />
      {statuses.map((s) => (
        <Pill key={s} label={s} c={stF.includes(s) ? SM[s].c : "#94a3b8"} bg={stF.includes(s) ? SM[s].bg : "#f1f5f9"} small onClick={() => setStF((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])} active={stF.includes(s)} />
      ))}
      {isF && <button onClick={() => { setStF([]); setSearch(""); }} style={{ padding: "2px 7px", borderRadius: 3, fontSize: 8, fontWeight: 600, background: "#fef2f2", color: "#ef4444", border: "none", cursor: "pointer" }}>Clear</button>}
      <div style={{ flex: 1 }} />
      <button onClick={() => { const k = {}; STAGES.forEach((s) => { k[(tab === "legacy" ? "l-" : "m-") + s] = true; }); setExp((p) => ({ ...p, ...k })); }} style={{ padding: "3px 8px", borderRadius: 4, fontSize: 9, background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", cursor: "pointer" }}>Expand all</button>
      <button onClick={() => setExp({})} style={{ padding: "3px 8px", borderRadius: 4, fontSize: 9, background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", cursor: "pointer" }}>Collapse all</button>
    </div>
  );

  const liveCt = tps.filter((t) => t.status === "Live").length;
  const appCt = tps.filter((t) => t.status === "Approved").length;

  return (
    <div style={{ fontFamily: "'Outfit', system-ui, sans-serif", background: "#f4f5f7", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      

      {/* Header */}
      <header style={{ background: "#0f172a", color: "#fff", padding: "0 20px", display: "flex", alignItems: "center", height: 48, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginRight: 24 }}>
          <span style={{ fontSize: 14, fontWeight: 800 }}>TMRW</span>
          <span style={{ fontSize: 10, color: "#64748b" }}>Comms Portal</span>
        </div>
        <nav style={{ display: "flex", gap: 1, flex: 1 }}>
          {[
            { k: "overview", l: "Overview" },
            { k: "journey", l: "Member Journey Flows" },
            { k: "manage", l: "Manage" },
            { k: "future", l: "Future State" },
            { k: "docs", l: "Email Docs" },
            { k: "legacy", l: "Legacy (" + legTps.length + ")" },
            { k: "broadcasts", l: "Broadcasts" },
            { k: "changelog", l: "Changelog" },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{ padding: "4px 12px", borderRadius: 5, fontSize: 11, fontWeight: 600, background: tab === t.k ? "rgba(255,255,255,0.1)" : "transparent", color: tab === t.k ? "#fff" : "#64748b", border: "none", cursor: "pointer" }}>
              {t.l}
            </button>
          ))}
        </nav>
        <button onClick={() => {
          const rows = [["Stage", "Seq", "Title", "Subject", "Status", "Channels", "Flow", "Category", "Notes"]];
          tps.forEach((t) => {
            rows.push([t.stage, t.seq, t.title, t.subject, t.status, t.channels.join("; "), t.flow ? (FD[t.flow] ? FD[t.flow].name : t.flow) : "", t.cat, t.notes]);
          });
          rows.push([]);
          rows.push(["BROADCASTS"]);
          rows.push(["Title", "Subject", "Status", "Channels", "Audience", "Notes"]);
          bcs.forEach((b) => {
            rows.push([b.title, b.subject, b.status, b.channels.join("; "), b.audience || "", b.notes]);
            if (b.variants) {
              b.variants.forEach((v) => {
                rows.push(["  Variant " + v.id, v.label, v.status, "", "", ""]);
              });
            }
          });
          const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "tmrw-comms-portal-" + new Date().toISOString().slice(0, 10) + ".csv";
          a.click();
          URL.revokeObjectURL(url);
        }} style={{ padding: "3px 9px", borderRadius: 4, fontSize: 9, background: "transparent", color: "#475569", border: "1px solid #334155", cursor: "pointer", marginRight: 4 }}>Download CSV</button>
        <button onClick={async () => { if (confirm("Reset all data?")) { const all = [...INIT_TPS, ...INIT_LEG]; await save(all, INIT_BCS, []); setExp({}); } }} style={{ padding: "3px 9px", borderRadius: 4, fontSize: 9, background: "transparent", color: "#475569", border: "1px solid #334155", cursor: "pointer" }}>Reset</button>
      </header>

      {/* Stats */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "10px 20px", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800 }}>{mainTps.length}</div><div style={{ fontSize: 8, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Journey</div></div>
        <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 800, color: "#10b981" }}>{liveCt}</div><div style={{ fontSize: 8, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Live</div></div>
        <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 800, color: "#3b82f6" }}>{appCt}</div><div style={{ fontSize: 8, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Approved</div></div>
        {blocked.length > 0 && <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 800, color: "#ef4444" }}>{blocked.length}</div><div style={{ fontSize: 8, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Blocked</div></div>}
        <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />
        <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 800, color: "#94a3b8" }}>{legTps.length}</div><div style={{ fontSize: 8, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Legacy</div></div>
      </div>

      {/* === OVERVIEW === */}
      {tab === "overview" && (
        <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto", width: "100%" }}>
          {/* Timeline */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "16px 12px", overflowX: "auto", marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 12px 4px", fontSize: 12, fontWeight: 700 }}>Member Journey Timeline</h3>
            <div style={{ display: "flex", alignItems: "flex-start", minWidth: 850 }}>
              {STAGES.map((stage, i) => {
                const st = mainTps.filter((t) => t.stage === stage);
                const hasNew = st.some((t) => t.cat === "new");
                const hasLive = st.some((t) => t.status === "Live");
                const flows = [...new Set(st.filter((t) => t.flow).map((t) => t.flow))];
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 7, background: hasNew ? "#3b82f6" : hasLive ? "#10b981" : "#e2e8f0", border: "2px solid #fff", zIndex: 2 }} />
                    {i < STAGES.length - 1 && <div style={{ position: "absolute", top: 7, left: "50%", width: "100%", height: 2, background: "#e2e8f0", zIndex: 1 }} />}
                    <div style={{ marginTop: 6, fontSize: 7, fontWeight: 600, color: "#64748b", textAlign: "center", maxWidth: 50 }}>{STAGE_SHORT[i]}</div>
                    <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
                      {flows.map((fid) => <span key={fid} style={{ fontSize: 6, fontWeight: 700, padding: "0 3px", borderRadius: 2, background: FD[fid].color + "20", color: FD[fid].color }}>{FD[fid].name}</span>)}
                      {st.length > 0 && <span style={{ fontSize: 7, color: "#94a3b8" }}>{st.length}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* What's Next */}
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700 }}>What's Next</h3>
              {blocked.map((t, i) => (
                <div key={t.id} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#ef4444", fontWeight: 700, width: 16 }}>!</span>
                  <div><div style={{ fontSize: 11, fontWeight: 600 }}>{t.title}</div><div style={{ fontSize: 10, color: "#64748b" }}>Unblock: {t.notes}</div></div>
                </div>
              ))}
              {[
                { icon: "W", c: "#eab308", title: "Waitlist Funnel (0.4-0.7b)", action: "Waiting on Kosta to implement triggers", flow: "waitlist" },
                { icon: "W", c: "#eab308", title: "Blood Test Flow", action: "Given to Kosta - waiting for him to implement", flow: "blood-test" },
                { icon: "W", c: "#eab308", title: "Dead Zone Sequence", action: "With Kosta - waiting for him to implement", flow: "dead-zone" },
                { icon: "B", c: "#ef4444", title: "Dashboard Unlock Flow", action: "Blocked - waiting on Membership ID to trigger", flow: "dashboard-unlock" },
                { icon: "W", c: "#eab308", title: "Precision Pods Sequence", action: "Waiting on Kosta to implement", flow: "precision-pods" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: item.c, fontWeight: 700, fontSize: 10, width: 16 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{item.action}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Implementation Progress */}
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700 }}>Implementation Progress</h3>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 10 }}>Your documented flows — copy written, waiting on platform build.</div>
              {Object.entries(FD).map(([fid, fl]) => {
                const ft = tps.filter((t) => t.flow === fid);
                if (ft.length === 0) return null;
                const live = ft.filter((t) => t.status === "Live").length;
                const app = ft.filter((t) => t.status === "Approved").length;
                return (
                  <div key={fid} style={{ marginBottom: 10, padding: "8px 10px", background: "#fafbfc", borderRadius: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: fl.color }} />
                      <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>{fl.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#3b82f6" }}>{Math.round(((live + app) / ft.length) * 100)}% written</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#10b981" }}>{Math.round((live / ft.length) * 100)}% live</span>
                    </div>
                    <Bar n={live} d={ft.length} />
                    <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 3 }}>Source: {fl.doc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent changelog */}
          {log.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16, marginTop: 14 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700 }}>Recent Changes</h3>
              {log.slice(0, 5).map((entry, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: "1px solid #f8fafc", alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: "#94a3b8", width: 60 }}>{entry.date}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, flex: 1 }}>{entry.title}</span>
                  <Pill label={entry.from} c={SM[entry.from].c} bg={SM[entry.from].bg} small />
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>-&gt;</span>
                  <Pill label={entry.to} c={SM[entry.to].c} bg={SM[entry.to].bg} small />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === MEMBER JOURNEY FLOWS === */}
      {tab === "journey" && (
        <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <FilterBar statuses={STATUSES} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {renderStages(mainTps, "m-", true, true)}
          </div>
        </div>
      )}

      {/* === FUTURE STATE === */}
      {tab === "future" && (
        <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Future State - TMRW 1.5</h2>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "#fef3c7", color: "#92400e" }}>~4 weeks</span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>All comms that need to be created or rewritten for the new member journey. 3-tier pod model (Core 30 / Perfect 70 / Precision 107), optional Welcome Call, personalised emails, at-home phlebotomy, survey architecture.</p>
          </div>
          {/* Summary cards */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", padding: "10px 14px", flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{INIT_FUTURE.length}</div>
              <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Total comms to create</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #fecaca", padding: "10px 14px", flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}>{INIT_FUTURE.filter(function(t){return t.priority==="V1";}).length}</div>
              <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>V1 - Critical</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #fef3c7", padding: "10px 14px", flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>{INIT_FUTURE.filter(function(t){return t.priority==="V2";}).length}</div>
              <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>V2 - High</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", padding: "10px 14px", flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#94a3b8" }}>{INIT_FUTURE.filter(function(t){return t.priority==="V3";}).length}</div>
              <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>V3 - Nice to have</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #dbeafe", padding: "10px 14px", flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#3b82f6" }}>{INIT_FUTURE.filter(function(t){return t.title.includes("REWRITE");}).length}</div>
              <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Rewrites</div>
            </div>
          </div>
          {/* Pod model */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16, marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700 }}>3-Tier Pod Model</h3>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "#ecfdf5", border: "1px solid #d1fae5" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#065f46" }}>Core Pod</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#065f46" }}>30</div>
                <div style={{ fontSize: 9, color: "#065f46" }}>ingredients from Health Story</div>
                <div style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>Week 2. Value from day one.</div>
              </div>
              <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "#eff6ff", border: "1px solid #dbeafe" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e40af" }}>Perfect Pod</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1e40af" }}>70</div>
                <div style={{ fontSize: 9, color: "#1e40af" }}>ingredients + blood pathology</div>
                <div style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>~2-3 weeks in</div>
              </div>
              <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "#f5f3ff", border: "1px solid #e9d5ff" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#6b21a8" }}>Precision Pod</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#6b21a8" }}>107</div>
                <div style={{ fontSize: 9, color: "#6b21a8" }}>full library + epigenetics</div>
                <div style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>~6-8 weeks in</div>
              </div>
            </div>
          </div>
          {/* Filter */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." style={{ padding: "5px 9px", borderRadius: 5, border: "1px solid #d1d5db", fontSize: 10, width: 150, fontFamily: "inherit" }} />
            <span style={{ width: 1, height: 16, background: "#e2e8f0" }} />
            <span style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Priority</span>
            {["V1", "V2", "V3"].map(function(p) {
              return <Pill key={p} label={p} c={stF.includes(p) ? FUT_PRI[p].c : "#94a3b8"} bg={stF.includes(p) ? FUT_PRI[p].bg : "#f1f5f9"} small onClick={function() { setStF(function(prev) { return prev.includes(p) ? prev.filter(function(x){return x!==p;}) : prev.concat([p]); }); }} active={stF.includes(p)} />;
            })}
            {isF && <button onClick={function() { setStF([]); setSearch(""); }} style={{ padding: "2px 7px", borderRadius: 3, fontSize: 8, fontWeight: 600, background: "#fef2f2", color: "#ef4444", border: "none", cursor: "pointer" }}>Clear</button>}
            <div style={{ flex: 1 }} />
            <button onClick={function() { var k = {}; FUTURE_STAGES.forEach(function(s) { k["fut-" + s] = true; }); setExp(function(p) { return Object.assign({}, p, k); }); }} style={{ padding: "3px 8px", borderRadius: 4, fontSize: 9, background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", cursor: "pointer" }}>Expand all</button>
            <button onClick={function() { setExp({}); }} style={{ padding: "3px 8px", borderRadius: 4, fontSize: 9, background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", cursor: "pointer" }}>Collapse all</button>
          </div>
          {/* Stage accordions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FUTURE_STAGES.map(function(stage) {
              var all = INIT_FUTURE.filter(function(t) { return t.stage === stage; });
              if (all.length === 0) return null;
              var show = all.filter(function(t) {
                if (stF.length > 0 && !stF.includes(t.priority)) return false;
                if (search) { var s = search.toLowerCase(); return t.title.toLowerCase().includes(s) || t.notes.toLowerCase().includes(s); }
                return true;
              });
              if (show.length === 0 && isF) return null;
              if (!isF) show = all;
              var priCounts = {};
              show.forEach(function(t) { priCounts[t.priority] = (priCounts[t.priority] || 0) + 1; });
              var key = "fut-" + stage;
              return (
                <div key={key} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                  <div onClick={function() { setExp(function(p) { var n = Object.assign({}, p); n[key] = !p[key]; return n; }); }} style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: exp[key] ? "1px solid #f1f5f9" : "none", userSelect: "none" }}>
                    <span style={{ fontSize: 10, color: "#94a3b8", transform: exp[key] ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", width: 12, transition: "transform 0.2s" }}>&#9654;</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{stage}</span>
                      <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 6 }}>{show.length} comms</span>
                    </div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {Object.entries(priCounts).map(function(e) { return <span key={e[0]} style={{ fontSize: 9, fontWeight: 700, color: FUT_PRI[e[0]].c, background: FUT_PRI[e[0]].bg, padding: "1px 5px", borderRadius: 3 }}>{e[1]} {e[0]}</span>; })}
                    </div>
                  </div>
                  {exp[key] && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                        <thead><tr style={{ background: "#fafbfc" }}>
                          <th style={{ padding: "5px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>#</th>
                          <th style={{ padding: "5px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>Title</th>
                          <th style={{ padding: "5px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>Priority</th>
                          <th style={{ padding: "5px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>Channels</th>
                          <th style={{ padding: "5px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>Notes</th>
                        </tr></thead>
                        <tbody>{show.map(function(tp, i) {
                          var isRewrite = tp.title.includes("REWRITE");
                          return (
                            <tr key={tp.id} style={{ borderBottom: i < show.length - 1 ? "1px solid #f8fafc" : "", background: isRewrite ? "#fffbeb" : "" }}>
                              <td style={{ padding: "7px 8px", fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: "#b0b8c4", width: 60 }}>{tp.seq}</td>
                              <td style={{ padding: "7px 8px", fontWeight: 600, color: "#0f172a", maxWidth: 220 }}>
                                {tp.title}
                                {isRewrite && <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, background: "#fef3c7", color: "#92400e", marginLeft: 4 }}>REWRITE</span>}
                              </td>
                              <td style={{ padding: "7px 8px" }}><Pill label={tp.priority} c={FUT_PRI[tp.priority].c} bg={FUT_PRI[tp.priority].bg} small /></td>
                              <td style={{ padding: "7px 8px" }}>
                                <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                  {tp.channels.map(function(ch) { return <Pill key={ch} label={ch} c={(CM[ch] || CM.Email).c} bg={(CM[ch] || CM.Email).bg} small />; })}
                                </div>
                              </td>
                              <td style={{ padding: "7px 8px", color: "#64748b", fontSize: 9, lineHeight: 1.3, maxWidth: 300 }}>{tp.notes}</td>
                            </tr>
                          );
                        })}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === EMAIL DOCS === */}
      {tab === "docs" && (
        <div style={{ padding: 20, maxWidth: 900, margin: "0 auto", width: "100%" }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700 }}>Email Documents</h2>
            <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Full email copy for all documented flows. Click any email to expand.</p>
          </div>
          {EMAIL_DOCS.map((doc) => (
            <div key={doc.flow} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{doc.flow}</h3>
                <span style={{ fontSize: 9, color: "#94a3b8" }}>{doc.emails.length} emails</span>
                <span style={{ fontSize: 9, color: "#94a3b8", marginLeft: "auto" }}>{doc.file}</span>
              </div>
              {doc.emails.map((em) => {
                const isOpen = exp["doc-" + em.id];
                return (
                  <div key={em.id} style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 4, overflow: "hidden" }}>
                    <div
                      onClick={() => setExp((p) => ({ ...p, ["doc-" + em.id]: !p["doc-" + em.id] }))}
                      style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, userSelect: "none" }}
                    >
                      <span style={{ fontSize: 10, color: "#94a3b8", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", width: 12, transition: "transform 0.2s" }}>&#9654;</span>
                      <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: "#94a3b8", width: 50 }}>{em.id}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", flex: 1 }}>{em.title}</span>
                      <span style={{ fontSize: 9, color: "#64748b" }}>{em.channels}</span>
                    </div>
                    {isOpen && (
                      <div style={{ padding: "0 14px 14px 36px", borderTop: "1px solid #f1f5f9" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10, marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 }}>Subject</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{em.subject}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 }}>From</div>
                            <div style={{ fontSize: 12, color: "#0f172a" }}>{em.from}</div>
                          </div>
                          {em.preview && (
                            <div style={{ gridColumn: "1 / -1" }}>
                              <div style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 }}>Preview Text</div>
                              <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>{em.preview}</div>
                            </div>
                          )}
                        </div>
                        <div style={{ background: "#fafbfc", borderRadius: 8, padding: "14px 16px", border: "1px solid #f1f5f9" }}>
                          <div style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 8 }}>Email Copy</div>
                          <div style={{ fontSize: 12, color: "#1e293b", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "system-ui" }}>{em.body}</div>
                        </div>
                        {em.sms && (
                          <div style={{ marginTop: 8, background: "#fefce8", borderRadius: 8, padding: "10px 14px", border: "1px solid #fef3c7" }}>
                            <div style={{ fontSize: 8, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 4 }}>SMS</div>
                            <div style={{ fontSize: 11, color: "#78350f", lineHeight: 1.5 }}>{em.sms}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* === LEGACY === */}
      {tab === "legacy" && (
        <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700 }}>Legacy - Planned / To Do</h2>
            <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>Old roadmap items that were never built. Parked for reference.</p>
          </div>
          <FilterBar statuses={["Planned"]} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {renderStages(legTps, "l-", false, false)}
          </div>
        </div>
      )}

      {/* === BROADCASTS === */}
      {tab === "broadcasts" && (
        <div style={{ padding: 20, maxWidth: 800, margin: "0 auto", width: "100%" }}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700 }}>Broadcasts</h2>
            <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>One-off campaigns. Sent to Kosta - status unconfirmed.</p>
          </div>
          {bcs.map((bc) => (
            <div key={bc.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "14px 16px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{bc.title}</span>
                <Pill label={bc.status} c={SM[bc.status].c} bg={SM[bc.status].bg} small />
              </div>
              <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", marginBottom: 4 }}>Subject: {bc.subject}</div>
              <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                {bc.channels.map((ch) => <Pill key={ch} label={ch} c={CM[ch].c} bg={CM[ch].bg} small />)}
              </div>
              {bc.audience && <div style={{ fontSize: 10, color: "#94a3b8" }}>Audience: {bc.audience}</div>}
              {bc.variants && (
                <div style={{ marginTop: 6, padding: "6px 8px", background: "#f8fafc", borderRadius: 6 }}>
                  {bc.variants.map((v) => (
                    <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#64748b", fontFamily: "monospace", width: 20 }}>{v.id}</span>
                      <span style={{ fontSize: 10, flex: 1 }}>{v.label}</span>
                      <Pill label={v.status} c={SM[v.status].c} bg={SM[v.status].bg} small />
                    </div>
                  ))}
                </div>
              )}
              {bc.notes && <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 4 }}>{bc.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {/* === MANAGE === */}
      {tab === "manage" && (
        <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Manage Touchpoints</h2>
            <button onClick={() => setManageAdding(true)} style={{ padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#0f172a", color: "#fff", border: "none", cursor: "pointer" }}>+ Add New</button>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." style={{ padding: "5px 9px", borderRadius: 5, border: "1px solid #d1d5db", fontSize: 10, width: 150, fontFamily: "inherit" }} />
            <span style={{ width: 1, height: 16, background: "#e2e8f0" }} />
            {STATUSES.map((s) => (
              <Pill key={s} label={s} c={stF.includes(s) ? SM[s].c : "#94a3b8"} bg={stF.includes(s) ? SM[s].bg : "#f1f5f9"} small onClick={() => setStF((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])} active={stF.includes(s)} />
            ))}
            {isF && <button onClick={() => { setStF([]); setSearch(""); }} style={{ padding: "2px 7px", borderRadius: 3, fontSize: 8, fontWeight: 600, background: "#fef2f2", color: "#ef4444", border: "none", cursor: "pointer" }}>Clear</button>}
            <div style={{ flex: 1 }} />
            <select value={manageStage} onChange={(e) => setManageStage(e.target.value)} style={{ padding: "5px 9px", borderRadius: 5, border: "1px solid #d1d5db", fontSize: 10, fontFamily: "inherit" }}>
              <option value="all">All stages</option>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#fafbfc" }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>#</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>Title</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>Stage</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>Status</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>Channels</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>Flow</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>Notes</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9", width: 60 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {manageFiltered.map((tp, i) => {
                  const isN = tp.cat === "new";
                  return (
                    <tr key={tp.id} style={{ borderBottom: "1px solid #f8fafc", background: isN ? "#f8fbff" : "" }}>
                      <td style={{ padding: "7px 8px", fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: "#b0b8c4", width: 48 }}>{tp.seq || "-"}</td>
                      <td style={{ padding: "7px 8px", fontWeight: 600, color: "#0f172a", maxWidth: 200 }}>{tp.title}{isN && <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, background: "#dbeafe", color: "#1e40af", marginLeft: 4 }}>NEW</span>}</td>
                      <td style={{ padding: "7px 8px", fontSize: 9, color: "#64748b", maxWidth: 120 }}>{tp.stage}</td>
                      <td style={{ padding: "7px 8px" }}>
                        <select
                          value={tp.status}
                          onChange={(e) => updateTp({ ...tp, status: e.target.value })}
                          style={{ padding: "2px 4px", borderRadius: 4, fontSize: 9, fontWeight: 600, border: "1px solid " + SM[tp.status].c, background: SM[tp.status].bg, color: SM[tp.status].c, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "7px 8px" }}>
                        <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                          {tp.channels.map((ch) => <Pill key={ch} label={ch} c={CM[ch].c} bg={CM[ch].bg} small />)}
                        </div>
                      </td>
                      <td style={{ padding: "7px 8px" }}>{tp.flow ? <FlowBadge fid={tp.flow} /> : ""}</td>
                      <td style={{ padding: "7px 8px", color: "#94a3b8", maxWidth: 180, fontSize: 9, lineHeight: 1.3 }}>{tp.notes && tp.notes.length > 60 ? tp.notes.slice(0, 60) + "..." : tp.notes || "-"}</td>
                      <td style={{ padding: "7px 8px", width: 60 }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => setManageEditing(tp)} style={{ width: 22, height: 22, borderRadius: 4, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 10, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>E</button>
                          <button onClick={() => { if (confirm("Delete " + tp.title + "?")) deleteTp(tp.id); }} style={{ width: 22, height: 22, borderRadius: 4, border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", fontSize: 10, color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>X</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {manageFiltered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No touchpoints match your filters.</div>}
          </div>
          {manageEditing && (
            <Overlay onClose={() => setManageEditing(null)}>
              <EditForm tp={manageEditing} onSave={(u) => { updateTp(u); setManageEditing(null); }} onDelete={() => { deleteTp(manageEditing.id); setManageEditing(null); }} onCancel={() => setManageEditing(null)} />
            </Overlay>
          )}
          {manageAdding && (
            <Overlay onClose={() => setManageAdding(false)}>
              <EditForm tp={T("new-" + Date.now(), "", "", "", STAGES[0], "Planned", ["Email"], null, "new", "")} isNew onSave={(u) => { addTp(u); setManageAdding(false); }} onCancel={() => setManageAdding(false)} />
            </Overlay>
          )}
        </div>
      )}

      {/* === CHANGELOG === */}
      {tab === "changelog" && (
        <div style={{ padding: 20, maxWidth: 800, margin: "0 auto", width: "100%" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Changelog</h2>
          {log.length === 0 && <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No changes yet. Status changes appear here automatically.</div>}
          {log.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16 }}>
              {log.map((entry, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < log.length - 1 ? "1px solid #f1f5f9" : "", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#94a3b8", width: 70, fontFamily: "monospace" }}>{entry.date}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>{entry.title}</span>
                  <Pill label={entry.from} c={SM[entry.from].c} bg={SM[entry.from].bg} small />
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>-&gt;</span>
                  <Pill label={entry.to} c={SM[entry.to].c} bg={SM[entry.to].bg} small />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === EMAIL CONTENT VIEWER === */}
      {viewing && (
        <Overlay onClose={() => setViewing(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
                {viewing.seq ? viewing.seq + " \u2014 " : ""}{viewing.stage}
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{viewing.title}</h3>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Pill label={viewing.status} c={SM[viewing.status].c} bg={SM[viewing.status].bg} small />
              {viewing.channels.map((ch) => <Pill key={ch} label={ch} c={CM[ch].c} bg={CM[ch].bg} small />)}
              {viewing.flow && <FlowBadge fid={viewing.flow} />}
            </div>
            {EMAIL_CONTENT[viewing.id] ? (
              <div style={{ background: "#fafbfc", borderRadius: 10, padding: 16, border: "1px solid #e5e7eb" }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 }}>Subject</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{EMAIL_CONTENT[viewing.id].subject}</div>
                  </div>
                  {EMAIL_CONTENT[viewing.id].preview && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 }}>Preview Text</div>
                      <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>{EMAIL_CONTENT[viewing.id].preview}</div>
                    </div>
                  )}
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 }}>From</div>
                    <div style={{ fontSize: 11, color: "#0f172a" }}>{EMAIL_CONTENT[viewing.id].from}</div>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Email Content Summary</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{EMAIL_CONTENT[viewing.id].body}</div>
                </div>
              </div>
            ) : (
              <div style={{ background: "#fafbfc", borderRadius: 10, padding: 20, border: "1px solid #e5e7eb", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
                Content not yet documented for this touchpoint.
              </div>
            )}
            {viewing.notes && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Trigger / Notes</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{viewing.notes}</div>
              </div>
            )}
            <button onClick={() => setViewing(null)} style={{ alignSelf: "flex-end", padding: "7px 16px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: "#0f172a", color: "#fff", border: "none", cursor: "pointer" }}>Close</button>
          </div>
        </Overlay>
      )}
    </div>
  );
}
