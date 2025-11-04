// script.js
// AASRA - Main frontend logic (module)
// Paste this file as /script.js (type="module" in index.html)

/*
  IMPORTANT:
  - Replace the placeholders below with your real Supabase URL and ANON key.
  - Replace VAPID_PUBLIC_KEY with your real VAPID public key (for push).
  - Replace SOS_BACKEND_URL with your deployed backend endpoint that sends webpush notifications.
*/

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://gzivkrzoitikwtrzmiah.supabase.co"; // <-- replace
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aXZrcnpvaXRpa3d0cnptaWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDYwNTUsImV4cCI6MjA3NzU4MjA1NX0.iBxJySLJuvgh6wvQlfe22JachiGbpD2JigSIlNsKB2Q"; // <-- replace
const SOS_BACKEND_URL = "https://https://aasra-app.vercel.app/api/send";
const VAPID_PUBLIC_KEY = "BGLwPjowyVIlRlAw9eKXKf4Rl7RzX_dkUslxYuyO8kBAxQhqsJRhVp442t9vaD_cpFyZwpS14rCQRqxuWoB3_tc"; // <-- replace with real base64 URL-safe key

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- App State ----
let currentUser = null; // Supabase user object OR { guest: true, role: 'elder' }
let currentView = "elder"; // 'elder' or 'caregiver'
let currentPage = "home"; // page identifier (home, meds, plan, etc.)
let currentLanguage = "en"; // 'en', 'hi', 'mr'
let showSOS = false;
let sosCountdownTimer = null;
let medicationReminderInterval = null;
let modalConfirmCallback = null;
let staticUiInitialized = false;

// ---- Mock data (fallback for guests) ----
let mockMedications = [
  { id: 1, name: "Metformin", dosage: "500mg", instruction: "Take before breakfast", time: "08:00", taken: false },
  { id: 2, name: "Lisinopril", dosage: "10mg", instruction: "Take with food", time: "09:00", taken: true },
  { id: 3, name: "Atorvastatin", dosage: "20mg", instruction: "Take before bed", time: "21:00", taken: false },
];

let mockSchedule = [
  { id: 1, type: "appointment", title: "Dr. Patel Check-up", time: "11:30", icon: "stethoscope" },
  { id: 2, type: "event", title: "Community Bingo", time: "16:00", icon: "users" },
];

let mockContacts = [
  { id: 1, name: "Anna (Daughter)", relation: "Family", number: "123-456-7890", icon: "users" },
  { id: 2, name: "Dr. Patel (GP)", relation: "Doctor", number: "234-567-8901", icon: "heart-pulse" },
];

let mockNearbyServices = [
  { id: 1, name: "Apollo Pharmacy", distance: "0.5 km", icon: "pill" },
  { id: 2, name: "City Hospital", distance: "1.2 km", icon: "building" },
];

let mockCommunityEvents = [
  { id: 1, name: "Morning Walk Club", time: "Today at 7:00 AM", location: "Local Park", icon: "coffee" },
  { id: 2, name: "Community Bingo", time: "Today at 4:00 PM", location: "Community Hall", icon: "users" },
];

// ---- Translations (small subset used in UI) ----
const translations = {
  en: {
    demoAasra: "Demo (Aasra):", viewingAs: "You are viewing as", elder: "Elder", caregiver: "Caregiver", switchTo: "Switch to",
    sos: "SOS", getHelpNow: "Get Help Now", nextReminder: "Next Reminder",
    meds: "Meds", calls: "Calls", nearby: "Nearby", community: "Community",
    yourMeds: "Your Medications", markAsTaken: "Mark as Taken", allDone: "All Done!", allDoneSub: "You've taken all your pills for now.",
    alreadyTaken: "Already Taken",
    todaysPlan: "Today's Plan", noUpcomingTasks: "No more tasks for today!",
    enableNotifications: "Enable Notifications", enableNotificationsSub: "Click to allow push notifications for important alerts.",
    callDoctorTitle: "Call Doctor?", callDoctorText: "This will start a call with the on-call doctor. Are you sure?", call: "Call", cancel: "Cancel",
    addMed: "Add Medication", medName: "Medication Name", dosage: "Dosage", time: "Time", instructions: "Instructions",
    addContact: "Add Contact", contactName: "Contact Name", relation: "Relation", phone: "Phone Number",
    addEntry: "Add Entry", appointment: "Appointment", event: "Event", title: "Title",
    addPlace: "Add Place", placeName: "Place Name", distance: "Distance",
    addEvent: "Add Event", eventName: "Event Name", location: "Location",
    profile: "Your Profile", shareYourId: "Share Your ID", shareYourIdSub: "Give this ID to your caregiver so they can connect to your account.",
    nextReminderFallback: "No upcoming reminders."
  },
  hi: {
    demoAasra: "डेमो (आसरा):", viewingAs: "आप के रूप में देख रहे हैं", elder: "बुज़ुर्ग", caregiver: "देखभाल करने वाला", switchTo: "में बदलें",
    sos: "SOS", getHelpNow: "अभी सहायता प्राप्त करें", nextReminder: "अगला रिमाइंडर",
    meds: "दवाएं", calls: "कॉल", nearby: "आस-पास", community: "समुदाय",
    yourMeds: "आपकी दवाएं", markAsTaken: "ले लिया के रूप में चिह्नित करें", allDone: "सब हो गया!", allDoneSub: "आपने अभी के लिए अपनी सभी गोलियां ले ली हैं।",
    alreadyTaken: "पहले ही ले ली गई",
    todaysPlan: "आज की योजना", noUpcomingTasks: "आज के लिए कोई और काम नहीं!",
    enableNotifications: "सूचनाएं सक्षम करें", enableNotificationsSub: "महत्वपूर्ण अलर्ट के लिए पुश सूचनाओं की अनुमति देने के लिए क्लिक करें।",
    callDoctorTitle: "डॉक्टर को कॉल करें?", callDoctorText: "यह ऑन-कॉल डॉक्टर के साथ कॉल शुरू करेगा। क्या आप निश्चित हैं?", call: "कॉल", cancel: "रद्द करें",
    addMed: "दवा जोड़ें", medName: "दवा का नाम", dosage: "खुराक", time: "समय", instructions: "निर्देश",
    addContact: "संपर्क जोड़ें", contactName: "संपर्क का नाम", relation: "रिश्ता", phone: "फ़ोन नंबर",
    addEntry: "एंट्री जोड़ें", appointment: "अपॉइंटमेंट", event: "इवेंट", title: "शीर्षक",
    addPlace: "स्थान जोड़ें", placeName: "स्थान का नाम", distance: "दूरी",
    addEvent: "इवेंट जोड़ें", eventName: "इवेंट का नाम", location: "जगह",
    profile: "आपकी प्रोफ़ाइल", shareYourId: "अपना आईडी साझा करें", shareYourIdSub: "यह आईडी अपने केयरगिवर को दें ताकि वे आपके खाते से जुड़ सकें।",
    nextReminderFallback: "कोई आगामी रिमाइंडर नहीं।"
  },
  mr: {
    demoAasra: "डेमो (आसरा):", viewingAs: "तुम्ही म्हणून पाहत आहात", elder: "ज्येष्ठ", caregiver: "काळजीवाहू", switchTo: "मध्ये बदला",
    sos: "SOS", getHelpNow: "आता मदत मिळवा", nextReminder: "पुढील रिमाइंडर",
    meds: "औषधे", calls: "कॉल", nearby: "जवळपास", community: "समुदाय",
    yourMeds: "तुमची औषधे", markAsTaken: "घेतले म्हणून चिन्हांकित करा", allDone: "सर्व झाले!", allDoneSub: "तुम्ही आत्तासाठी तुमच्या सर्व गोळ्या घेतल्या आहेत.",
    alreadyTaken: "आधीच घेतलेली",
    todaysPlan: "आजची योजना", noUpcomingTasks: "आजसाठी आणखी कार्ये नाहीत!",
    enableNotifications: "सूचना सक्षम करा", enableNotificationsSub: "महत्वाच्या सूचनांसाठी पुश नोटिफिकेशन्सना अनुमती देण्यासाठी क्लिक करा.",
    callDoctorTitle: "डॉक्टरला कॉल करायचे?", callDoctorText: "हे ऑन-कॉल डॉक्टरसोबत कॉल सुरू करेल. तुम्हाला खात्री आहे का?", call: "कॉल", cancel: "रद्द करा",
    addMed: "औषध जोडा", medName: "औषधाचे नाव", dosage: "डोस", time: "वेळ", instructions: "सूचना",
    addContact: "संपर्क जोडा", contactName: "संपर्काचे नाव", relation: "नाते", phone: "फोन नंबर",
    addEntry: "एंट्री जोडा", appointment: "अपॉइंटमेंट", event: "इव्हेंट", title: "शीर्षक",
    addPlace: "ठिकाण जोडा", placeName: "ठिकाणाचे नाव", distance: "अंतर",
    addEvent: "इव्हेंट जोडा", eventName: "इव्हेंटचे नाव", location: "ठिकाण",
    profile: "तुमची प्रोफाइल", shareYourId: "आपला आयडी शेअर करा", shareYourIdSub: "हा आयडी आपल्या केयरगिव्हरला द्या जेणेकरून ते तुमच्या खात्याशी कनेक्ट करू शकतील.",
    nextReminderFallback: "कोणतीही आगामी स्मरणिका नाहीत."
  }
};

