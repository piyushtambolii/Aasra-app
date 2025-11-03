import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// IMPORTANT SECURITY NOTE:
// The Supabase keys below should be replaced with your own ANON/PUBLIC key, NOT the service_role key.
// The anon key has Row Level Security (RLS) enabled, which is essential for production security.
// Get your anon key from: https://app.supabase.com/project/_/settings/api
// For now, using a placeholder - replace with your actual anon key
const supabaseUrl = "https://gzivkrzoitikwtrzmiah.supabase.co";
const supabaseKey = "YOUR_SUPABASE_ANON_KEY_HERE"; // Replace with your anon key
const supabase = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
const app = document.getElementById("app");
let currentPage = "home";

// --- FIX: REMOVED this top-level line. It was redundant and problematic. ---
// document.getElementById("googleLoginBtn")?.addEventListener("click", loginWithGoogle);

/* ======= Insert this after: const app = document.getElementById("app"); ======= */

/* --- Basic auth & main page render helpers --- */
function getAuthPage() {
  // Use an inline SVG for the Google logo
  const googleLogoSvg = `
    <svg class="w-6 h-6 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.641-3.108-11.28-7.581l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.971,36.35,44,30.601,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
  `;

  return `
    <div class="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-6">
      <div class="w-full max-w-sm">
        <!-- Logo -->
        <div class="flex items-center justify-center text-5xl font-bold text-blue-600 mb-4">
          <i data-lucide="hand-heart" class="h-12 w-12 mr-3 text-blue-500"></i>
          <span>Aasra</span>
        </div>
        <p class="text-lg text-gray-600 text-center mb-10">Your senior care companion.</p>

        <!-- Google Login Button -->
        <button id="googleLoginBtn" class="w-full bg-white text-gray-700 font-medium px-4 py-3 rounded-xl shadow-md border border-gray-200 flex items-center justify-center transition-all duration-300 hover:shadow-lg active:scale-95">
          ${googleLogoSvg}
          <span>Continue with Google</span>
        </button>

        <!-- Separator -->
        <div class="flex items-center my-6">
          <hr class="flex-1 border-t border-gray-300"/>
          <span class="px-3 text-sm text-gray-400">or</span>
          <hr class="flex-1 border-t border-gray-300"/>
        </div>

        <!-- Guest Login Button -->
        <button id="guestBtn" class="w-full bg-gray-600 text-white font-medium px-4 py-3 rounded-xl shadow-md flex items-center justify-center transition-all duration-300 hover:bg-gray-700 active:scale-95">
          <i data-lucide="user-circle" class="w-6 h-6 mr-3"></i>
          <span>Continue as Guest</span>
        </button>
      </div>
    </div>
  `;
}

// These functions are no longer needed, as we are using the static UI
/*
function getMainPage() { ... }
function renderPageContent() { ... }
*/

/* --- Event wiring for buttons rendered inside the app --- */
function attachNavEvents() {
  // These listeners are for the DYNAMICALLY INJECTED UI
  // (the login page, and the old placeholder dashboard)
  
  // bottom nav (for old placeholder UI, no longer used)
  document.querySelectorAll(".navBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      currentPage = btn.dataset.page;
      renderUI();
    });
  });

  // logout (for old placeholder UI, no longer used)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    currentUser = null;
    renderUI();
  });

  // SOS (for old placeholder UI, no longer used)
  const sosBtn = document.getElementById("triggerSOS");
  if (sosBtn) sosBtn.addEventListener("click", handleSOS);

  // Auth page buttons (google + guest) — these elements only exist on auth page
  const googleBtn = document.getElementById("googleLoginBtn");
  if (googleBtn) googleBtn.addEventListener("click", loginWithGoogle);

  const guestBtn = document.getElementById("guestBtn");
  if (guestBtn) guestBtn.addEventListener("click", () => {
    currentUser = { guest: true };
    // Assign a default role for guest users
    currentUser.role = 'elder'; 
    renderUI(); // Re-render to show main app
  });

  // --- ADDED: Listeners for role picker buttons ---
  const elderBtn = document.getElementById("chooseElder");
  if (elderBtn) elderBtn.addEventListener("click", () => saveRole("elder"));
  
  const careBtn = document.getElementById("chooseCare");
  if (careBtn) careBtn.addEventListener("click", () => saveRole("caregiver"));
}

/* --- placeholder SOS handler --- */
function handleSOS() {
  // small placeholder — we'll replace with real backend call
  alert("SOS triggered — backend not wired in this dev build");
}

/* ======= end insertion block ======= */


document.addEventListener("DOMContentLoaded", initApp);
        // --- Application init (wrap top-level awaits inside an async init) ---
async function initApp() {
  try {
    const { data } = await supabase.auth.getSession();
    currentUser = data.session?.user || null;

    if (!currentUser) {
      // No user, just show the login page
      renderUI();
      return;
    }

    // User exists, check for their role in our 'profiles' table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (!profile || !profile.role) {
      // User is logged in but has no role, show role picker
      renderUI(); // Call renderUI, which will show role picker
      return;
    }

    // User is logged in and has a role, show the main app
    currentUser.role = profile.role;
    renderUI();
  } catch (error) {
    console.error("Error during app initialization:", error);
    if (app) {
        app.innerHTML = `<div class="p-4 text-center text-red-500">Error loading app. Please check console.</div>`;
    }
  }
}

// initApp(); 
// start


function renderUI() {
  const mainAppContainer = document.getElementById('main-app-container');
  // --- FIX: Guard against app/mainAppContainer not existing ---
  if (!app || !mainAppContainer) {
    console.error("Fatal Error: #app or #main-app-container not found in DOM.");
    return;
  }

  if (!currentUser) {
    // LOGGED OUT STATE
    // Show login page, hide main app
    app.innerHTML = getAuthPage();
    app.classList.remove('hidden');
    mainAppContainer.classList.add('hidden');
    
    attachNavEvents(); // Attach listeners for login buttons
    
    // --- FIX: Safety check for lucide ---
    if (window.lucide) {
      lucide.createIcons(); // Render login page icons
    } else {
      console.warn("Lucide icons not loaded, skipping icon render for login.");
    }
    return;
  }

  if (!currentUser.role) {
    // LOGGED IN, BUT NO ROLE STATE
    // Show role picker, hide main app
    app.innerHTML = renderRolePicker();
    app.classList.remove('hidden');
    mainAppContainer.classList.add('hidden');

    attachNavEvents(); // Attach listeners for role picker
    
    // --- FIX: Safety check for lucide ---
    if (window.lucide) {
      lucide.createIcons(); // Render role picker icons
    } else {
      console.warn("Lucide icons not loaded, skipping icon render for role picker.");
    }
    return;
  }

  // LOGGED IN AND HAS ROLE STATE
  // Hide login/role picker, show main app
  app.innerHTML = '';
  app.classList.add('hidden');
  mainAppContainer.classList.remove('hidden');
  
  // Initialize all the listeners for the STATIC UI
  initStaticUI(); 
  
  // --- FIX: Safety check for lucide ---
  if (window.lucide) {
    lucide.createIcons(); // Render all icons for the main app
  } else {
    console.warn("Lucide icons not loaded, skipping icon render for main app.");
  }
}


// Example auth helpers
async function login(email) {
  const { data, error } = await supabase.auth.signInWithOtp({ email });
  if (error) return alert(error.message);
  alert("Magic link sent. Check email 👍");
}

// This function is no longer used by static UI, but we'll keep it
async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  renderApp(); // This is the STATIC UI renderApp
}


// const { data: { user } } = await supabase.auth.getUser();

// self.addEventListener("fetch", (event) => {
//   event.respondWith(
//     caches.match(event.request).then((cachedResponse) => {
//       if (cachedResponse) return cachedResponse;

//       return fetch(event.request)
//         .then((networkResponse) => {
//           if (!networkResponse || networkResponse.status !== 200) {
//             return networkResponse;
//           }

//           const responseClone = networkResponse.clone();
//           caches.open(cacheName).then((cache) => {
//             cache.put(event.request, responseClone);
//           });

//           return networkResponse;
//         })
//         .catch(() => caches.match("/offline.html"));
//     })
//   );
// });




// Add a med to DB (or to mock list if offline)
async function addMed(med) {
  // If you use Supabase: insert into med_schedule table
   const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    med.id = Date.now();
    mockMedications.push(med);
    mockMedications.sort((a, b) => a.time.localeCompare(b.time));
    renderManageMedsList();
    return;
  }

  const payload = {
    user_id: user.id,
    ...med
  };

  const { error } = await supabase.from("med_schedule").insert(payload);
  if (error) {
    console.error("Failed to add med:", error);
    showToast("Failed to add med");
  } else {
    showToast("Medication added");
  }
}



async function getMeds() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return [];
  const { data, error } = await supabase
    .from("med_schedule")
    .select("*")
    .eq("user_id", user.id);
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}