function t(key) {
  return (translations[currentLanguage] && translations[currentLanguage][key]) || translations['en'][key] || key;
}

// ---- Utility: Toast ----
function showToast(message) {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) return;
  const el = document.createElement("div");
  el.className = "toast bg-green-500 text-white py-3 px-6 rounded-lg shadow-lg font-medium";
  el.innerText = message;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.style.animation = "slideOutDown 0.45s ease-in forwards";
    setTimeout(() => el.remove(), 450);
  }, 3000);
}

// ---- Auth / Init ----
document.addEventListener("DOMContentLoaded", () => {
  initApp().catch(err => {
    console.error("initApp error:", err);
    const app = document.getElementById("app");
    if (app) app.innerHTML = `<div class="p-6 text-center text-red-500">Error initializing app. Check console.</div>`;
  });
});

async function initApp() {
  // Attempt to restore session
  try {
    const { data } = await supabase.auth.getSession();
    currentUser = data?.session?.user || null;
  } catch (err) {
    console.error("supabase.getSession error:", err);
    currentUser = null;
  }

  // If user exists, load role from profiles table
  if (currentUser && !currentUser?.guest) {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();
      if (profile?.role) {
        currentUser.role = profile.role;
      } else {
        // role not set -> show role picker
        currentUser.role = null;
      }
    } catch (err) {
      console.warn("Could not fetch profile role:", err);
      currentUser.role = null;
    }
  }

  renderUI();
}

// ---- RENDER: Auth / Role Picker / Main App logic ----
function getAuthPageHtml() {
  const googleSvg = `<svg class="w-6 h-6 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">...svg...</svg>`;
  return `
    <div class="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-6">
      <div class="w-full max-w-sm">
        <div class="flex items-center justify-center text-5xl font-bold text-blue-600 mb-4">
          <i data-lucide="hand-heart" class="h-12 w-12 mr-3 text-blue-500"></i>
          <span>Aasra</span>
        </div>
        <p class="text-lg text-gray-600 text-center mb-10">Your senior care companion.</p>
        <button id="googleLoginBtn" class="w-full bg-white text-gray-700 font-medium px-4 py-3 rounded-xl shadow-md border border-gray-200 flex items-center justify-center transition-all duration-300 hover:shadow-lg active:scale-95">
          <svg class="w-6 h-6 mr-3" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#FFC107" d="M43.6 20.08H42V20H24v8h11.3c-1.65 4.66-6.08 8-11.3 8-6.63 0-12-5.37-12-12 0-6.63 5.37-12 12-12 3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 12.95 4 4 12.95 4 24c0 11.05 8.95 20 20 20 11.05 0 20-8.95 20-20 0-1.34-.14-2.65-.4-3.92z"/></svg>
          <span>Continue with Google</span>
        </button>

        <div class="flex items-center my-6">
          <hr class="flex-1 border-t border-gray-300"/>
          <span class="px-3 text-sm text-gray-400">or</span>
          <hr class="flex-1 border-t border-gray-300"/>
        </div>

        <button id="guestBtn" class="w-full bg-gray-600 text-white font-medium px-4 py-3 rounded-xl shadow-md flex items-center justify-center transition-all duration-300 hover:bg-gray-700 active:scale-95">
          <i data-lucide="user-circle" class="w-6 h-6 mr-3"></i>
          <span>Continue as Guest</span>
        </button>
      </div>
    </div>
  `;
}

function renderRolePickerHtml() {
  return `
    <div class="p-6 flex flex-col justify-center items-center min-h-screen bg-gray-50">
      <div class="w-full max-w-sm">
        <div class="flex items-center justify-center text-5xl font-bold text-blue-600 mb-4">
          <i data-lucide="hand-heart" class="h-12 w-12 mr-3 text-blue-500"></i>
          <span>Aasra</span>
        </div>
        <h2 class="text-2xl font-bold mb-8 text-center text-gray-700">Who are you?</h2>
        <button id="chooseElder" class="w-full bg-blue-600 text-white p-6 rounded-2xl mb-6 text-2xl font-bold flex items-center justify-center">
          <i data-lucide="user" class="h-8 w-8 mr-4"></i> Elder
        </button>
        <button id="chooseCare" class="w-full bg-green-600 text-white p-6 rounded-2xl text-2xl font-bold flex items-center justify-center">
          <i data-lucide="heart-pulse" class="h-8 w-8 mr-4"></i> Caregiver
        </button>
      </div>
    </div>
  `;
}

function renderUI() {
  const app = document.getElementById("app");
  const main = document.getElementById("main-app-container");
  if (!app || !main) {
    console.error("#app or #main-app-container missing from DOM");
    return;
  }

  // Not signed in -> show auth page
  if (!currentUser) {
    app.innerHTML = getAuthPageHtml();
    app.classList.remove("hidden");
    main.classList.add("hidden");
    attachAuthEvents();
    safeCreateIcons();
    return;
  }

  // Signed in but no role -> role picker
  if (!currentUser.role) {
    app.innerHTML = renderRolePickerHtml();
    app.classList.remove("hidden");
    main.classList.add("hidden");
    attachRolePickerEvents();
    safeCreateIcons();
    return;
  }

  // Signed in with role -> show main app
  app.innerHTML = "";
  app.classList.add("hidden");
  main.classList.remove("hidden");

  // Initialize static UI (wires listeners only once)
  initStaticUI();

  // Render content
  renderApp();
}

// ---- Attach events for auth page ----
function attachAuthEvents() {
  document.getElementById("googleLoginBtn")?.addEventListener("click", loginWithGoogle);
  document.getElementById("guestBtn")?.addEventListener("click", () => {
    currentUser = { guest: true, role: "elder" };
    loadDataFromLocalStorage();
    renderUI();
  });
}

function attachRolePickerEvents() {
  document.getElementById("chooseElder")?.addEventListener("click", () => saveRole("elder"));
  document.getElementById("chooseCare")?.addEventListener("click", () => saveRole("caregiver"));
}

// ---- Auth helpers ----
async function loginWithGoogle() {
  try {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    // Flow continues by redirect; session will be restored in initApp()
  } catch (err) {
    console.error("Google login failed:", err);
    alert("Login failed. See console.");
  }
}

async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("Error during signOut:", err);
  } finally {
    currentUser = null;
    staticUiInitialized = false;
    renderUI();
  }
}

// ---- Role saving ----
async function saveRole(role) {
  if (currentUser?.guest) {
    currentUser.role = role;
    saveDataToLocalStorage();
    renderUI();
    return;
  }

  try {
    await supabase.from("profiles").upsert({ id: currentUser.id, role });
    currentUser.role = role;
    renderUI();
  } catch (err) {
    console.error("Error saving role:", err);
    showToast("Could not save role");
  }
}

// ---- Main app render (static UI content) ----
function renderApp() {
  // Translate text nodes with data-i18n attributes
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key) el.innerText = t(key);
  });

  // Update view toggle text
  const viewToggleRole = document.getElementById("view-toggle-role");
  if (viewToggleRole) viewToggleRole.innerText = t(currentView === "elder" ? "elder" : "caregiver");

  const viewToggleTarget = document.getElementById("view-toggle-target");
  if (viewToggleTarget) viewToggleTarget.innerText = t(currentView === "elder" ? "caregiver" : "elder");

  // Language buttons classes
  ["en", "hi", "mr"].forEach(lang => {
    const btn = document.getElementById(`lang-${lang}`);
    if (!btn) return;
    btn.className = `py-1 px-3 rounded-full text-sm font-medium transition-all duration-300 ${currentLanguage === lang ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`;
  });

  // Show/hide elder/caregiver view
  document.getElementById("elder-view-container")?.classList.toggle("hidden", currentView !== "elder");
  document.getElementById("caregiver-view-container")?.classList.toggle("hidden", currentView !== "caregiver");

  // SOS modal handling
  document.getElementById("elder-bottom-nav-container")?.classList.toggle("hidden", currentView !== "elder" || showSOS);
  document.getElementById("sos-modal-container")?.classList.toggle("hidden", !showSOS);
  if (showSOS) return; // when SOS is active, don't re-render pages

  // Show the active page
  const elderPages = ["home", "plan", "meds", "contacts", "nearby", "community", "doctor"];
  elderPages.forEach(p => {
    const el = document.getElementById(`page-elder-${p}`);
    if (el && p !== currentPage && !(p === "doctor" && currentPage === "doctorOnCall")) el.classList.add("hidden");
  });

  if (currentView === "elder") {
    const pageId = currentPage === "doctorOnCall" ? "doctor" : currentPage;
    document.getElementById(`page-elder-${pageId}`)?.classList.remove("hidden");
    renderElderPages();
    renderElderBottomNav();
  } else {
    // Caregiver pages
    const caregiverPages = ["dashboard", "manage_meds", "manage_vitals", "manage_contacts", "manage_schedule", "manage_nearby", "manage_community", "manage_settings"];
    caregiverPages.forEach(p => {
      document.getElementById(`page-caregiver-${p}`)?.classList.add("hidden");
    });
    document.getElementById(`page-caregiver-${currentPage}`)?.classList.remove("hidden");
    renderCaregiverNav();
    renderCaregiverPage();
  }

  safeCreateIcons();
}

// ---- Elder page renderers ----
function renderElderBottomNav() {
  const navItems = [
    { name: t("home"), page: "home", icon: "home" },
    { name: t("todaysPlan"), page: "plan", icon: "calendar-check" },
    { name: t("meds"), page: "meds", icon: "pill" },
    { name: t("calls"), page: "contacts", icon: "phone-call" }
  ];
  const container = document.getElementById("elder-bottom-nav-container");
  if (!container) return;
  container.innerHTML = "";
  navItems.forEach(item => {
    const btn = document.createElement("button");
    btn.className = `nav-btn flex flex-col items-center justify-center p-4 w-1/4 transition-all duration-300 ${currentPage === item.page ? "text-blue-600" : "text-gray-500 hover:text-blue-500"}`;
    btn.setAttribute("data-page", item.page);
    btn.innerHTML = `<i data-lucide="${item.icon}" class="h-8 w-8"></i><span class="text-sm font-medium">${item.name}</span>`;
    container.appendChild(btn);
  });
  safeCreateIcons();
}

function getCombinedSchedule() {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const upcomingMeds = mockMedications
    .filter(m => !m.taken)
    .map(m => ({ ...m, type: "med", title: `${m.name} (${m.dosage || ""})`, instruction: m.instruction || "", icon: "pill" }));

  const upcomingSchedule = mockSchedule.map(s => ({ ...s, type: s.type || "event", title: s.title, instruction: s.title || "", icon: s.icon || "calendar" }));

  return [...upcomingMeds, ...upcomingSchedule]
    .filter(i => i.time)
    .filter(i => i.time >= currentTime)
    .sort((a, b) => a.time.localeCompare(b.time));
}

function updateNextReminder() {
  const combined = getCombinedSchedule();
  const textElMobile = document.getElementById("next-reminder-text");
  const textElDesktop = document.getElementById("next-reminder-text-desktop");
  let reminderText = t("nextReminderFallback");
  if (combined.length > 0) {
    const next = combined[0];
    reminderText = `${next.title} at ${next.time}`;
  }
  if (textElMobile) textElMobile.innerText = reminderText;
  if (textElDesktop) textElDesktop.innerText = reminderText;
}