function getCombinedSchedule() {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const upcomingMeds = mockMedications
    .filter(m => !m.taken)
    .map(m => ({
      ...m,
      type: 'med',
      title: `${m.name} (${m.dosage || ''})`,
      instruction: m.instruction || '',
      icon: 'pill'
    }));

  const upcomingSchedule = mockSchedule.map(s => ({
    ...s,
    type: s.type || 'event',
    title: s.title,
    instruction: s.title || '',
    icon: s.icon || 'calendar'
  }));

  const merged = [...upcomingMeds, ...upcomingSchedule];

  return merged
    .filter(item => item && item.time) // guard
    .filter(item => item.time >= currentTime)
    .sort((a, b) => a.time.localeCompare(b.time));
}




async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) {
    alert("Login failed: " + error.message);
  }
}


// Helper function to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function enableNotifications() {
  try {
    // Check if notifications are supported
    if (!("Notification" in window)) {
      showToast("❌ Notifications not supported on this device");
      return;
    }

    // Check if service worker is supported
    if (!("serviceWorker" in navigator)) {
      showToast("❌ Service Worker not supported");
      return;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== "granted") {
      showToast("❌ Notification permission denied. Please enable in browser settings.");
      return;
    }

    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push notifications
    try {
      // Convert VAPID key from base64 to Uint8Array
      const vapidPublicKey = "BGLwPjowyVIlRlAw9eKXKf4Rl7RzX_dkUslxYuyO8kBAxQhqsJRhVp442t9vaD_cpFyZwpS14rCQRqxuWoB3_tc";
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // Save subscription - for authenticated users, save to Supabase; for guests, save to localStorage
      if (currentUser && !currentUser.guest) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase.from("push_subscriptions").upsert({
            user_id: userData.user.id,
            subscription: subscription.toJSON()
          }, {
            onConflict: 'user_id'
          });
        }
      } else {
        // Guest user - save to localStorage
        localStorage.setItem('aasra_push_subscription', JSON.stringify(subscription.toJSON()));
      }

      showToast("✅ Notifications enabled successfully!");
      
      // Show a test notification
      setTimeout(() => {
        if (registration.showNotification) {
          registration.showNotification("Aasra Notifications Enabled", {
            body: "You'll receive medication reminders when you're using the app",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            vibrate: [200, 100, 200],
            tag: "notification-test"
          });
        }
      }, 1000);

      // NOTE: Automatic background medication reminders require a backend server
      // For now, reminders only work while the app is open
      // To get real background notifications, you would need to:
      // 1. Set up a backend server with a cron job
      // 2. Send push notifications via Web Push API from the server
      // 3. Store medication schedules and user subscriptions in the database
      
      // Only start reminders if the app is actively being used
      startMedicationReminders();
      
    } catch (subscribeError) {
      console.error("Push subscription error:", subscribeError);
      showToast("❌ Could not subscribe to notifications: " + subscribeError.message);
    }

  } catch (error) {
    console.error("Notification enable error:", error);
    showToast("❌ Error enabling notifications: " + error.message);
  }
}


// --- MEDICATION REMINDER SYSTEM ---
let medicationReminderInterval = null;

function startMedicationReminders() {
  // Clear any existing interval
  if (medicationReminderInterval) {
    clearInterval(medicationReminderInterval);
  }

  // Check for upcoming medications every minute
  medicationReminderInterval = setInterval(checkMedicationReminders, 60000);
  
  // Also check immediately
  checkMedicationReminders();
  
  console.log("Medication reminders started");
}

async function checkMedicationReminders() {
  // Check if notifications are enabled
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // Load medications from localStorage if guest user
  loadDataFromLocalStorage();
  
  // Check each medication
  for (const med of mockMedications) {
    if (!med.taken && med.time === currentTime) {
      // Send notification for this medication
      await sendMedicationNotification(med);
    }
  }
}

async function sendMedicationNotification(med) {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration && registration.showNotification) {
      await registration.showNotification("💊 Medication Reminder", {
        body: `Time to take ${med.name} ${med.dosage}\n${med.instruction}`,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        vibrate: [200, 100, 200, 100, 200],
        tag: `med-${med.id}`,
        requireInteraction: true,
        actions: [
          { action: "taken", title: "Mark as Taken" },
          { action: "snooze", title: "Remind in 10 min" }
        ]
      });
      
      console.log(`Sent notification for medication: ${med.name}`);
    }
  } catch (error) {
    console.error("Error sending medication notification:", error);
  }
}