// Render Meds page
function renderMedsPage() {
  const container = document.getElementById("meds-list-container");
  if (!container) return;
  container.innerHTML = "";
  const due = mockMedications.filter(m => !m.taken);
  const taken = mockMedications.filter(m => m.taken);

  if (due.length > 0) {
    due.forEach(med => {
      const html = `
        <div id="med-card-${med.id}" class="bg-white p-6 rounded-2xl shadow-md border-4 border-blue-500 transition-all duration-300 hover:shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-3xl font-bold">${med.name} <span class="text-2xl font-normal text-gray-600">(${med.dosage})</span></h2>
              <p class="text-2xl text-gray-600">${med.instruction}</p>
              <p class="text-2xl font-semibold text-gray-800">Due: ${med.time}</p>
            </div>
            <i data-lucide="pill" class="h-12 w-12 text-blue-500"></i>
          </div>
          <button data-id="${med.id}" class="mark-as-taken-btn mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-4 text-2xl font-bold">
            <i data-lucide="check-circle" class="h-7 w-7 mr-2"></i>${t("markAsTaken")}
          </button>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", html);
    });
  } else {
    container.innerHTML = `
      <div class="bg-green-100 p-6 rounded-2xl shadow-md border-4 border-green-500 flex flex-col items-center">
        <i data-lucide="check-circle" class="h-16 w-16 text-green-600 mb-4"></i>
        <h2 class="text-3xl font-bold text-green-800">${t("allDone")}</h2>
        <p class="text-2xl text-green-700">${t("allDoneSub")}</p>
      </div>
    `;
  }

  if (taken.length > 0) {
    container.insertAdjacentHTML("beforeend", `<h3 class="text-2xl font-semibold text-gray-700 pt-8 mt-8 border-t">${t("alreadyTaken")}</h3>`);
    taken.forEach(med => {
      container.insertAdjacentHTML("beforeend", `
        <div class="bg-white p-6 rounded-2xl shadow-sm border-4 border-gray-300 opacity-70">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-3xl font-bold text-gray-600 line-through">${med.name} <span class="text-2xl font-normal">(${med.dosage})</span></h2>
              <p class="text-2xl text-gray-500">${med.instruction}</p>
            </div>
            <i data-lucide="check-circle" class="h-12 w-12 text-green-500"></i>
          </div>
        </div>
      `);
    });
  }

  safeCreateIcons();
}

// Render Plan page
function renderElderPlanPage() {
  const container = document.getElementById("plan-list-container");
  if (!container) return;
  container.innerHTML = "";
  const combined = getCombinedSchedule();
  if (!combined || combined.length === 0) {
    container.innerHTML = `
      <div class="bg-green-100 p-6 rounded-2xl shadow-md border-4 border-green-500 flex flex-col items-center">
        <i data-lucide="check-circle" class="h-16 w-16 text-green-600 mb-4"></i>
        <h2 class="text-3xl font-bold text-green-800">${t("allDone")}</h2>
        <p class="text-2xl text-green-700">${t("noUpcomingTasks")}</p>
      </div>
    `;
    safeCreateIcons();
    return;
  }

  combined.forEach(item => {
    const iconColor = item.type === "med" ? "blue" : item.type === "appointment" ? "indigo" : "orange";
    container.insertAdjacentHTML("beforeend", `
      <div class="bg-white p-6 rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-bold">${item.title}</h2>
            <p class="text-2xl text-gray-600">${item.instruction || ""}</p>
            <p class="text-2xl font-semibold text-gray-800">Time: ${item.time}</p>
          </div>
          <i data-lucide="${item.icon}" class="h-12 w-12 text-${iconColor}-500"></i>
        </div>
        ${item.type === "med" && !item.taken ? `
          <button data-id="${item.id}" class="mark-as-taken-btn mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-4 text-2xl font-bold">
            <i data-lucide="check-circle" class="h-7 w-7 mr-2"></i>${t("markAsTaken")}
          </button>
        ` : ""}
      </div>
    `);
  });

  safeCreateIcons();
}

// Contacts / Nearby / Community pages
function renderContactsPage() {
  const container = document.getElementById("contacts-list-container");
  if (!container) return;
  container.innerHTML = "";
  mockContacts.forEach(contact => {
    container.insertAdjacentHTML("beforeend", `
      <a href="tel:${contact.number}" class="bg-white p-6 rounded-2xl shadow-md flex items-center justify-between">
        <div class="flex items-center">
          <i data-lucide="${contact.icon}" class="h-12 w-12 text-blue-500 mr-6"></i>
          <div>
            <h2 class="text-3xl font-bold">${contact.name}</h2>
            <p class="text-2xl text-gray-600">${contact.relation}</p>
          </div>
        </div>
        <i data-lucide="phone" class="h-12 w-12 text-green-500"></i>
      </a>
    `);
  });
  safeCreateIcons();
}

function renderNearbyPage() {
  const container = document.getElementById("nearby-list-container");
  if (!container) return;
  container.innerHTML = "";
  mockNearbyServices.forEach(s => {
    container.insertAdjacentHTML("beforeend", `
      <div class="bg-white p-6 rounded-2xl shadow-md flex items-center justify-between">
        <div class="flex items-center">
          <i data-lucide="${s.icon}" class="h-12 w-12 text-purple-500 mr-6"></i>
          <div>
            <h2 class="text-3xl font-bold">${s.name}</h2>
            <p class="text-2xl text-gray-600">${s.distance}</p>
          </div>
        </div>
        <button class="text-blue-500 hover:text-blue-700"><i data-lucide="navigation" class="h-10 w-10"></i></button>
      </div>
    `);
  });
  safeCreateIcons();
}

function renderCommunityPage() {
  const container = document.getElementById("community-events-container");
  if (!container) return;
  container.innerHTML = "";
  mockCommunityEvents.forEach(e => {
    container.insertAdjacentHTML("beforeend", `
      <div class="bg-white p-6 rounded-2xl shadow-md flex items-center">
        <i data-lucide="${e.icon}" class="h-12 w-12 text-orange-500 mr-6"></i>
        <div>
          <h2 class="text-3xl font-bold">${e.name}</h2>
          <p class="text-2xl text-gray-600">${e.time}</p>
          <p class="text-xl text-gray-500">${e.location}</p>
        </div>
      </div>
    `);
  });
  safeCreateIcons();
}

function renderElderPages() {
  if (currentPage === "home") updateNextReminder();
  if (currentPage === "plan") renderElderPlanPage();
  if (currentPage === "meds") renderMedsPage();
  if (currentPage === "contacts") renderContactsPage();
  if (currentPage === "nearby") renderNearbyPage();
  if (currentPage === "community") renderCommunityPage();
}

// ---- Caregiver renderers (simplified/stubbed but functional) ----
function renderCaregiverNav() {
  const navItems = [
    { name: t("atAGlance") || "At-a-Glance", page: "dashboard", icon: "layout-dashboard" },
    { name: t("manageMeds") || "Manage Meds", page: "manage_meds", icon: "pill" },
    { name: t("vitals") || "Vitals", page: "manage_vitals", icon: "line-chart" },
    { name: t("manageContacts") || "Manage Contacts", page: "manage_contacts", icon: "users" },
    { name: t("manageSchedule") || "Manage Schedule", page: "manage_schedule", icon: "calendar-days" },
    { name: t("manageNearby") || "Manage Nearby", page: "manage_nearby", icon: "map-pin" },
    { name: t("manageCommunity") || "Manage Community", page: "manage_community", icon: "coffee" },
    { name: t("settings") || "Settings", page: "manage_settings", icon: "settings" }
  ];
  const container = document.getElementById("caregiver-nav-list");
  if (!container) return;
  container.innerHTML = "";
  navItems.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<button data-page="${item.page}" class="nav-btn w-full flex items-center space-x-3 p-3 rounded-lg ${currentPage === item.page ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"}">
      <i data-lucide="${item.icon}" class="h-5 w-5"></i><span>${item.name}</span>
    </button>`;
    container.appendChild(li);
  });
  safeCreateIcons();
}

function renderCaregiverPage() {
  const rendererMap = {
    dashboard: renderCaregiverDashboard,
    manage_meds: renderCaregiverManageMeds,
    manage_vitals: renderCaregiverManageVitals,
    manage_contacts: renderCaregiverManageContacts,
    manage_schedule: renderCaregiverManageSchedule,
    manage_nearby: renderCaregiverManageNearby,
    manage_community: renderCaregiverManageCommunity,
    manage_settings: renderCaregiverManageSettings,
  };
  const renderer = rendererMap[currentPage];
  if (renderer) return renderer();
  // fallback
  const container = document.getElementById(`page-caregiver-${currentPage}`);
  if (container) container.innerHTML = `<div class="bg-white p-6 rounded-2xl shadow-lg"><h2 class="text-xl font-semibold mb-4">Manage ${currentPage}</h2><p>Coming soon</p></div>`;
}

// Caregiver page implementations (essential handlers)
function renderCaregiverDashboard() {
  const container = document.getElementById("page-caregiver-dashboard");
  if (!container) return;
  container.innerHTML = `<div class="bg-white p-6 rounded-2xl shadow-lg"><h2 class="text-2xl font-bold mb-6">At-a-Glance</h2><p class="text-gray-600">Dashboard content coming soon.</p></div>`;
}

function renderCaregiverManageMeds() {
  const container = document.getElementById("page-caregiver-manage_meds");
  if (!container) return;
  container.innerHTML = `
    <div class="bg-white p-6 rounded-2xl shadow-lg">
      <h2 class="text-2xl font-bold mb-6">${t("addMed")}</h2>
      <form id="form-add-med" class="mb-8 p-6 border rounded-lg bg-gray-50 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input id="new-med-name" placeholder="${t("medName")}" required class="p-3 border rounded-lg" />
          <input id="new-med-dosage" placeholder="${t("dosage")}" class="p-3 border rounded-lg" />
          <input id="new-med-time" type="time" required class="p-3 border rounded-lg" />
          <input id="new-med-instruction" placeholder="${t("instructions")}" class="p-3 border rounded-lg" />
        </div>
        <button type="submit" class="w-full bg-blue-500 text-white py-3 rounded-lg">${t("addMed")}</button>
      </form>
      <h3 class="text-xl font-semibold mb-4">Current Medications</h3>
      <div id="manage-meds-list" class="space-y-4"></div>
    </div>
  `;
  renderManageMedsList();
}

function renderManageMedsList() {
  const list = document.getElementById("manage-meds-list");
  if (!list) return;
  list.innerHTML = "";
  mockMedications.forEach(m => {
    list.insertAdjacentHTML("beforeend", `
      <div class="flex items-center justify-between p-4 bg-white border rounded-lg">
        <div>
          <p class="font-bold text-lg">${m.name} <span class="text-base font-normal text-gray-600">(${m.dosage || 'N/A'})</span></p>
          <p class="text-sm text-gray-500">${m.instruction} @ ${m.time}</p>
        </div>
        <button data-id="${m.id}" class="btn-delete-med text-red-500 p-2"><i data-lucide="trash-2" class="h-5 w-5"></i></button>
      </div>
    `);
  });
  safeCreateIcons();
}

function renderCaregiverManageVitals() {
  const container = document.getElementById("page-caregiver-manage_vitals");
  if (!container) return;
  container.innerHTML = `
    <div class="bg-white p-6 rounded-2xl shadow-lg">
      <h2 class="text-2xl font-bold mb-6">Vitals</h2>
      <p class="text-gray-600">Vitals management UI to be built.</p>
      <div id="manage-vitals-list" class="space-y-4 mt-4"></div>
    </div>
  `;
}

function renderCaregiverManageContacts() {
  const container = document.getElementById("page-caregiver-manage_contacts");
  if (!container) return;
  container.innerHTML = `
    <div class="bg-white p-6 rounded-2xl shadow-lg">
      <h2 class="text-2xl font-bold mb-6">${t("manageContacts") || "Manage Contacts"}</h2>
      <form id="form-add-contact" class="mb-8 p-6 border rounded-lg bg-gray-50 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input id="new-contact-name" placeholder="${t("contactName")}" class="p-3 border rounded-lg" required />
          <input id="new-contact-relation" placeholder="${t("relation")}" class="p-3 border rounded-lg" />
          <input id="new-contact-number" placeholder="${t("phone")}" class="p-3 border rounded-lg" required />
          <input id="new-contact-icon" placeholder="Icon (e.g., users)" class="p-3 border rounded-lg" />
        </div>
        <button type="submit" class="w-full bg-blue-500 text-white py-3 rounded-lg">${t("addContact")}</button>
      </form>
      <div id="manage-contacts-list" class="space-y-4"></div>
    </div>
  `;
  renderManageContactsList();
}

function renderManageContactsList() {
  const list = document.getElementById("manage-contacts-list");
  if (!list) return;
  list.innerHTML = "";
  mockContacts.forEach(c => {
    list.insertAdjacentHTML("beforeend", `
      <div class="flex items-center justify-between p-4 bg-white border rounded-lg">
        <div class="flex items-center">
          <i data-lucide="${c.icon || 'user'}" class="h-8 w-8 text-blue-500 mr-4"></i>
          <div>
            <p class="font-bold text-lg">${c.name}</p>
            <p class="text-sm text-gray-500">${c.relation} | ${c.number}</p>
          </div>
        </div>
        <button data-id="${c.id}" class="btn-delete-contact text-red-500 p-2"><i data-lucide="trash-2" class="h-5 w-5"></i></button>
      </div>
    `);
  });
  safeCreateIcons();
}

function renderCaregiverManageSchedule() {
  const container = document.getElementById("page-caregiver-manage_schedule");
  if (!container) return;
  container.innerHTML = `
    <div class="bg-white p-6 rounded-2xl shadow-lg">
      <h2 class="text-2xl font-bold mb-6">${t("manageSchedule") || "Manage Schedule"}</h2>
      <form id="form-add-schedule" class="mb-8 p-6 border rounded-lg bg-gray-50 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input id="new-schedule-title" placeholder="${t("title")}" class="p-3 border rounded-lg" required />
          <input id="new-schedule-time" type="time" class="p-3 border rounded-lg" required />
          <select id="new-schedule-type" class="p-3 border rounded-lg">
            <option value="appointment">${t("appointment")}</option>
            <option value="event">${t("event")}</option>
          </select>
        </div>
        <button type="submit" class="w-full bg-blue-500 text-white py-3 rounded-lg">${t("addEntry")}</button>
      </form>
      <div id="manage-schedule-list" class="space-y-4"></div>
    </div>
  `;
  renderManageScheduleList();
}

function renderManageScheduleList() {
  const list = document.getElementById("manage-schedule-list");
  if (!list) return;
  list.innerHTML = "";
  mockSchedule.forEach(item => {
    const icon = item.type === "appointment" ? "stethoscope" : "users";
    list.insertAdjacentHTML("beforeend", `
      <div class="flex items-center justify-between p-4 bg-white border rounded-lg">
        <div class="flex items-center">
          <i data-lucide="${icon}" class="h-8 w-8 text-indigo-500 mr-4"></i>
          <div>
            <p class="font-bold text-lg">${item.title}</p>
            <p class="text-sm text-gray-500">${item.type} at ${item.time}</p>
          </div>
        </div>
        <button data-id="${item.id}" class="btn-delete-schedule text-red-500 p-2"><i data-lucide="trash-2" class="h-5 w-5"></i></button>
      </div>
    `);
  });
  safeCreateIcons();
}

function renderCaregiverManageNearby() {
  const container = document.getElementById("page-caregiver-manage_nearby");
  if (!container) return;
  container.innerHTML = `
    <div class="bg-white p-6 rounded-2xl shadow-lg">
      <h2 class="text-2xl font-bold mb-6">${t("manageNearby") || "Manage Nearby"}</h2>
      <form id="form-add-nearby" class="mb-8 p-6 border rounded-lg bg-gray-50 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input id="new-nearby-name" placeholder="${t("placeName")}" class="p-3 border rounded-lg" required />
          <input id="new-nearby-distance" placeholder="${t("distance")}" class="p-3 border rounded-lg" />
          <input id="new-nearby-icon" placeholder="Icon (e.g., pill)" class="p-3 border rounded-lg" value="map-pin" />
        </div>
        <button type="submit" class="w-full bg-blue-500 text-white py-3 rounded-lg">${t("addPlace")}</button>
      </form>
      <div id="manage-nearby-list" class="space-y-4"></div>
    </div>
  `;
  renderManageNearbyList();
}

function renderManageNearbyList() {
  const list = document.getElementById("manage-nearby-list");
  if (!list) return;
  list.innerHTML = "";
  mockNearbyServices.forEach(item => {
    list.insertAdjacentHTML("beforeend", `
      <div class="flex items-center justify-between p-4 bg-white border rounded-lg">
        <div class="flex items-center">
          <i data-lucide="${item.icon || 'map-pin'}" class="h-8 w-8 text-purple-500 mr-4"></i>
          <div>
            <p class="font-bold text-lg">${item.name}</p>
            <p class="text-sm text-gray-500">${item.distance}</p>
          </div>
        </div>
        <button data-id="${item.id}" class="btn-delete-nearby text-red-500 p-2"><i data-lucide="trash-2" class="h-5 w-5"></i></button>
      </div>
    `);
  });
  safeCreateIcons();
}

function renderCaregiverManageCommunity() {
  const container = document.getElementById("page-caregiver-manage_community");
  if (!container) return;
  container.innerHTML = `
    <div class="bg-white p-6 rounded-2xl shadow-lg">
      <h2 class="text-2xl font-bold mb-6">${t("manageCommunity") || "Manage Community"}</h2>
      <form id="form-add-community" class="mb-8 p-6 border rounded-lg bg-gray-50 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input id="new-community-name" placeholder="${t("eventName")}" class="p-3 border rounded-lg" required />
          <input id="new-community-time" placeholder="${t("time") || 'Time'}" class="p-3 border rounded-lg" required />
          <input id="new-community-location" placeholder="${t("location")}" class="p-3 border rounded-lg" />
          <input id="new-community-icon" placeholder="Icon (e.g., coffee)" class="p-3 border rounded-lg" value="users" />
        </div>
        <button type="submit" class="w-full bg-blue-500 text-white py-3 rounded-lg">${t("addEvent")}</button>
      </form>
      <div id="manage-community-list" class="space-y-4"></div>
    </div>
  `;
  renderManageCommunityList();
}

function renderManageCommunityList() {
  const list = document.getElementById("manage-community-list");
  if (!list) return;
  list.innerHTML = "";
  mockCommunityEvents.forEach(item => {
    list.insertAdjacentHTML("beforeend", `
      <div class="flex items-center justify-between p-4 bg-white border rounded-lg">
        <div class="flex items-center">
          <i data-lucide="${item.icon || 'users'}" class="h-8 w-8 text-orange-500 mr-4"></i>
          <div>
            <p class="font-bold text-lg">${item.name}</p>
            <p class="text-sm text-gray-500">${item.time} | ${item.location}</p>
          </div>
        </div>
        <button data-id="${item.id}" class="btn-delete-community text-red-500 p-2"><i data-lucide="trash-2" class="h-5 w-5"></i></button>
      </div>
    `);
  });
  safeCreateIcons();
}

function renderCaregiverManageSettings() {
  const container = document.getElementById("page-caregiver-manage_settings");
  if (!container) return;
  container.innerHTML = `
    <div class="bg-white p-6 rounded-2xl shadow-lg">
      <h2 class="text-2xl font-bold mb-6">${t("enableNotifications")}</h2>
      <div class="p-4 border rounded-lg bg-gray-50">
        <h3 class="text-lg font-semibold">${t("enableNotifications")}</h3>
        <p class="text-gray-600 mb-4">${t("enableNotificationsSub")}</p>
        <button id="btn-enable-notifications" class="w-full md:w-auto bg-blue-500 text-white py-3 px-5 rounded-lg flex items-center">
          <i data-lucide="bell-ring" class="h-5 w-5 mr-2"></i><span>${t("enableNotifications")}</span>
        </button>
      </div>
    </div>
  `;
  safeCreateIcons();
}

// ---- STATE handlers & actions ----
function setLanguage(lang) {
  currentLanguage = lang;
  renderApp();
  saveDataToLocalStorage();
}

function toggleView() {
  currentView = currentView === "elder" ? "caregiver" : "elder";
  currentPage = currentView === "elder" ? "home" : "dashboard";
  renderApp();
  saveDataToLocalStorage();
}

function navigate(page) {
  if (showSOS) return;
  currentPage = page;
  window.scrollTo(0, 0);
  renderApp();
}

// Take med handler
function handleTakeMed(id) {
  const med = mockMedications.find(m => m.id === id);
  if (!med) return;
  med.taken = true;
  saveDataToLocalStorage();
  showToast(`Marked ${med.name} as taken`);
  renderMedsPage();
  updateNextReminder();
}

// SOS open/close
function openSOS() {
  showSOS = true;
  renderApp();
  // countdown
  let count = 10;
  const timerEl = document.getElementById("sos-countdown-timer");
  const countdownEl = document.getElementById("sos-status-countdown");
  const sendingEl = document.getElementById("sos-status-sending");
  const sentEl = document.getElementById("sos-status-sent");
  if (!timerEl || !countdownEl || !sendingEl || !sentEl) return;
  countdownEl.classList.remove("hidden");
  sendingEl.classList.add("hidden");
  sentEl.classList.add("hidden");
  timerEl.innerText = String(count);

  sosCountdownTimer = setInterval(async () => {
    count--;
    timerEl.innerText = String(count);
    if (count <= 0) {
      clearInterval(sosCountdownTimer);
      countdownEl.classList.add("hidden");
      sendingEl.classList.remove("hidden");

      // Send SOS to backend (placeholder URL). Backend should trigger webpush notifications.
      try {
        const userId = currentUser?.id || "guest";
        await fetch(SOS_BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId })
        });
        // simulate delay before showing "sent"
        setTimeout(() => {
          sendingEl.classList.add("hidden");
          sentEl.classList.remove("hidden");
          showToast("SOS sent");
        }, 1500);
      } catch (err) {
        console.error("SOS backend error:", err);
        sendingEl.classList.add("hidden");
        sentEl.classList.remove("hidden");
        showToast("SOS sent (local simulation)");
      }
    }
  }, 1000);
}

function closeSOS(cancelled = false) {
  if (sosCountdownTimer) clearInterval(sosCountdownTimer);
  sosCountdownTimer = null;
  showSOS = false;
  renderApp();
  if (cancelled) showToast("SOS Cancelled");
}

// Modal helpers
function openModal({ title, text, confirmText, onConfirm }) {
  const modal = document.getElementById("confirmation-modal");
  if (!modal) return;
  document.getElementById("modal-title").innerText = title;
  document.getElementById("modal-text").innerText = text;
  document.getElementById("modal-btn-confirm").innerText = confirmText || t("call");
  modalConfirmCallback = onConfirm;
  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = document.getElementById("confirmation-modal");
  if (modal) modal.classList.add("hidden");
  modalConfirmCallback = null;
}

// ---- Caregiver CRUD handlers ----
function handleAddMed(e) {
  e.preventDefault();
  const newMed = {
    id: Date.now(),
    name: document.getElementById("new-med-name").value,
    dosage: document.getElementById("new-med-dosage").value,
    time: document.getElementById("new-med-time").value,
    instruction: document.getElementById("new-med-instruction").value,
    taken: false
  };
  mockMedications.push(newMed);
  mockMedications.sort((a, b) => a.time.localeCompare(b.time));
  saveDataToLocalStorage();
  renderManageMedsList();
  e.target.reset();
  showToast(t("addMed") + " added");
}