// --- LOCALSTORAGE PERSISTENCE FOR GUEST USERS ---
function saveDataToLocalStorage() {
  if (currentUser?.guest) {
    try {
      localStorage.setItem('aasra_medications', JSON.stringify(mockMedications));
      localStorage.setItem('aasra_contacts', JSON.stringify(mockContacts));
      localStorage.setItem('aasra_schedule', JSON.stringify(mockSchedule));
      localStorage.setItem('aasra_vitals', JSON.stringify(mockVitals));
      localStorage.setItem('aasra_nearby', JSON.stringify(mockNearbyServices));
      localStorage.setItem('aasra_community', JSON.stringify(mockCommunityEvents));
      localStorage.setItem('aasra_language', currentLanguage);
      localStorage.setItem('aasra_view', currentView);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }
}

function loadDataFromLocalStorage() {
  if (currentUser?.guest) {
    try {
      const savedMeds = localStorage.getItem('aasra_medications');
      const savedContacts = localStorage.getItem('aasra_contacts');
      const savedSchedule = localStorage.getItem('aasra_schedule');
      const savedVitals = localStorage.getItem('aasra_vitals');
      const savedNearby = localStorage.getItem('aasra_nearby');
      const savedCommunity = localStorage.getItem('aasra_community');
      const savedLanguage = localStorage.getItem('aasra_language');
      const savedView = localStorage.getItem('aasra_view');
      
      if (savedMeds) mockMedications = JSON.parse(savedMeds);
      if (savedContacts) mockContacts = JSON.parse(savedContacts);
      if (savedSchedule) mockSchedule = JSON.parse(savedSchedule);
      if (savedVitals) mockVitals = JSON.parse(savedVitals);
      if (savedNearby) mockNearbyServices = JSON.parse(savedNearby);
      if (savedCommunity) mockCommunityEvents = JSON.parse(savedCommunity);
      if (savedLanguage) currentLanguage = savedLanguage;
      if (savedView) currentView = savedView;
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
  }
}


async function saveRole(role) {
  // For guest users, just set the role locally and re-render
  if (currentUser?.guest) {
      currentUser.role = role;
      saveDataToLocalStorage();
      renderUI();
      return;
  }

  // For real users, save to Supabase
  await supabase.from("profiles").upsert({
    id: currentUser.id,
    role
  });

  currentUser.role = role;
  renderUI();
}


function renderRolePicker() {
  // --- FIX: Removed onclick handlers, they are now in attachNavEvents ---
  return `
  <div class="p-6 flex flex-col justify-center items-center min-h-screen bg-gray-50">
    <div class="w-full max-w-sm">
        <div class="flex items-center justify-center text-5xl font-bold text-blue-600 mb-4">
          <i data-lucide="hand-heart" class="h-12 w-12 mr-3 text-blue-500"></i>
          <span>Aasra</span>
        </div>
        <h2 class="text-2xl font-bold mb-8 text-center text-gray-700">Who are you?</h2>

        <button id="chooseElder"
          class="w-full bg-blue-600 text-white p-6 rounded-2xl mb-6 text-2xl font-bold flex items-center justify-center transition-all duration-300 hover:bg-blue-700 active:scale-95">
          <i data-lucide="user" class="h-8 w-8 mr-4"></i>
          Elder
        </button>

        <button id="chooseCare"
          class="w-full bg-green-600 text-white p-6 rounded-2xl text-2xl font-bold flex items-center justify-center transition-all duration-300 hover:bg-green-700 active:scale-95">
          <i data-lucide="heart-pulse" class="h-8 w-8 mr-4"></i>
          Caregiver
        </button>
    </div>
  </div>
  `;
}
   

// These placeholder UI functions are no longer needed
// function getElderUI() { ... }
// function getCaregiverUI() { ... }


// ==================================================================
// ===== PART 2: STATIC UI LOGIC (IMPROVED) =====
// ==================================================================


        // --- STATE ---
        let currentView = 'elder'; // 'elder' or 'caregiver'
        // let currentPage = 'home'; // 'home', 'meds', 'dashboard', etc. (This is declared in Part 1)
        let currentLanguage = 'en'; // 'en', 'hi', 'mr'
        let showSOS = false;
        let sosCountdownTimer = null;
        let modalConfirmCallback = null; // Store confirmation action

        // --- MOCK DATA ---
        let mockMedications = [
            { id: 1, name: 'Metformin', dosage: '500mg', instruction: 'Take before breakfast', time: '08:00', taken: false },
            { id: 2, name: 'Lisinopril', dosage: '10mg', instruction: 'Take with food', time: '09:00', taken: true },
            { id: 3, name: 'Atorvastatin', dosage: '20mg', instruction: 'Take before bed', time: '21:00', taken: false },
        ];
        
        let mockVitals = [
            { id: 1, date: 'Nov 02', bp: '122/81', sugar: '98' },
            { id: 2, date: 'Nov 01', bp: '121/80', sugar: '96' },
            { id: 3, date: 'Oct 31', bp: '125/82', sugar: '105' },
        ];
        
        let mockContacts = [
            { id: 1, name: 'Anna (Daughter)', relation: 'Family', number: '123-456-7890', icon: 'users' },
            { id: 2, name: 'Dr. Patel (GP)', relation: 'Doctor', number: '234-567-8901', icon: 'heart-pulse' },
        ];
        
        let mockSchedule = [
            { id: 1, type: 'appointment', title: 'Dr. Patel Check-up', time: '11:30', icon: 'stethoscope' },
            { id: 2, type: 'event', title: 'Community Bingo', time: '16:00', icon: 'users' },
        ];
        
        let mockNearbyServices = [
            { id: 1, name: 'Apollo Pharmacy', distance: '0.5 km', icon: 'pill' },
            { id: 2, name: 'City Hospital', distance: '1.2 km', icon: 'building' },
        ];
        
        let mockCommunityEvents = [
            { id: 1, name: 'Morning Walk Club', time: 'Today at 7:00 AM', location: 'Local Park', icon: 'coffee' },
            { id: 2, name: 'Community Bingo', time: 'Today at 4:00 PM', location: 'Community Hall', icon: 'users' },
        ];

        // --- TRANSLATIONS ---
        const translations = {
            en: {
                demoAasra: "Demo (Aasra):", viewingAs: "You are viewing as", elder: "Elder", caregiver: "Caregiver", switchTo: "Switch to",
                welcome: "Welcome", sos: "SOS", getHelpNow: "Get Help Now", nextReminder: "Next Reminder", meds: "Meds", calls: "Calls", nearby: "Nearby", community: "Community", doctorOnCall: "Doctor on Call",
                yourMeds: "Your Medications", markAsTaken: "Mark as Taken", allDone: "All Done!", allDoneSub: "You've taken all your pills for now.", alreadyTaken: "Already Taken",
                yourContacts: "Your Contacts", nearbyServices: "Nearby Services", mapPlaceholder: "Map Placeholder (Your Location)",
                communityHub: "Community Hub", askForHelp: "Ask for Help", localEvents: "Local Events",
                docOnCall: "Doctor on Call", docOnCallSub: "Connect instantly with a certified doctor for a consultation.", callDoctorNow: "Call Doctor Now",
                sosWillBeSent: "SOS will be sent...", pressCancel: "Press CANCEL if this is a mistake.", cancel: "CANCEL",
                contactingHelp: "Contacting Help...", contactingHelpSub: "Calling emergency contacts and sending location.",
                helpOnTheWay: "Help is on the way!", helpOnTheWaySub: "Your Care Circle and Emergency Services have been notified.", ok: "OK",
                home: "Home", atAGlance: "At-a-Glance", vitals: "Vitals", schedule: "Schedule",
                noUpcomingMeds: "No upcoming medications today.",
                callDoctorTitle: "Call Doctor?",
                callDoctorText: "This will start a call with the on-call doctor. Are you sure?",
                call: "Call",
                cancel: "Cancel",
                manageMeds: "Manage Medications", medName: "Medication Name", dosage: "Dosage (e.g., 500mg)", time: "Time (24h format, e.g., 09:00)", instructions: "Instructions", addMed: "Add Medication",
                delete: "Delete", recentVitals: "Recent Vitals",
                todaysPlan: "Today's Plan", noUpcomingTasks: "No more tasks for today!",
                manageContacts: "Manage Contacts", contactName: "Contact Name", relation: "Relation (e.g., Family)", phone: "Phone Number", addContact: "Add Contact",
                manageSchedule: "Manage Schedule", appointment: "Appointment", event: "Event", title: "Title (e.g., Dr. Patel Check-up)", type: "Type", addEntry: "Add Entry",
                manageNearby: "Manage Nearby Places", placeName: "Place Name", distance: "Distance (e.g., 0.5 km)", addPlace: "Add Place",
                manageCommunity: "Manage Community", eventName: "Event Name", location: "Location", addEvent: "Add Event",
                // --- ADDED: Translations for settings ---
                settings: "Settings",
                enableNotifications: "Enable Notifications",
                enableNotificationsSub: "Click to allow push notifications for important alerts."
            },
            hi: {
                demoAasra: "डेमो (आसरा):", viewingAs: "आप के रूप में देख रहे हैं", elder: "बुज़ुर्ग", caregiver: "देखभाल करने वाला", switchTo: "में बदलें",
                welcome: "स्वागत है", sos: "SOS", getHelpNow: "अभी सहायता प्राप्त करें", nextReminder: "अगला रिमाइंडर", meds: "दवाएं", calls: "कॉल", nearby: "आस-पास", community: "समुदाय", doctorOnCall: "डॉक्टर ऑन कॉल",
                yourMeds: "आपकी दवाएं", markAsTaken: "ले लिया के रूप में चिह्नित करें", allDone: "सब हो गया!", allDoneSub: "आपने अभी के लिए अपनी सभी गोलियां ले ली हैं।", alreadyTaken: "पहले ही ले ली गई",
                yourContacts: "आपके संपर्क", nearbyServices: "आस-पास की सेवाएं", mapPlaceholder: "मानचित्र (आपका स्थान)",
                communityHub: "कम्युनिटी हब", askForHelp: "मदद के लिए पूछें", localEvents: "स्थानीय कार्यक्रम",
                docOnCall: "डॉक्टर ऑन कॉल", docOnCallSub: "परामर्श के लिए तुरंत एक प्रमाणित डॉक्टर से जुड़ें।", callDoctorNow: "डॉक्टर को अभी कॉल करें",
                sosWillBeSent: "SOS भेजा जाएगा...", pressCancel: "अगर यह गलती है तो CANCEL दबाएं।", cancel: "रद्द करें",
                contactingHelp: "मदद के लिए संपर्क किया जा रहा है...", contactingHelpSub: "आपातकालीन संपर्कों को कॉल करना और स्थान भेजना।",
                helpOnTheWay: "मदद रास्ते में है!", helpOnTheWaySub: "आपके केयर सर्कल और आपातकालीन सेवाओं को सूचित कर दिया गया है।", ok: "ठीक है",
                home: "होम", atAGlance: "एक नज़र में", vitals: "वाइटल्स", schedule: "शेड्यूल",
                noUpcomingMeds: "आज कोई आगामी दवाई नहीं है।",
                callDoctorTitle: "डॉक्टर को कॉल करें?", callDoctorText: "यह ऑन-कॉल डॉक्टर के साथ कॉल शुरू करेगा। क्या आप निश्चित हैं?",
                call: "कॉल करें", cancel: "रद्द करें",
                manageMeds: "दवाएं प्रबंधित करें", medName: "दवा का नाम", dosage: "खुराक (जैसे, 500mg)", time: "समय (24h, जैसे, 09:00)", instructions: "निर्देश", addMed: "दवा जोड़ें",
                delete: "हटाएं", recentVitals: "हाल के वाइटल्स",
                todaysPlan: "आज की योजना", noUpcomingTasks: "आज के लिए कोई और काम नहीं!",
                manageContacts: "संपर्क प्रबंधित करें", contactName: "संपर्क का नाम", relation: "रिश्ता (जैसे, परिवार)", phone: "फ़ोन नंबर", addContact: "संपर्क जोड़ें",
                manageSchedule: "शेड्यूल प्रबंधित करें", appointment: "अपॉइंटमेंट", event: "इवेंट", title: "शीर्षक (जैसे, डॉ पटेल चेक-अप)", type: "प्रकार", addEntry: "एंट्री जोड़ें",
                manageNearby: "आस-पास के स्थान प्रबंधित करें", placeName: "स्थान का नाम", distance: "दूरी (जैसे, 0.5 किमी)", addPlace: "स्थान जोड़ें",
                manageCommunity: "समुदाय प्रबंधित करें", eventName: "इवेंट का नाम", location: "जगह", addEvent: "इवेंट जोड़ें",
                // --- ADDED: Translations for settings ---
                settings: "सेटिंग्स",
                enableNotifications: "सूचनाएं सक्षम करें",
                enableNotificationsSub: "महत्वपूर्ण अलर्ट के लिए पुश सूचनाओं की अनुमति देने के लिए क्लिक करें।"
            },
            mr: {
                demoAasra: "डेमो (आसरा):", viewingAs: "तुम्ही म्हणून पाहत आहात", elder: "ज्येष्ठ", caregiver: "काळजीवाहू", switchTo: "मध्ये बदला",
                welcome: "स्वागत आहे", sos: "SOS", getHelpNow: "आता मदत मिळवा", nextReminder: "पुढील रिमाइंडर", meds: "औषधे", calls: "कॉल", nearby: "जवळपास", community: "समुदाय", doctorOnCall: "डॉक्टर ऑन कॉल",
                yourMeds: "तुमची औषधे", markAsTaken: "घेतले म्हणून चिन्हांकित करा", allDone: "सर्व झाले!", allDoneSub: "तुम्ही आत्तासाठी तुमच्या सर्व गोळ्या घेतल्या आहेत.", alreadyTaken: "आधीच घेतलेली",
                yourContacts: "तुमचे संपर्क", nearbyServices: "जवळपासच्या सेवा", mapPlaceholder: "नकाशा (तुमचे स्थान)",
                communityHub: "कम्युनिटी हब", askForHelp: "मदतीसाठी विचारा", localEvents: "स्थानिक कार्यक्रम",
                docOnCall: "डॉक्टर ऑन कॉल", docOnCallSub: "सल्लामसलत करण्यासाठी त्वरित प्रमाणित डॉक्टरशी संपर्क साधा.", callDoctorNow: "आता डॉक्टरला कॉल करा",
                sosWillBeSent: "SOS पाठवला जाईल...", pressCancel: "चूक झाल्यास CANCEL दाबा.", cancel: "रद्द करा",
                contactingHelp: "मदतीसाठी संपर्क साधत आहे...", contactingHelpSub: "इमर्जन्सी संपर्कांना कॉल करणे आणि स्थान पाठवणे.",
                helpOnTheWay: "मदत मार्गावर आहे!", helpOnTheWaySub: "तुमच्या केअर सर्कल आणि आपत्कालीन सेवांना सूचित केले गेले आहे.", ok: "ठीक आहे",
                home: "होम", atAGlance: "एका दृष्टिक्षेपात", vitals: "वायटल्स", schedule: "शेड्यूल",
                noUpcomingMeds: "आज कोणतीही आगामी औषधे नाहीत.",
                callDoctorTitle: "डॉक्टरला कॉल करायचे?", callDoctorText: "हे ऑन-कॉल डॉक्टरसोबत कॉल सुरू करेल. तुम्हाला खात्री आहे का?",
                call: "कॉल करा", cancel: "रद्द करा",
                manageMeds: "औषधे व्यवस्थापित करा", medName: "औषधाचे नाव", dosage: "डोस (उदा. 500mg)", time: "वेळ (24h, उदा. 09:00)", instructions: "सूचना", addMed: "औषध जोडा",
                delete: "हटवा", recentVitals: "अलीकडील Vitals",
                todaysPlan: "आजची योजना", noUpcomingTasks: "आजसाठी आणखी कार्ये नाहीत!",
                manageContacts: "संपर्क व्यवस्थापित करा", contactName: "संपर्काचे नाव", relation: "नाते (उदा. कुटुंब)", phone: "फोन नंबर", addContact: "संपर्क जोडा",
                manageSchedule: "शेड्यूल प्रबंधित करें", appointment: "अपॉइंटमेंट", event: "इव्हेंट", title: "शीर्षक (उदा. डॉ पटेल चेक-अप)", type: "प्रकार", addEntry: "एंट्री जोडा",
                manageNearby: "जवळपासची ठिकाणे व्यवस्थापित करा", placeName: "ठिकाणाचे नाव", distance: "अंतर (उदा. 0.5 किमी)", addPlace: "ठिकाण जोडा",
                manageCommunity: "समुदाय व्यवस्थापित करा", eventName: "इव्हेंटचे नाव", location: "ठिकाण", addEvent: "इव्हेंट जोडा",
                // --- ADDED: Translations for settings ---
                settings: "सेटिंग्ज",
                enableNotifications: "सूचना सक्षम करा",
                enableNotificationsSub: "महत्वाच्या सूचनांसाठी पुश नोटिफिकेशन्सना अनुमती देण्यासाठी क्लिक करा."
            }
        };

        // --- UTILITY FUNCTIONS ---
        function t(key) {
            return translations[currentLanguage][key] || translations['en'][key] || key;
        }

        function showToast(message) {
            const toastContainer = document.getElementById('toast-container');
            if (!toastContainer) return; // Guard clause
            const toastId = `toast-${Date.now()}`;
            const toast = document.createElement('div');
            toast.id = toastId;
            toast.className = 'toast bg-green-500 text-white py-3 px-6 rounded-lg shadow-lg font-medium';
            toast.innerText = message;
            
            toastContainer.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'slideOutDown 0.5s ease-in forwards';
                setTimeout(() => {
                    toast.remove();
                }, 500);
            }, 3000);
        }

        // --- RENDER FUNCTIONS (for Static UI) ---
        function renderApp() {
            // 1. Translate all elements
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if(el.closest('template') === null) {
                    el.innerText = t(key);
                }
            });

            // 2. Update View Toggle
            const viewToggleRole = document.getElementById('view-toggle-role');
            if (viewToggleRole) viewToggleRole.innerText = t(currentView);
            
            const viewToggleTarget = document.getElementById('view-toggle-target');
            if (viewToggleTarget) viewToggleTarget.innerText = t(currentView === 'elder' ? 'caregiver' : 'elder');

            // 3. Update Language Switcher UI
            ['en', 'hi', 'mr'].forEach(lang => {
                const btn = document.getElementById(`lang-${lang}`);
                if (btn) {
                    btn.className = `py-1 px-3 rounded-full text-sm font-medium transition-all duration-300 ${currentLanguage === lang ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`;
                }
            });

            // 4. Show/Hide Main Views
            const elderView = document.getElementById('elder-view-container');
            if (elderView) elderView.classList.toggle('hidden', currentView !== 'elder');
            
            const caregiverView = document.getElementById('caregiver-view-container');
            if (caregiverView) caregiverView.classList.toggle('hidden', currentView !== 'caregiver');

            // 5. Show/Hide Elder UI based on SOS
            const elderNav = document.getElementById('elder-bottom-nav-container');
            if (elderNav) elderNav.classList.toggle('hidden', currentView !== 'elder' || showSOS);
            
            const sosModal = document.getElementById('sos-modal-container');
            if (sosModal) sosModal.classList.toggle('hidden', !showSOS);

            if (showSOS) return; // Don't re-render pages if SOS is active

            // 6. Show/Hide correct page
            const elderPages = ['home', 'plan', 'meds', 'contacts', 'nearby', 'community', 'doctorOnCall'];
            // --- ADDED: 'manage_settings' to caregiver pages ---
            const caregiverPages = ['dashboard', 'manage_meds', 'manage_vitals', 'manage_contacts', 'manage_schedule', 'manage_nearby', 'manage_community', 'manage_settings'];
            
            function showPage(pageId) {
                const el = document.getElementById(pageId);
                if (el) {
                    el.classList.remove('hidden');
                    el.classList.add('fade-in');
                    setTimeout(() => el.classList.remove('fade-in'), 300);
                }
            }

            if (currentView === 'elder') {
                elderPages.forEach(page => {
                    const el = document.getElementById(`page-elder-${page === 'doctorOnCall' ? 'doctor' : page}`);
                    if (el) el.classList.add('hidden');
                });
                
                const pageId = `page-elder-${currentPage === 'doctorOnCall' ? 'doctor' : currentPage}`;
                showPage(pageId);
                
                renderElderBottomNav();
                
                // Render dynamic content for the current page
                if (currentPage === 'home') updateNextReminder();
                if (currentPage === 'plan') renderElderPlanPage();
                if (currentPage === 'meds') renderMedsPage();
                if (currentPage === 'contacts') renderContactsPage();
                if (currentPage === 'nearby') renderNearbyPage();
                if (currentPage === 'community') renderCommunityPage();

            } else {
                caregiverPages.forEach(page => {
                    const el = document.getElementById(`page-caregiver-${page}`);
                    if (el) el.classList.add('hidden');
                });
                
                const pageId = `page-caregiver-${currentPage}`;
                showPage(pageId);

                renderCaregiverNav();
                renderCaregiverPage(); // Render dynamic content
            }
        }

        // Render Elder Bottom Nav
        function renderElderBottomNav() {
            const navItems = [
                { name: t('home'), page: 'home', icon: 'home' },
                { name: t('plan'), page: 'plan', icon: 'calendar-check' },
                { name: t('meds'), page: 'meds', icon: 'pill' },
                { name: t('calls'), page: 'contacts', icon: 'phone-call' },
            ];
            const container = document.getElementById('elder-bottom-nav-container');
            if (!container) return; // Guard clause
            
            container.innerHTML = ''; // Clear old nav
            navItems.forEach(item => {
                container.innerHTML += `
                    <button data-page="${item.page}" class="nav-btn flex flex-col items-center justify-center p-4 w-1/4 transition-all duration-300 ${currentPage === item.page ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}">
                        <i data-lucide="${item.icon}" class="h-8 w-8"></i>
                        <span class="text-sm font-medium">${item.name}</span>
                    </button>
                `;
            });
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons(); // Re-create icons
            }
        }
        
        // Render Next Reminder on Home Page
        function updateNextReminder() {
            const combinedSchedule = getCombinedSchedule();
            const textElMobile = document.getElementById('next-reminder-text');
            const textElDesktop = document.getElementById('next-reminder-text-desktop');
            
            let reminderText = '';
            if (combinedSchedule.length > 0) {
                const nextTask = combinedSchedule[0];
                reminderText = `${nextTask.title} at ${nextTask.time}`;
            } else {
                reminderText = t('noUpcomingTasks');
            }
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }

        // Render Elder Meds Page
        function renderMedsPage() {
            const container = document.getElementById('meds-list-container');
            if (!container) return;
            container.innerHTML = '';
            const dueMeds = mockMedications.filter(m => !m.taken);
            const takenMeds = mockMedications.filter(m => m.taken);

            if (dueMeds.length > 0) {
                dueMeds.forEach(med => {
                    container.innerHTML += `
                        <div id="med-card-${med.id}" class="bg-white p-6 rounded-2xl shadow-md border-4 border-blue-500 transition-all duration-300 hover:shadow-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h2 class="text-3xl font-bold">${med.name} <span class="text-2xl font-normal text-gray-600">(${med.dosage})</span></h2>
                                    <p class="text-2xl text-gray-600">${med.instruction}</p>
                                    <p class="text-2xl font-semibold text-gray-800">Due: ${med.time}</p>
                                </div>
                                <i data-lucide="pill" class="h-12 w-12 text-blue-500"></i>
                            </div>
                            <button data-id="${med.id}" class="mark-as-taken-btn mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-4 text-2xl font-bold flex items-center justify-center transition-all duration-300 active:scale-95">
                                <i data-lucide="check-circle" class="h-7 w-7 mr-2"></i>
                                ${t('markAsTaken')}
                            </button>
                        </div>
                    `;
                });
            } else { 
                container.innerHTML = `
                    <div class="bg-green-100 p-6 rounded-2xl shadow-md border-4 border-green-500 flex flex-col items-center">
                        <i data-lucide="check-circle" class="h-16 w-16 text-green-600 mb-4"></i>
                        <h2 class="text-3xl font-bold text-green-800">${t('allDone')}</h2>
                        <p class="text-2xl text-green-700">${t('allDoneSub')}</p>
                    </div>
                `;
            }

            if (takenMeds.length > 0) {
                container.innerHTML += `<h3 class="text-2xl font-semibold text-gray-700 pt-8 mt-8 border-t">${t('alreadyTaken')}</h3>`;
                takenMeds.forEach(med => {
                    container.innerHTML += `
                        <div class="bg-white p-6 rounded-2xl shadow-sm border-4 border-gray-300 opacity-70">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h2 class="text-3xl font-bold text-gray-600 line-through">${med.name} <span class="text-2xl font-normal">(${med.dosage})</span></h2>
                                    <p class="text-2xl text-gray-500">${med.instruction}</p>
                                </div>
                                <i data-lucide="check-circle" class="h-12 w-12 text-green-500"></i>
                            </div>
                        </div>
                    `;
                });
            }
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }
        
        // Render Elder Plan Page (Today's Plan)
        function renderElderPlanPage() {
            const container = document.getElementById('plan-list-container');
            if (!container) return;
            container.innerHTML = '';
            
            const combinedSchedule = getCombinedSchedule();
            
            if (combinedSchedule.length === 0) {
                container.innerHTML = `
                    <div class="bg-green-100 p-6 rounded-2xl shadow-md border-4 border-green-500 flex flex-col items-center">
                        <i data-lucide="check-circle" class="h-16 w-16 text-green-600 mb-4"></i>
                        <h2 class="text-3xl font-bold text-green-800">${t('allDone')}</h2>
                        <p class="text-2xl text-green-700">${t('noUpcomingTasks')}</p>
                    </div>
                `;
            } else {
                combinedSchedule.forEach(item => {
                    const iconColor = item.type === 'med' ? 'blue' : item.type === 'appointment' ? 'indigo' : 'orange';
                    container.innerHTML += `
                        <div class="bg-white p-6 rounded-2xl shadow-md border-4 border-${iconColor}-500 transition-all duration-300 hover:shadow-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h2 class="text-3xl font-bold">${item.title}</h2>
                                    <p class="text-2xl text-gray-600">${item.instruction || ''}</p>
                                    <p class="text-2xl font-semibold text-gray-800">Time: ${item.time}</p>
                                </div>
                                <i data-lucide="${item.icon}" class="h-12 w-12 text-${iconColor}-500"></i>
                            </div>
                            ${item.type === 'med' && !item.taken ? `
                                <button data-id="${item.id}" class="mark-as-taken-btn mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-4 text-2xl font-bold flex items-center justify-center transition-all duration-300 active:scale-95">
                                    <i data-lucide="check-circle" class="h-7 w-7 mr-2"></i>
                                    ${t('markAsTaken')}
                                </button>
                            ` : ''}
                        </div>
                    `;
                });
            }
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }
        
        // Render Elder Contacts Page (Dynamic)
        function renderContactsPage() {
            const container = document.getElementById('contacts-list-container');
            if (!container) return;
            container.innerHTML = ''; // Clear old list
            mockContacts.forEach(contact => {
                container.innerHTML += `
                    <a href="tel:${contact.number}" class="bg-white p-6 rounded-2xl shadow-md flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:scale-[1.03] active:scale-100">
                        <div class="flex items-center">
                            <i data-lucide="${contact.icon}" class="h-12 w-12 text-blue-500 mr-6"></i>
                            <div>
                                <h2 class="text-3xl font-bold">${contact.name}</h2>
                                <p class="text-2xl text-gray-600">${contact.relation}</p>
                            </div>
                        </div>
                        <i data-lucide="phone" class="h-12 w-12 text-green-500"></i>
                    </a>
                `;
            });
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }

        // Render Elder Nearby Page (Dynamic)
        function renderNearbyPage() {
            const container = document.getElementById('nearby-list-container');
            if (!container) return;
            container.innerHTML = '';
            mockNearbyServices.forEach(service => {
                container.innerHTML += `
                    <div class="bg-white p-6 rounded-2xl shadow-md flex items-center justify-between transition-all duration-300 hover:shadow-lg">
                        <div class="flex items-center">
                            <i data-lucide="${service.icon}" class="h-12 w-12 text-purple-500 mr-6"></i>
                            <div>
                                <h2 class="text-3xl font-bold">${service.name}</h2>
                                <p class="text-2xl text-gray-600">${service.distance}</p>
                            </div>
                        </div>
                        <button class="text-blue-500 hover:text-blue-700">
                            <i data-lucide="navigation" class="h-10 w-10"></i>
                        </button>
                    </div>
                `;
            });
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }

        // Render Elder Community Page (Dynamic)
        function renderCommunityPage() {
            const container = document.getElementById('community-events-container');
            if (!container) return;
            container.innerHTML = '';
            mockCommunityEvents.forEach(event => {
                container.innerHTML += `
                    <div class="bg-white p-6 rounded-2xl shadow-md flex items-center transition-all duration-300 hover:shadow-lg">
                        <i data-lucide="${event.icon}" class="h-12 w-12 text-orange-500 mr-6"></i>
                        <div>
                            <h2 class="text-3xl font-bold">${event.name}</h2>
                            <p class="text-2xl text-gray-600">${event.time}</p>
                            <p class="text-xl text-gray-500">${event.location}</p>
                        </div>
                    </div>
                `;
            });
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }
        
        // --- Caregiver Render Functions (ALL FEATURES ADDED) ---
        function renderCaregiverNav() {
            const navItems = [
                { name: t('atAGlance'), page: 'dashboard', icon: 'layout-dashboard' },
                { name: t('manageMeds'), page: 'manage_meds', icon: 'pill' },
                { name: t('vitals'), page: 'manage_vitals', icon: 'line-chart' },
                { name: t('manageContacts'), page: 'manage_contacts', icon: 'users' },
                { name: t('manageSchedule'), page: 'manage_schedule', icon: 'calendar-days' },
                { name: t('manageNearby'), page: 'manage_nearby', icon: 'map-pin' },
                { name: t('manageCommunity'), page: 'manage_community', icon: 'coffee' },
                // --- ADDED: Settings nav item ---
                { name: t('settings'), page: 'manage_settings', icon: 'settings' },
            ];
            const container = document.getElementById('caregiver-nav-list');
            if (!container) return;
            container.innerHTML = '';
            navItems.forEach(item => {
                container.innerHTML += `
                    <li>
                        <button data-page="${item.page}" class="nav-btn w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${currentPage === item.page ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}">
                            <i data-lucide="${item.icon}" class="h-5 w-5"></i>
                            <span>${item.name}</span>
                        </button>
                    </li>
                `;
            });
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }
        
        function renderCaregiverPage() {
            const renderers = {
                'dashboard': renderCaregiverDashboard,
                'manage_meds': renderCaregiverManageMeds,
                'manage_vitals': renderCaregiverManageVitals,
                'manage_contacts': renderCaregiverManageContacts,
                'manage_schedule': renderCaregiverManageSchedule,
                'manage_nearby': renderCaregiverManageNearby,
                'manage_community': renderCaregiverManageCommunity,
                // --- ADDED: Settings page renderer ---
                'manage_settings': renderCaregiverManageSettings,
            };
            
            const renderer = renderers[currentPage];
            if (renderer) {
                renderer();
            } else {
                // Fallback for any page not yet implemented
                const container = document.getElementById(`page-caregiver-${currentPage}`);
                if (container) {
                    const pageTitle = (currentPage.split('_').pop() || 'Page');
                    container.innerHTML = `<div class="bg-white p-6 rounded-2xl shadow-lg"><h2 class="text-xl font-semibold mb-4">Manage ${pageTitle}</h2><p>This is a placeholder for the "${pageTitle}" management page.</p></div>`;
                }
            }
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }
        
        // Placeholder for Dashboard
        function renderCaregiverDashboard() {
            const container = document.getElementById('page-caregiver-dashboard');
            if (!container) return;
            container.innerHTML = `
                <div class="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('atAGlance')}</h2>
                    <p class="text-gray-600">This is the caregiver dashboard. Content to be built.</p>
                </div>`;
        }
        
        function renderCaregiverManageMeds() {
            const container = document.getElementById('page-caregiver-manage_meds');
            if (!container) return;
            container.innerHTML = `
                <div class="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('manageMeds')}</h2>
                    <form id="form-add-med" class="mb-8 p-6 border rounded-lg bg-gray-50 space-y-4">
                        <h3 class="text-xl font-semibold mb-4">${t('addMed')}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" id="new-med-name" placeholder="${t('medName')}" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <input type="text" id="new-med-dosage" placeholder="${t('dosage')}" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <input type="time" id="new-med-time" placeholder="${t('time')}" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <input type="text" id="new-med-instruction" placeholder="${t('instructions')}" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-5 rounded-lg font-medium transition-all duration-300 active:scale-95">${t('addMed')}</button>
                    </form>
                    <h3 class="text-xl font-semibold mb-4">Current Medications</h3>
                    <div id="manage-meds-list" class="space-y-4"></div>
                </div>`;
            renderManageMedsList();
        }
        
        function renderManageMedsList() {
            const listContainer = document.getElementById('manage-meds-list');
            if (!listContainer) return;
            listContainer.innerHTML = '';
            mockMedications.forEach(med => {
                listContainer.innerHTML += `
                    <div class="flex items-center justify-between p-4 bg-white border rounded-lg">
                        <div>
                            <p class="font-bold text-lg">${med.name} <span class="text-base font-normal text-gray-600">(${med.dosage || 'N/A'})</span></p>
                            <p class="text-sm text-gray-500">${med.instruction} @ ${med.time}</p>
                        </div>
                        <button data-id="${med.id}" class="btn-delete-med text-red-500 hover:text-red-700 transition-all duration-300 p-2">
                            <i data-lucide="trash-2" class="h-5 w-5"></i>
                        </button>
                    </div>`;
            });
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }

        // --- ADDED: New render function for the Settings page ---
        function renderCaregiverManageSettings() {
            const container = document.getElementById('page-caregiver-manage_settings');
            if (!container) return;
            container.innerHTML = `
                <div class="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('settings')}</h2>
                    
                    <div class="p-4 border rounded-lg bg-gray-50">
                        <h3 class="text-lg font-semibold">${t('enableNotifications')}</h3>
                        <p class="text-gray-600 mb-4">${t('enableNotificationsSub')}</p>
                        <button id="btn-enable-notifications" class="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white py-3 px-5 rounded-lg font-medium transition-all duration-300 active:scale-95 flex items-center justify-center">
                            <i data-lucide="bell-ring" class="h-5 w-5 mr-2"></i>
                            <span>${t('enableNotifications')}</span>
                        </button>
                    </div>

                </div>`;
            
            if (window.lucide) {
                lucide.createIcons();
            }
        }

        // Placeholder for Vitals
        function renderCaregiverManageVitals() {
            const container = document.getElementById('page-caregiver-manage_vitals');
            if (!container) return;
            container.innerHTML = `
                <div class="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('vitals')}</h2>
                    <p class="text-gray-600">Vitals management UI to be built.</p>
                    <div id="manage-vitals-list" class="space-y-4 mt-4"></div>
                </div>`;
            renderManageVitalsList();
        }

        function renderManageVitalsList() {
             const listContainer = document.getElementById('manage-vitals-list');
            if (!listContainer) return;
            listContainer.innerHTML = '';
            mockVitals.forEach(vital => {
                listContainer.innerHTML += `
                    <div class="flex items-center justify-between p-4 bg-white border rounded-lg">
                        <div>
                            <p class="font-bold text-lg">${vital.date}</p>
                            <p class="text-sm text-gray-500">BP: ${vital.bp} | Sugar: ${vital.sugar}</p>
                        </div>
                        <button data-id="${vital.id}" class="btn-delete-vital text-red-500 hover:text-red-700 transition-all duration-300 p-2">
                            <i data-lucide="trash-2" class="h-5 w-5"></i>
                        </button>
                    </div>`;
            });
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }
        
        function renderCaregiverManageContacts() {
            const container = document.getElementById('page-caregiver-manage_contacts');
            if (!container) return;
            container.innerHTML = `
                <div class="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('manageContacts')}</h2>
                    <form id="form-add-contact" class="mb-8 p-6 border rounded-lg bg-gray-50 space-y-4">
                        <h3 class="text-xl font-semibold mb-4">${t('addContact')}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" id="new-contact-name" placeholder="${t('contactName')}" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <input type="text" id="new-contact-relation" placeholder="${t('relation')}" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <input type="tel" id="new-contact-number" placeholder="${t('phone')}" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <input type="text" id="new-contact-icon" placeholder="Icon (e.g., users)" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-5 rounded-lg font-medium transition-all duration-300 active:scale-95">${t('addContact')}</button>
                    </form>
                    <h3 class="text-xl font-semibold mb-4">Current Contacts</h3>
                    <div id="manage-contacts-list" class="space-y-4"></div>
                </div>`;
            renderManageContactsList();
        }
        
        function renderManageContactsList() {
            const listContainer = document.getElementById('manage-contacts-list');
            if (!listContainer) return;
            listContainer.innerHTML = '';
            mockContacts.forEach(contact => {
                listContainer.innerHTML += `
                    <div class="flex items-center justify-between p-4 bg-white border rounded-lg">
                        <div class="flex items-center">
                            <i data-lucide="${contact.icon || 'user'}" class="h-8 w-8 text-blue-500 mr-4"></i>
                            <div>
                                <p class="font-bold text-lg">${contact.name}</p>
                                <p class="text-sm text-gray-500">${contact.relation} | ${contact.number}</p>
                            </div>
                        </div>
                        <button data-id="${contact.id}" class="btn-delete-contact text-red-500 hover:text-red-700 transition-all duration-300 p-2">
                            <i data-lucide="trash-2" class="h-5 w-5"></i>
                        </button>
                    </div>`;
            });
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }
        
        function renderCaregiverManageSchedule() {
            const container = document.getElementById('page-caregiver-manage_schedule');
            if (!container) return;
            container.innerHTML = `
                <div class="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('manageSchedule')}</h2>
                    <form id="form-add-schedule" class="mb-8 p-6 border rounded-lg bg-gray-50 space-y-4">
                        <h3 class="text-xl font-semibold mb-4">${t('addEntry')}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" id="new-schedule-title" placeholder="${t('title')}" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <input type="time" id="new-schedule-time" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <select id="new-schedule-type" class="p-3 border rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="appointment">${t('appointment')}</option>
                                <option value="event">${t('event')}</option>
                            </select>
                        </div>
                        <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-5 rounded-lg font-medium transition-all duration-300 active:scale-95">${t('addEntry')}</button>
                    </form>
                    <h3 class="text-xl font-semibold mb-4">Current Schedule</h3>
                    <div id="manage-schedule-list" class="space-y-4"></div>
                </div>`;
            renderManageScheduleList();
        }

        function renderManageScheduleList() {
            const listContainer = document.getElementById('manage-schedule-list');
            if (!listContainer) return;
            listContainer.innerHTML = '';
            mockSchedule.forEach(item => {
                const icon = item.type === 'appointment' ? 'stethoscope' : 'users';
                listContainer.innerHTML += `
                    <div class="flex items-center justify-between p-4 bg-white border rounded-lg">
                        <div class="flex items-center">
                            <i data-lucide="${icon}" class="h-8 w-8 text-indigo-500 mr-4"></i>
                            <div>
                                <p class="font-bold text-lg">${item.title}</p>
                                <p class="text-sm text-gray-500">${t(item.type)} at ${item.time}</p>
                            </div>
                        </div>
                        <button data-id="${item.id}" class="btn-delete-schedule text-red-500 hover:text-red-700 transition-all duration-300 p-2">
                            <i data-lucide="trash-2" class="h-5 w-5"></i>
                        </button>
                    </div>`;
            });
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }
        
        function renderCaregiverManageNearby() {
            const container = document.getElementById('page-caregiver-manage_nearby');
            if (!container) return;
            container.innerHTML = `
                <div class="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('manageNearby')}</h2>
                    <form id="form-add-nearby" class="mb-8 p-6 border rounded-lg bg-gray-50 space-y-4">
                        <h3 class="text-xl font-semibold mb-4">${t('addPlace')}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" id="new-nearby-name" placeholder="${t('placeName')}" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <input type="text" id="new-nearby-distance" placeholder="${t('distance')}" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <input type="text" id="new-nearby-icon" placeholder="Icon (e.g., pill)" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="map-pin">
                        </div>
                        <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-5 rounded-lg font-medium transition-all duration-300 active:scale-95">${t('addPlace')}</button>
                    </form>
                    <h3 class="text-xl font-semibold mb-4">Current Places</h3>
                    <div id="manage-nearby-list" class="space-y-4"></div>
                </div>`;
            renderManageNearbyList();
        }

        function renderManageNearbyList() {
            const listContainer = document.getElementById('manage-nearby-list');
            if (!listContainer) return;
            listContainer.innerHTML = '';
            mockNearbyServices.forEach(item => {
                listContainer.innerHTML += `
                    <div class="flex items-center justify-between p-4 bg-white border rounded-lg">
                        <div class="flex items-center">
                            <i data-lucide="${item.icon || 'map-pin'}" class="h-8 w-8 text-purple-500 mr-4"></i>
                            <div>
                                <p class="font-bold text-lg">${item.name}</p>
                                <p class="text-sm text-gray-500">${item.distance}</p>
                            </div>
                        </div>
                        <button data-id="${item.id}" class="btn-delete-nearby text-red-500 hover:text-red-700 transition-all duration-300 p-2">
                            <i data-lucide="trash-2" class="h-5 w-5"></i>
                        </button>
                    </div>`;
            });
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }
        
        function renderCaregiverManageCommunity() {
            const container = document.getElementById('page-caregiver-manage_community');
            if (!container) return;
            container.innerHTML = `
                <div class="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('manageCommunity')}</h2>
                    <form id="form-add-community" class="mb-8 p-6 border rounded-lg bg-gray-50 space-y-4">
                        <h3 class="text-xl font-semibold mb-4">${t('addEvent')}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" id="new-community-name" placeholder="${t('eventName')}" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <input type="text" id="new-community-time" placeholder="${t('time')}" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            <input type="text" id="new-community-location" placeholder="${t('location')}" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <input type="text" id="new-community-icon" placeholder="Icon (e.g., coffee)" class="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="users">
                        </div>
                        <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-5 rounded-lg font-medium transition-all duration-300 active:scale-95">${t('addEvent')}</button>
                    </form>
                    <h3 class="text-xl font-semibold mb-4">Current Events</h3>
                    <div id="manage-community-list" class="space-y-4"></div>
                </div>`;
            renderManageCommunityList();
        }
        
        function renderManageCommunityList() {
            const listContainer = document.getElementById('manage-community-list');
            if (!listContainer) return;
            listContainer.innerHTML = '';
            mockCommunityEvents.forEach(item => {
                listContainer.innerHTML += `
                    <div class="flex items-center justify-between p-4 bg-white border rounded-lg">
                        <div class="flex items-center">
                            <i data-lucide="${item.icon || 'users'}" class="h-8 w-8 text-orange-500 mr-4"></i>
                            <div>
                                <p class="font-bold text-lg">${item.name}</p>
                                <p class="text-sm text-gray-500">${item.time} | ${item.location}</p>
                            </div>
                        </div>
                        <button data-id="${item.id}" class="btn-delete-community text-red-500 hover:text-red-700 transition-all duration-300 p-2">
                            <i data-lucide="trash-2" class="h-5 w-5"></i>
                        </button>
                    </div>`;
            });
            
            // --- FIX: Safety check for lucide ---
            if (window.lucide) {
              lucide.createIcons();
            }
        }


        // --- STATE HANDLERS ---
        function setLanguage(lang) {
            currentLanguage = lang;
            renderApp();
        }

        function toggleView() {
            if (currentView === 'elder') {
                currentView = 'caregiver';
                currentPage = 'dashboard';
            } else {
                currentView = 'elder';
                currentPage = 'home';
            }
            renderApp();
        }

        function navigate(page) {
            if (showSOS) return;
            currentPage = page;
            window.scrollTo(0, 0); // Scroll to top on page change
            renderApp();
        }

        function handleTakeMed(id) {
            const medCard = document.getElementById(`med-card-${id}`);
            if (medCard) {
                medCard.classList.add('slide-out');
                setTimeout(() => {
                    const med = mockMedications.find(m => m.id === id);
                    if (med) med.taken = true;
                    saveDataToLocalStorage(); // Save to localStorage for guest users
                    renderMedsPage();
                    updateNextReminder();
                    showToast(t('meds') + ' ' + t('markAsTaken'));
                }, 500);
            }
        }

        function openSOS() {
            showSOS = true;
            renderApp();
            
            // Start countdown logic
            let count = 10;
            const timerEl = document.getElementById('sos-countdown-timer');
            const countdownEl = document.getElementById('sos-status-countdown');
            const sendingEl = document.getElementById('sos-status-sending');
            const sentEl = document.getElementById('sos-status-sent');

            if (!timerEl || !countdownEl || !sendingEl || !sentEl) return;

            countdownEl.classList.remove('hidden');
            sendingEl.classList.add('hidden');
            sentEl.classList.add('hidden');
            
            timerEl.innerText = count;
            
            sosCountdownTimer = setInterval(() => {
                count--;
                timerEl.innerText = count;
                if (count === 0) {
                    clearInterval(sosCountdownTimer);
                    // Trigger "Sending" state
                    countdownEl.classList.add('hidden');
                    sendingEl.classList.remove('hidden');
                    
                    // Simulate network request
                    setTimeout(() => {
                        // Trigger "Sent" state
                        sendingEl.classList.add('hidden');
                        sentEl.classList.remove('hidden');
                    }, 2000);
                }
            }, 1000);
        }

        function closeSOS(cancelled = false) {
            if (sosCountdownTimer) {
                clearInterval(sosCountdownTimer);
                sosCountdownTimer = null;
            }
            showSOS = false;
            renderApp();
            if (cancelled) {
                showToast("SOS Cancelled");
            }
        }
        
        function openModal({ title, text, confirmText, onConfirm }) {
            const modal = document.getElementById('confirmation-modal');
            if (!modal) return;
            
            document.getElementById('modal-title').innerText = title;
            document.getElementById('modal-text').innerText = text;
            document.getElementById('modal-btn-confirm').innerText = confirmText || t('call');
            
            modalConfirmCallback = onConfirm;
            
            modal.classList.remove('hidden');
        }

        function closeModal() {
            const modal = document.getElementById('confirmation-modal');
            if (modal) modal.classList.add('hidden');
            modalConfirmCallback = null;
        }

        // --- Caregiver Form Handlers ---
        function handleAddMed(e) {
            e.preventDefault();
            const newMed = {
                id: Date.now(),
                name: document.getElementById('new-med-name').value,
                dosage: document.getElementById('new-med-dosage').value,
                time: document.getElementById('new-med-time').value,
                instruction: document.getElementById('new-med-instruction').value,
                taken: false
            };
            mockMedications.push(newMed);
            mockMedications.sort((a, b) => a.time.localeCompare(b.time));
            saveDataToLocalStorage(); // Save to localStorage for guest users
            renderManageMedsList();
            e.target.reset();
            showToast(t('meds') + ' Added');
        }

        function handleDeleteMed(id) {
            mockMedications = mockMedications.filter(med => med.id !== id);
            saveDataToLocalStorage(); // Save to localStorage for guest users
            renderManageMedsList();
        }
        
        function handleDeleteVital(id) {
            mockVitals = mockVitals.filter(v => v.id !== id);
            saveDataToLocalStorage(); // Save to localStorage for guest users
            renderManageVitalsList();
        }
        
        function handleAddContact(e) {
            e.preventDefault();
            const newContact = {
                id: Date.now(),
                name: document.getElementById('new-contact-name').value,
                relation: document.getElementById('new-contact-relation').value,
                number: document.getElementById('new-contact-number').value,
                icon: document.getElementById('new-contact-icon').value || 'user'
            };
            mockContacts.push(newContact);
            saveDataToLocalStorage(); // Save to localStorage for guest users
            renderManageContactsList();
            e.target.reset();
            showToast(t('addContact') + 'd');
        }

        function handleDeleteContact(id) {
            mockContacts = mockContacts.filter(c => c.id !== id);
            saveDataToLocalStorage(); // Save to localStorage for guest users
            renderManageContactsList();
        }
        
        function handleAddSchedule(e) {
            e.preventDefault();
            const newEntry = {
                id: Date.now(),
                title: document.getElementById('new-schedule-title').value,
                time: document.getElementById('new-schedule-time').value,
                type: document.getElementById('new-schedule-type').value,
                icon: document.getElementById('new-schedule-type').value === 'appointment' ? 'stethoscope' : 'users'
            };
            mockSchedule.push(newEntry);
            mockSchedule.sort((a, b) => a.time.localeCompare(b.time));
            saveDataToLocalStorage(); // Save to localStorage for guest users
            renderManageScheduleList();
            e.target.reset();
            showToast(t('addEntry') + 'd');
        }

        function handleDeleteSchedule(id) {
            mockSchedule = mockSchedule.filter(s => s.id !== id);
            saveDataToLocalStorage(); // Save to localStorage for guest users
            renderManageScheduleList();
        }
        
        function handleAddNearby(e) {
            e.preventDefault();
            const newNearby = {
                id: Date.now(),
                name: document.getElementById('new-nearby-name').value,
                distance: document.getElementById('new-nearby-distance').value,
                icon: document.getElementById('new-nearby-icon').value || 'map-pin'
            };
            mockNearbyServices.push(newNearby);
            saveDataToLocalStorage(); // Save to localStorage for guest users
            renderManageNearbyList();
            e.target.reset();
            showToast(t('addPlace') + 'd');
        }
        
        function handleDeleteNearby(id) {
            mockNearbyServices = mockNearbyServices.filter(s => s.id !== id);
            saveDataToLocalStorage(); // Save to localStorage for guest users
            renderManageNearbyList();
        }
        
        function handleAddCommunity(e) {
            e.preventDefault();
            const newEvent = {
                id: Date.now(),
                name: document.getElementById('new-community-name').value,
                time: document.getElementById('new-community-time').value,
                location: document.getElementById('new-community-location').value,
                icon: document.getElementById('new-community-icon').value || 'users'
            };
            mockCommunityEvents.push(newEvent);
            saveDataToLocalStorage(); // Save to localStorage for guest users
            renderManageCommunityList();
            e.target.reset();
            showToast(t('addEvent') + 'd');
        }
        
        function handleDeleteCommunity(id) {
            mockCommunityEvents = mockCommunityEvents.filter(e => e.id !== id);
            saveDataToLocalStorage(); // Save to localStorage for guest users
            renderManageCommunityList();
        }
        
        // --- EVENT LISTENERS (for Static UI) ---
        // This function is called by renderUI() AFTER login is successful
        function initStaticUI() {
            // This flag prevents listeners from being added multiple times
            if (window.staticUiInitialized) return;
            window.staticUiInitialized = true;
            
            console.log("Initializing Static UI Listeners...");
            
            // Load data from localStorage for guest users
            loadDataFromLocalStorage();
            
            // Start medication reminders if notifications are already enabled
            if ("Notification" in window && Notification.permission === "granted") {
                startMedicationReminders();
            }

            // NEW: Logout Button
            document.getElementById('logoutBtnStatic')?.addEventListener('click', async () => {
                await supabase.auth.signOut();
                currentUser = null;
                window.staticUiInitialized = false; // Reset flag
                window.location.reload(); // Easiest way to go back to login
            });
            
            // Language switchers
            document.getElementById('lang-en')?.addEventListener('click', () => setLanguage('en'));
            document.getElementById('lang-hi')?.addEventListener('click', () => setLanguage('hi'));
            document.getElementById('lang-mr')?.addEventListener('click', () => setLanguage('mr'));

            // View toggle
            document.getElementById('view-toggle-btn')?.addEventListener('click', toggleView);

            // SOS Buttons
            document.getElementById('btn-sos-open')?.addEventListener('click', openSOS);
            document.getElementById('btn-sos-cancel')?.addEventListener('click', () => closeSOS(true));
            document.getElementById('btn-sos-ok')?.addEventListener('click', () => closeSOS(false));

            // Modal Buttons
            document.getElementById('modal-btn-cancel')?.addEventListener('click', closeModal);
            document.getElementById('modal-btn-confirm')?.addEventListener('click', () => {
                if (modalConfirmCallback) modalConfirmCallback();
                closeModal();
            });
            
            // Elder - Doctor on Call Modal Button
            document.getElementById('btn-open-call-modal')?.addEventListener('click', () => {
                openModal({
                    title: t('callDoctorTitle'),
                    text: t('callDoctorText'),
                    confirmText: t('call'),
                    onConfirm: () => { 
                        console.log("Simulating call...");
                        showToast("Calling doctor...");
                    }
                });
            });

            // --- ADDED: Listener for the new Enable Notifications button ---
            document.getElementById('btn-enable-notifications')?.addEventListener('click', enableNotifications);

            // Navigation (Event Delegation)
            document.body.addEventListener('click', (e) => {
                const navButton = e.target.closest('.nav-btn');
                // Ensure we're not clicking the auth-logic nav buttons
                if (navButton && navButton.closest('#app') === null) {
                    navigate(navButton.dataset.page);
                }
            });
            
            // Dynamic Content Handlers (Event Delegation)
            document.body.addEventListener('click', (e) => {
                // Elder - Mark Med as Taken
                const takeButton = e.target.closest('.mark-as-taken-btn');
                if (takeButton) {
                    handleTakeMed(parseInt(takeButton.dataset.id));
                    return;
                }
                
                // Caregiver - Delete Buttons
                const deleteMedButton = e.target.closest('.btn-delete-med');
                if (deleteMedButton) {
                    handleDeleteMed(parseInt(deleteMedButton.dataset.id));
                    return;
                }
                const deleteVitalButton = e.target.closest('.btn-delete-vital');
                if (deleteVitalButton) {
                    handleDeleteVital(parseInt(deleteVitalButton.dataset.id));
                    return;
                }
                const deleteContactButton = e.target.closest('.btn-delete-contact');
                if (deleteContactButton) {
                    handleDeleteContact(parseInt(deleteContactButton.dataset.id));
                    return;
                }
                const deleteScheduleButton = e.target.closest('.btn-delete-schedule');
                if (deleteScheduleButton) {
                    handleDeleteSchedule(parseInt(deleteScheduleButton.dataset.id));
                    return;
                }
                const deleteNearbyButton = e.target.closest('.btn-delete-nearby');
                if (deleteNearbyButton) {
                    handleDeleteNearby(parseInt(deleteNearbyButton.dataset.id));
                    return;
                }
                const deleteCommunityButton = e.target.closest('.btn-delete-community');
                if (deleteCommunityButton) {
                    handleDeleteCommunity(parseInt(deleteCommunityButton.dataset.id));
                    return;
                }
            });
            
            // Caregiver Form Submissions
            document.body.addEventListener('submit', (e) => {
                if (e.target.id === 'form-add-med') handleAddMed(e);
                // if (e.target.id === 'form-add-vital') handleAddVital(e); // No add form for vitals yet
                if (e.target.id === 'form-add-contact') handleAddContact(e);
                if (e.target.id === 'form-add-schedule') handleAddSchedule(e);
                if (e.target.id === 'form-add-nearby') handleAddNearby(e);
                if (e.target.id === 'form-add-community') handleAddCommunity(e);
            });

            // Initial Render of the static UI
            renderApp();
        }
        
        // REMOVED the DOMContentLoaded listener for initStaticUI()
        // It is now called correctly by renderUI() after login.

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/service-worker.js")
                .catch(err => console.log("SW reg failed", err));
            
            // Listen for messages from service worker (e.g., notification actions)
            navigator.serviceWorker.addEventListener("message", (event) => {
                console.log("Message from service worker:", event.data);
                
                if (event.data.type === "MARK_MED_TAKEN") {
                    const medId = event.data.medId;
                    const med = mockMedications.find(m => m.id === medId);
                    if (med) {
                        med.taken = true;
                        saveDataToLocalStorage();
                        showToast(`✅ ${med.name} marked as taken`);
                        
                        // Re-render if we're on the meds page
                        if (currentPage === 'meds') {
                            renderApp();
                        }
                    }
                }
            });
        }