function handleDeleteMed(id) {
  mockMedications = mockMedications.filter(m => m.id !== id);
  saveDataToLocalStorage();
  renderManageMedsList();
  showToast("Medication deleted");
}

function handleAddContact(e) {
  e.preventDefault();
  const newContact = {
    id: Date.now(),
    name: document.getElementById("new-contact-name").value,
    relation: document.getElementById("new-contact-relation").value,
    number: document.getElementById("new-contact-number").value,
    icon: document.getElementById("new-contact-icon").value || "user"
  };
  mockContacts.push(newContact);
  saveDataToLocalStorage();
  renderManageContactsList();
  e.target.reset();
  showToast(t("addContact") + " added");
}

function handleDeleteContact(id) {
  mockContacts = mockContacts.filter(c => c.id !== id);
  saveDataToLocalStorage();
  renderManageContactsList();
  showToast("Contact deleted");
}

function handleAddSchedule(e) {
  e.preventDefault();
  const newEntry = {
    id: Date.now(),
    title: document.getElementById("new-schedule-title").value,
    time: document.getElementById("new-schedule-time").value,
    type: document.getElementById("new-schedule-type").value,
    icon: document.getElementById("new-schedule-type").value === "appointment" ? "stethoscope" : "users"
  };
  mockSchedule.push(newEntry);
  mockSchedule.sort((a, b) => a.time.localeCompare(b.time));
  saveDataToLocalStorage();
  renderManageScheduleList();
  e.target.reset();
  showToast(t("addEntry") + " added");
}

function handleDeleteSchedule(id) {
  mockSchedule = mockSchedule.filter(s => s.id !== id);
  saveDataToLocalStorage();
  renderManageScheduleList();
  showToast("Schedule entry deleted");
}

function handleAddNearby(e) {
  e.preventDefault();
  const newNearby = {
    id: Date.now(),
    name: document.getElementById("new-nearby-name").value,
    distance: document.getElementById("new-nearby-distance").value,
    icon: document.getElementById("new-nearby-icon").value || "map-pin"
  };
  mockNearbyServices.push(newNearby);
  saveDataToLocalStorage();
  renderManageNearbyList();
  e.target.reset();
  showToast(t("addPlace") + " added");
}

function handleDeleteNearby(id) {
  mockNearbyServices = mockNearbyServices.filter(s => s.id !== id);
  saveDataToLocalStorage();
  renderManageNearbyList();
  showToast("Place deleted");
}

function handleAddCommunity(e) {
  e.preventDefault();
  const newEvent = {
    id: Date.now(),
    name: document.getElementById("new-community-name").value,
    time: document.getElementById("new-community-time").value,
    location: document.getElementById("new-community-location").value,
    icon: document.getElementById("new-community-icon").value || "users"
  };
  mockCommunityEvents.push(newEvent);
  saveDataToLocalStorage();
  renderManageCommunityList();
  e.target.reset();
  showToast(t("addEvent") + " added");
}

function handleDeleteCommunity(id) {
  mockCommunityEvents = mockCommunityEvents.filter(e => e.id !== id);
  saveDataToLocalStorage();
  renderManageCommunityList();
  showToast("Event deleted");
}

// ---- LocalStorage (guest) persistence ----
function saveDataToLocalStorage() {
  if (!currentUser?.guest) return;
  try {
    localStorage.setItem("aasra_medications", JSON.stringify(mockMedications));
    localStorage.setItem("aasra_contacts", JSON.stringify(mockContacts));
    localStorage.setItem("aasra_schedule", JSON.stringify(mockSchedule));
    localStorage.setItem("aasra_nearby", JSON.stringify(mockNearbyServices));
    localStorage.setItem("aasra_community", JSON.stringify(mockCommunityEvents));
    localStorage.setItem("aasra_language", currentLanguage);
    localStorage.setItem("aasra_view", currentView);
    localStorage.setItem("aasra_page", currentPage);
  } catch (err) {
    console.warn("Failed to save to localStorage:", err);
  }
}

function loadDataFromLocalStorage() {
  if (!currentUser?.guest) return;
  try {
    const meds = localStorage.getItem("aasra_medications");
    const contacts = localStorage.getItem("aasra_contacts");
    const schedule = localStorage.getItem("aasra_schedule");
    const nearby = localStorage.getItem("aasra_nearby");
    const community = localStorage.getItem("aasra_community");
    const lang = localStorage.getItem("aasra_language");
    const view = localStorage.getItem("aasra_view");
    const page = localStorage.getItem("aasra_page");

    if (meds) mockMedications = JSON.parse(meds);
    if (contacts) mockContacts = JSON.parse(contacts);
    if (schedule) mockSchedule = JSON.parse(schedule);
    if (nearby) mockNearbyServices = JSON.parse(nearby);
    if (community) mockCommunityEvents = JSON.parse(community);
    if (lang) currentLanguage = lang;
    if (view) currentView = view;
    if (page) currentPage = page;
  } catch (err) {
    console.warn("Failed to load from localStorage:", err);
  }
}

// ---- Notifications & Service Worker ----
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function enableNotifications() {
  try {
    if (!("Notification" in window)) {
      showToast("Notifications not supported");
      return;
    }
    if (!("serviceWorker" in navigator)) {
      showToast("Service Worker not supported");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      showToast("Notification permission denied");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const converted = urlBase64ToUint8Array(VAPID_PUBLIC_KEY || "");
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: converted
    });

    // Save subscription server-side if authenticated; localStorage for guest
    if (currentUser && !currentUser.guest) {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          await supabase.from("push_subscriptions").upsert({
            user_id: data.user.id,
            subscription: sub.toJSON()
          }, { onConflict: "user_id" });
        }
      } catch (err) {
        console.error("Failed to upsert subscription:", err);
      }
    } else {
      localStorage.setItem("aasra_push_subscription", JSON.stringify(sub.toJSON()));
    }

    showToast("Notifications enabled");
    // start medication reminders (app must be open)
    startMedicationReminders();
  } catch (err) {
    console.error("enableNotifications error:", err);
    showToast("Could not enable notifications");
  }
}

// Medication reminders (checks local mock list every minute)
function startMedicationReminders() {
  if (medicationReminderInterval) clearInterval(medicationReminderInterval);
  medicationReminderInterval = setInterval(checkMedicationReminders, 60000); // every minute
  checkMedicationReminders();
}

async function checkMedicationReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  loadDataFromLocalStorage(); // ensure guest list loaded
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  for (const med of mockMedications) {
    if (!med.taken && med.time === currentTime) {
      // show notification via service worker registration
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.showNotification) {
          registration.showNotification("💊 Medication Reminder", {
            body: `Time to take ${med.name} ${med.dosage}\n${med.instruction || ""}`,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            tag: `med-${med.id}`,
            renotify: true,
            actions: [{ action: "taken", title: "Mark as Taken" }, { action: "snooze", title: "Snooze 10m" }],
            requireInteraction: true
          });
        }
      } catch (err) {
        console.error("Notification show error:", err);
      }
    }
  }
}

// ---- Service Worker registration & message handling ----
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").then(reg => {
    console.log("Service worker registered:", reg.scope);
  }).catch(err => console.warn("SW register failed:", err));

  navigator.serviceWorker.addEventListener("message", event => {
    const d = event.data;
    if (!d || !d.type) return;
    if (d.type === "MARK_MED_TAKEN") {
      const medId = d.medId;
      const med = mockMedications.find(m => m.id === medId);
      if (med) {
        med.taken = true;
        saveDataToLocalStorage();
        showToast(`✅ ${med.name} marked as taken`);
        if (currentPage === "meds") renderMedsPage();
      }
    }
  });
}

// ---- Safe icon renderer (lucide) ----
function safeCreateIcons() {
  if (window.lucide && typeof lucide.createIcons === "function") {
    try {
      lucide.createIcons();
    } catch (err) {
      // ignore
    }
  }
}

// ---- Initialize static UI listeners (run once) ----
function initStaticUI() {
  if (staticUiInitialized) return;
  staticUiInitialized = true;

  // Load guest state
  if (currentUser?.guest) loadDataFromLocalStorage();

  // Restore notification reminder if permission already granted
  if ("Notification" in window && Notification.permission === "granted") {
    startMedicationReminders();
  }

  // Logout static button
  document.getElementById("logoutBtnStatic")?.addEventListener("click", async () => {
    await signOut();
    window.location.reload();
  });

  // Language buttons
  document.getElementById("lang-en")?.addEventListener("click", () => setLanguage("en"));
  document.getElementById("lang-hi")?.addEventListener("click", () => setLanguage("hi"));
  document.getElementById("lang-mr")?.addEventListener("click", () => setLanguage("mr"));

  // View toggle
  document.getElementById("view-toggle-btn")?.addEventListener("click", toggleView);

  // SOS modal open/cancel/ok
  document.getElementById("btn-sos-open")?.addEventListener("click", openSOS);
  document.getElementById("btn-sos-cancel")?.addEventListener("click", () => closeSOS(true));
  document.getElementById("btn-sos-ok")?.addEventListener("click", () => closeSOS(false));

  // Modal controls
  document.getElementById("modal-btn-cancel")?.addEventListener("click", closeModal);
  document.getElementById("modal-btn-confirm")?.addEventListener("click", () => {
    if (modalConfirmCallback) modalConfirmCallback();
    closeModal();
  });

  // Doctor on call
  document.getElementById("btn-open-call-modal")?.addEventListener("click", () => {
    openModal({
      title: t("callDoctorTitle"),
      text: t("callDoctorText"),
      confirmText: t("call"),
      onConfirm: () => {
        showToast("Calling doctor...");
      }
    });
  });

  // Enable notifications button (caregiver settings page)
  document.body.addEventListener("click", (e) => {
    if (e.target && e.target.closest && e.target.closest("#btn-enable-notifications")) {
      enableNotifications();
    }
  });

  // Global navigation via .nav-btn (event delegation)
  document.body.addEventListener("click", (e) => {
    const navButton = e.target.closest && e.target.closest(".nav-btn");
    if (navButton && navButton.closest("#app") === null) {
      const page = navButton.dataset.page;
      if (page) navigate(page);
    }
  });

  // Dynamic action buttons (event delegation)
  document.body.addEventListener("click", (e) => {
    // Mark as taken - elder
    const takeBtn = e.target.closest && e.target.closest(".mark-as-taken-btn");
    if (takeBtn) {
      handleTakeMed(parseInt(takeBtn.dataset.id));
      return;
    }

    // Caregiver delete buttons
    const delMed = e.target.closest && e.target.closest(".btn-delete-med");
    if (delMed) { handleDeleteMed(parseInt(delMed.dataset.id)); return; }

    const delContact = e.target.closest && e.target.closest(".btn-delete-contact");
    if (delContact) { handleDeleteContact(parseInt(delContact.dataset.id)); return; }

    const delSched = e.target.closest && e.target.closest(".btn-delete-schedule");
    if (delSched) { handleDeleteSchedule(parseInt(delSched.dataset.id)); return; }

    const delNearby = e.target.closest && e.target.closest(".btn-delete-nearby");
    if (delNearby) { handleDeleteNearby(parseInt(delNearby.dataset.id)); return; }

    const delCommunity = e.target.closest && e.target.closest(".btn-delete-community");
    if (delCommunity) { handleDeleteCommunity(parseInt(delCommunity.dataset.id)); return; }

    // Copy profile ID
    if (e.target.closest && e.target.closest("#profile-copy-id-btn")) {
      const profileIdEl = document.getElementById("profile-user-id");
      const text = profileIdEl?.innerText || (currentUser?.id || "guest-id");
      navigator.clipboard?.writeText(text).then(() => showToast("Copied ID")).catch(()=>showToast("Copy failed"));
      return;
    }
  });

  // Form submit handlers via delegation
  document.body.addEventListener("submit", (e) => {
    if (e.target.id === "form-add-med") handleAddMed(e);
    if (e.target.id === "form-add-contact") handleAddContact(e);
    if (e.target.id === "form-add-schedule") handleAddSchedule(e);
    if (e.target.id === "form-add-nearby") handleAddNearby(e);
    if (e.target.id === "form-add-community") handleAddCommunity(e);
  });

  // Initial render
  renderApp();
}

// ---- Small helpers for rendering lists that are used by handlers ----
// function renderManageMedsList() { renderCaregiverManageMeds(); } // already renders list inside function
// function renderManageContactsList() { renderCaregiverManageContacts(); }
// function renderManageScheduleList() { renderCaregiverManageSchedule(); }
// function renderManageNearbyList() { renderCaregiverManageNearby(); }
// function renderManageCommunityList() { renderCaregiverManageCommunity(); }
function renderManageVitalsList() { /* not implemented */ }

// ---- When auth state changes (supabase real-time auth) ----
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) currentUser = session.user;
  else currentUser = null;
  // reload role if needed
  if (currentUser && !currentUser.guest) {
    (async () => {
      try {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single();
        currentUser.role = profile?.role || null;
      } catch (err) {
        currentUser.role = null;
      } finally {
        staticUiInitialized = false;
        renderUI();
      }
    })();
  } else {
    staticUiInitialized = false;
    renderUI();
  }
});

// ---- Utility: ensure lucide icons are re-created when DOM changes ----
function createIconsLater() {
  setTimeout(safeCreateIcons, 60);
}

// ---- Final: expose a debug helper on window for dev convenience ----
window._aasra = {
  supabase,
  getState: () => ({ currentUser, currentView, currentPage, currentLanguage }),
  setUserAsGuest: () => { currentUser = { guest: true, role: "elder" }; loadDataFromLocalStorage(); renderUI(); },
  enableNotifications,
};

// ---- End of script.js ----
