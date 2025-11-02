import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://gzivkrzoitikwtrzmiah.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aXZrcnpvaXRpa3d0cnptaWFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAwNjA1NSwiZXhwIjoyMDc3NTgyMDU1fQ.x_Lg6UyKT6S38p5zkqIxf_vhM0bDTo0QyCNvcZSqDug";
const supabase = createClient(supabaseUrl, supabaseKey);



document.addEventListener("DOMContentLoaded", initApp);
        // --- Application init (wrap top-level awaits inside an async init) ---
async function initApp() {
  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user || null;

  if (!currentUser) {
    renderUI();
    return;
  }

  // fetch role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (!profile || !profile.role) {
    renderRolePicker();
    return;
  }

  currentUser.role = profile.role;
  renderUI();
}

initApp(); // start


function renderUI() {
  if (!currentUser) {
    app.innerHTML = getAuthPage();
    return;
  }

  if (!currentUser.role) {
    renderRolePicker();
    return;
  }

  if (currentUser.role === "elder") {
    app.innerHTML = getElderUI();
  } else {
    app.innerHTML = getCaregiverUI();
  }

  attachNavEvents();
}


// Example auth helpers
async function login(email) {
  const { data, error } = await supabase.auth.signInWithOtp({ email });
  if (error) return alert(error.message);
  alert("Magic link sent. Check email 👍");
}

async function logout() {
  await supabase.auth.signOut();
  window.currentUser = null;
  renderApp();
}


// const { data: { user } } = await supabase.auth.getUser();




// Add a med to DB (or to mock list if offline)
async function addMed(med) {
  // If you use Supabase: insert into med_schedule table
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    // fallback to local mock for demo
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
    // refresh UI - you may call getMeds() or update local state
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
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const upcomingMeds = mockMedications
    .filter(m => !m.taken)
    .map(m => ({
      ...m,
      type: 'med',
      title: `${m.name} (${m.dosage})`,
      instruction: m.instruction,
      icon: 'pill'
    }));

  const upcomingSchedule = mockSchedule.map(s => ({
    ...s,
    type: s.type || 'event',
    title: s.title,
    instruction: s.title,
    icon: s.icon || 'calendar'
  }));

  const merged = [...upcomingMeds, ...upcomingSchedule];

  return merged
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


async function enableNotifications() {
  const permission = await Notification.requestPermission();
  
  if (permission !== "granted") {
    alert("Notifications blocked. App can't alert you.");
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: "BGLwPjowyVIlRlAw9eKXKf4Rl7RzX_dkUslxYuyO8kBAxQhqsJRhVp442t9vaD_cpFyZwpS14rCQRqxuWoB3_tc"
  });

  await supabase.from("push_subscriptions").insert({
    user_id: (await supabase.auth.getUser()).data.user.id,
    subscription: subscription.toJSON()
  });

  alert("Notifications enabled ✅");
}


async function saveRole(role) {
  await supabase.from("profiles").upsert({
    id: currentUser.id,
    role
  });

  currentUser.role = role;
  renderUI();
}


    function renderRolePicker() {
  app.innerHTML = `
  <div class="p-6 flex flex-col justify-center min-h-screen">
    <h2 class="text-2xl font-bold mb-6">Who are you?</h2>

    <button id="chooseElder"
      class="bg-blue-600 text-white p-4 rounded-lg mb-4">Elder 👴</button>

    <button id="chooseCare"
      class="bg-green-600 text-white p-4 rounded-lg">Caregiver 👨‍⚕️</button>
  </div>
  `;

  document.getElementById("chooseElder").onclick = () => saveRole("elder");
  document.getElementById("chooseCare").onclick = () => saveRole("caregiver");
}
   


function getElderUI() {
  return `
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-3">Elder Dashboard 👴</h2>
    <p>Healthy & Safe mode.</p>

    <button data-page="sos" class="bg-red-600 text-white px-4 py-2 rounded mt-4">
      SOS Emergency
    </button>
  </div>
  `;
}

function getCaregiverUI() {
  return `
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-3">Caregiver Dashboard 👨‍⚕️</h2>
    <p>Monitor & support your elders here.</p>

    <button data-page="viewElders" class="bg-blue-600 text-white px-4 py-2 rounded mt-4">
      View Elders List
    </button>
  </div>
  `;
}



        // --- STATE ---
        let currentView = 'elder'; // 'elder' or 'caregiver'
        let currentPage = 'home'; // 'home', 'meds', 'dashboard', etc.
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
                manageCommunity: "Manage Community", eventName: "Event Name", location: "Location", addEvent: "Add Event"
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
                manageCommunity: "समुदाय प्रबंधित करें", eventName: "इवेंट का नाम", location: "जगह", addEvent: "इवेंट जोड़ें"
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
                manageSchedule: "शेड्यूल व्यवस्थापित करा", appointment: "अपॉइंटमेंट", event: "इव्हेंट", title: "शीर्षक (उदा. डॉ पटेल चेक-अप)", type: "प्रकार", addEntry: "एंट्री जोडा",
                manageNearby: "जवळपासची ठिकाणे व्यवस्थापित करा", placeName: "ठिकाणाचे नाव", distance: "अंतर (उदा. 0.5 किमी)", addPlace: "ठिकाण जोडा",
                manageCommunity: "समुदाय व्यवस्थापित करा", eventName: "इव्हेंटचे नाव", location: "ठिकाण", addEvent: "इव्हेंट जोडा"
            }
        };

        // --- UTILITY FUNCTIONS ---
        function t(key) {
            return translations[currentLanguage][key] || translations['en'][key] || key;
        }

        function showToast(message) {
            const toastContainer = document.getElementById('toast-container');
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

        // --- RENDER FUNCTIONS ---
        function renderApp() {
            // 1. Translate all elements
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if(el.closest('template') === null) {
                    el.innerText = t(key);
                }
            });

            // 2. Update View Toggle
            document.getElementById('view-toggle-role').innerText = t(currentView);
            document.getElementById('view-toggle-target').innerText = t(currentView === 'elder' ? 'caregiver' : 'elder');

            // 3. Update Language Switcher UI
            ['en', 'hi', 'mr'].forEach(lang => {
                const btn = document.getElementById(`lang-${lang}`);
                btn.className = `py-1 px-3 rounded-full text-sm font-medium transition-all duration-300 ${currentLanguage === lang ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`;
            });

            // 4. Show/Hide Main Views
            document.getElementById('elder-view-container').classList.toggle('hidden', currentView !== 'elder');
            document.getElementById('caregiver-view-container').classList.toggle('hidden', currentView !== 'caregiver');

            // 5. Show/Hide Elder UI based on SOS
            document.getElementById('elder-bottom-nav-container').classList.toggle('hidden', currentView !== 'elder' || showSOS);
            document.getElementById('sos-modal-container').classList.toggle('hidden', !showSOS);

            if (showSOS) return; // Don't re-render pages if SOS is active

            // 6. Show/Hide correct page
            const elderPages = ['home', 'plan', 'meds', 'contacts', 'nearby', 'community', 'doctorOnCall'];
            const caregiverPages = ['dashboard', 'manage_meds', 'manage_vitals', 'manage_contacts', 'manage_schedule', 'manage_nearby', 'manage_community'];
            
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
            container.innerHTML = ''; // Clear old nav
            navItems.forEach(item => {
                container.innerHTML += `
                    <button data-page="${item.page}" class="nav-btn flex flex-col items-center justify-center p-4 w-1/4 transition-all duration-300 ${currentPage === item.page ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}">
                        <i data-lucide="${item.icon}" class="h-8 w-8"></i>
                        <span class="text-sm font-medium">${item.name}</span>
                    </button>
                `;
            });
            lucide.createIcons(); // Re-create icons
        }
        
        // function getCombinedSchedule() {
        //     const now = new Date();
        //     const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
        //     const upcomingMeds = mockMedications
        //         .filter(m => !m.taken)
        //         .map(m => ({ ...m, type: 'med', title: `${m.name} (${m.dosage})`, instruction: m.instruction, icon: 'pill' }));
                
        //     const upcomingSchedule = mockSchedule
        //         .map(s => ({ ...s, time: s.time })); // Already in correct format
                
        //     return [...upcomingMeds, ...upcomingSchedule]
        //         .filter(item => item.time >= currentTime)
        //         .sort((a, b) => a.time.localeCompare(b.time));
        // }
        


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
            
            if(textElMobile) textElMobile.innerText = reminderText;
            if(textElDesktop) textElDesktop.innerText = reminderText;
        }
        
        // Render Elder Today's Plan Page (NEW)
        function renderElderPlanPage() {
            const container = document.getElementById('plan-list-container');
            container.innerHTML = ''; // Clear old list
            const combinedSchedule = getCombinedSchedule();
            
            if (combinedSchedule.length > 0) {
                combinedSchedule.forEach(item => {
                    const isMed = item.type === 'med';
                    container.innerHTML += `
                        <div class="bg-white p-6 rounded-2xl shadow-lg flex items-center transition-all duration-300 hover:shadow-xl ${isMed ? 'border-l-8 border-blue-500' : 'border-l-8 border-indigo-500'}">
                            <i data-lucide="${item.icon}" class="h-12 w-12 ${isMed ? 'text-blue-500' : 'text-indigo-500'} mr-6"></i>
                            <div>
                                <p class="text-2xl font-semibold text-gray-800">${item.time}</p>
                                <h2 class="text-3xl font-bold">${item.title}</h2>
                                <p class="text-2xl text-gray-600">${item.instruction || (isMed ? 'Medication' : 'Event')}</p>
                            </div>
                        </div>
                    `;
                });
            } else {
                container.innerHTML += `
                    <div class="bg-green-100 p-6 rounded-2xl shadow-lg border-4 border-green-500 flex flex-col items-center">
                        <i data-lucide="check-circle" class="h-16 w-16 text-green-600 mb-4"></i>
                        <h2 class="text-3xl font-bold text-green-800">${t('allDone')}</h2>
                        <p class="text-2xl text-green-700">${t('noUpcomingTasks')}</p>
                    </div>
                `;
            }
            lucide.createIcons();
        }

        // Render Elder Meds Page
        function renderMedsPage() {
            const container = document.getElementById('meds-list-container');
            container.innerHTML = '';
            const dueMeds = mockMedications.filter(m => !m.taken);
            const takenMeds = mockMedications.filter(m => m.taken);

            if (dueMeds.length > 0) {
                dueMeds.forEach(med => {
                    container.innerHTML += `
                        <div id="med-card-${med.id}" class="bg-white p-6 rounded-2xl shadow-lg border-4 border-blue-500 transition-all duration-300 hover:shadow-xl">
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
            } else { /* ... all done card ... */ }

            container.innerHTML += `<h3 class="text-2xl font-semibold pt-6">${t('alreadyTaken')}</h3>`;
            takenMeds.forEach(med => { /* ... taken med card ... */ });
            lucide.createIcons();
        }
        
        // Render Elder Contacts Page (Dynamic)
        function renderContactsPage() {
            const container = document.getElementById('contacts-list-container');
            container.innerHTML = ''; // Clear old list
            mockContacts.forEach(contact => {
                container.innerHTML += `
                    <a href="tel:${contact.number}" class="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-100">
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
            lucide.createIcons();
        }

        // Render Elder Nearby Page (Dynamic)
        function renderNearbyPage() {
            const container = document.getElementById('nearby-list-container');
            container.innerHTML = '';
            mockNearbyServices.forEach(service => {
                container.innerHTML += `
                    <div class="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between transition-all duration-300 hover:shadow-xl">
                        <div class="flex items-center">
                            <i data-lucide="${service.icon}" class="h-12 w-12 text-purple-500 mr-6"></i>
                            <div>
                                <h2 class="text-3xl font-bold">${service.name}</h2>
                                <p class="text-2xl text-gray-600">${service.distance}</p>
                            </div>
                        </div>
                        <i data-lucide="navigation" class="h-10 w-10 text-blue-500"></i>
                    </div>
                `;
            });
            lucide.createIcons();
        }

        // Render Elder Community Page (Dynamic)
        function renderCommunityPage() {
            const container = document.getElementById('community-events-container');
            container.innerHTML = '';
            mockCommunityEvents.forEach(event => {
                container.innerHTML += `
                    <div class="bg-white p-6 rounded-2xl shadow-lg flex items-center transition-all duration-300 hover:shadow-xl">
                        <i data-lucide="${event.icon}" class="h-12 w-12 text-orange-500 mr-6"></i>
                        <div>
                            <h2 class="text-3xl font-bold">${event.name}</h2>
                            <p class="text-2xl text-gray-600">${event.time}</p>
                            <p class="text-xl text-gray-500">${event.location}</p>
                        </div>
                    </div>
                `;
            });
            lucide.createIcons();
        }
        
        // --- Caregiver Render Functions (ALL FEATURES ADDED) ---
        function renderCaregiverNav() {
            const navItems = [
                { name: t('atAGlance'), page: 'dashboard', icon: 'home' },
                { name: t('manageMeds'), page: 'manage_meds', icon: 'pill' },
                { name: t('vitals'), page: 'manage_vitals', icon: 'line-chart' },
                { name: t('manageContacts'), page: 'manage_contacts', icon: 'users' },
                { name: t('manageSchedule'), page: 'manage_schedule', icon: 'calendar-days' },
                { name: t('manageNearby'), page: 'manage_nearby', icon: 'map-pin' },
                { name: t('manageCommunity'), page: 'manage_community', icon: 'coffee' },
            ];
            const container = document.getElementById('caregiver-nav-list');
            container.innerHTML = '';
            navItems.forEach(item => {
                container.innerHTML += `
                    <li>
                        <button data-page="${item.page}" class="nav-btn w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${currentPage === item.page ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}">
                            <i data-lucide="${item.icon}" class="h-5 w-5"></i>
                            <span class="font-medium">${item.name}</span>
                        </button>
                    </li>
                `;
            });
            lucide.createIcons();
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
            };
            
            const renderer = renderers[currentPage];
            if (renderer) {
                renderer();
            } else {
                // Fallback for any page not yet implemented
                const container = document.getElementById(`page-caregiver-${currentPage}`);
                if (container) {
                    const pageTitle = (currentPage.split('_').pop() || 'Page');
                    container.innerHTML = `<div class="bg-white p-6 rounded-xl shadow-lg"><h2 class="text-xl font-semibold mb-4">Manage ${pageTitle}</h2><p>This is a placeholder for the "${pageTitle}" management page.</p></div>`;
                }
            }
            lucide.createIcons();
        }

        function renderCaregiverDashboard() {
            const container = document.getElementById('page-caregiver-dashboard');
            container.innerHTML = `...`; // Same as before
            // ... (Dashboard rendering code) ...
        }
        
        function renderCaregiverManageMeds() {
            const container = document.getElementById('page-caregiver-manage_meds');
            container.innerHTML = `
                <div class="bg-white p-6 rounded-xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('manageMeds')}</h2>
                    <form id="form-add-med" class="mb-8 p-6 border rounded-lg bg-gray-50">
                        <h3 class="text-xl font-semibold mb-4">${t('addMed')}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" id="new-med-name" placeholder="${t('medName')}" class="p-3 border rounded-lg" required>
                            <input type="text" id="new-med-dosage" placeholder="${t('dosage')}" class="p-3 border rounded-lg">
                            <input type="time" id="new-med-time" placeholder="${t('time')}" class="p-3 border rounded-lg" required>
                            <input type="text" id="new-med-instruction" placeholder="${t('instructions')}" class="p-3 border rounded-lg">
                        </div>
                        <button type="submit" class="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-5 rounded-lg font-medium transition-all duration-300 active:scale-95">${t('addMed')}</button>
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
                    <div class="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                        <div>
                            <p class="font-bold text-lg">${med.name} <span class="text-base font-normal text-gray-600">(${med.dosage || 'N/A'})</span></p>
                            <p class="text-sm text-gray-500">${med.instruction} @ ${med.time}</p>
                        </div>
                        <button data-id="${med.id}" class="btn-delete-med text-red-500 hover:text-red-700 transition-all duration-300">
                            <i data-lucide="trash-2" class="h-5 w-5"></i>
                        </button>
                    </div>`;
            });
            lucide.createIcons();
        }

        function renderCaregiverManageVitals() {
            const container = document.getElementById('page-caregiver-manage_vitals');
            container.innerHTML = `...`; // Same as before
            // ... (Vitals rendering code) ...
            renderManageVitalsList();
        }

        function renderManageVitalsList() {
            // ... Same as before ...
        }
        
        // --- NEW CAREGIVER PAGES ---
        
        function renderCaregiverManageContacts() {
            const container = document.getElementById('page-caregiver-manage_contacts');
            container.innerHTML = `
                <div class="bg-white p-6 rounded-xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('manageContacts')}</h2>
                    <form id="form-add-contact" class="mb-8 p-6 border rounded-lg bg-gray-50">
                        <h3 class="text-xl font-semibold mb-4">${t('addContact')}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" id="new-contact-name" placeholder="${t('contactName')}" class="p-3 border rounded-lg" required>
                            <input type="text" id="new-contact-relation" placeholder="${t('relation')}" class="p-3 border rounded-lg">
                            <input type="tel" id="new-contact-number" placeholder="${t('phone')}" class="p-3 border rounded-lg" required>
                            <input type="text" id="new-contact-icon" placeholder="Icon (e.g., users)" class="p-3 border rounded-lg">
                        </div>
                        <button type="submit" class="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-5 rounded-lg font-medium transition-all duration-300 active:scale-95">${t('addContact')}</button>
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
                    <div class="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                        <div class="flex items-center">
                            <i data-lucide="${contact.icon || 'user'}" class="h-8 w-8 text-blue-500 mr-4"></i>
                            <div>
                                <p class="font-bold text-lg">${contact.name}</p>
                                <p class="text-sm text-gray-500">${contact.relation} | ${contact.number}</p>
                            </div>
                        </div>
                        <button data-id="${contact.id}" class="btn-delete-contact text-red-500 hover:text-red-700 transition-all duration-300">
                            <i data-lucide="trash-2" class="h-5 w-5"></i>
                        </button>
                    </div>`;
            });
            lucide.createIcons();
        }
        
        function renderCaregiverManageSchedule() {
            const container = document.getElementById('page-caregiver-manage_schedule');
            container.innerHTML = `
                <div class="bg-white p-6 rounded-xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('manageSchedule')}</h2>
                    <form id="form-add-schedule" class="mb-8 p-6 border rounded-lg bg-gray-50">
                        <h3 class="text-xl font-semibold mb-4">${t('addEntry')}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" id="new-schedule-title" placeholder="${t('title')}" class="p-3 border rounded-lg" required>
                            <input type="time" id="new-schedule-time" class="p-3 border rounded-lg" required>
                            <select id="new-schedule-type" class="p-3 border rounded-lg">
                                <option value="appointment">${t('appointment')}</option>
                                <option value="event">${t('event')}</option>
                            </select>
                        </div>
                        <button type="submit" class="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-5 rounded-lg font-medium transition-all duration-300 active:scale-95">${t('addEntry')}</button>
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
                    <div class="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                        <div class="flex items-center">
                            <i data-lucide="${icon}" class="h-8 w-8 text-indigo-500 mr-4"></i>
                            <div>
                                <p class="font-bold text-lg">${item.title}</p>
                                <p class="text-sm text-gray-500">${t(item.type)} at ${item.time}</p>
                            </div>
                        </div>
                        <button data-id="${item.id}" class="btn-delete-schedule text-red-500 hover:text-red-700 transition-all duration-300">
                            <i data-lucide="trash-2" class="h-5 w-5"></i>
                        </button>
                    </div>`;
            });
            lucide.createIcons();
        }
        
        function renderCaregiverManageNearby() {
            const container = document.getElementById('page-caregiver-manage_nearby');
            container.innerHTML = `
                <div class="bg-white p-6 rounded-xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('manageNearby')}</h2>
                    <form id="form-add-nearby" class="mb-8 p-6 border rounded-lg bg-gray-50">
                        ... (Form for Name, Distance, Icon) ...
                        <button type="submit" class="mt-4 w-full bg-blue-500 ...">${t('addPlace')}</button>
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
            mockNearbyServices.forEach(item => { /* ... render item ... */ });
            lucide.createIcons();
        }
        
        function renderCaregiverManageCommunity() {
            const container = document.getElementById('page-caregiver-manage_community');
            container.innerHTML = `
                <div class="bg-white p-6 rounded-xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('manageCommunity')}</h2>
                    <form id="form-add-community" class="mb-8 p-6 border rounded-lg bg-gray-50">
                        ... (Form for Event Name, Time, Location) ...
                        <button type="submit" class="mt-4 w-full bg-blue-500 ...">${t('addEvent')}</button>
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
            mockCommunityEvents.forEach(item => { /* ... render item ... */ });
            lucide.createIcons();
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
            renderApp();
        }

        function handleTakeMed(id) {
            const medCard = document.getElementById(`med-card-${id}`);
            if (medCard) {
                medCard.classList.add('slide-out');
                setTimeout(() => {
                    const med = mockMedications.find(m => m.id === id);
                    if (med) med.taken = true;
                    renderMedsPage();
                    updateNextReminder();
                    showToast(t('meds') + ' ' + t('markAsTaken'));
                }, 500);
            }
        }

        function openSOS() { /* ... Same as before ... */ }
        function closeSOS(cancelled = false) { /* ... Same as before ... */ }
        function openModal({ title, text, confirmText, onConfirm }) { /* ... Same as before ... */ }
        function closeModal() { /* ... Same as before ... */ }

        // --- Caregiver Form Handlers (NEW) ---
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
            renderManageMedsList();
            e.target.reset();
            showToast(t('meds') + ' Added');
        }

        function handleDeleteMed(id) {
            mockMedications = mockMedications.filter(med => med.id !== id);
            renderManageMedsList();
        }
        
        function handleAddVital(e) { /* ... Same as before ... */ }
        function handleDeleteVital(id) { /* ... Same as before ... */ }
        
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
            renderManageContactsList();
            e.target.reset();
            showToast(t('addContact') + 'd');
        }

        function handleDeleteContact(id) {
            mockContacts = mockContacts.filter(c => c.id !== id);
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
            renderManageScheduleList();
            e.target.reset();
            showToast(t('addEntry') + 'd');
        }

        function handleDeleteSchedule(id) {
            mockSchedule = mockSchedule.filter(s => s.id !== id);
            renderManageScheduleList();
        }
        
        function renderCaregiverManageNearby() {
            const container = document.getElementById('page-caregiver-manage_nearby');
            container.innerHTML = `
                <div class="bg-white p-6 rounded-xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('manageNearby')}</h2>
                    <form id="form-add-nearby" class="mb-8 p-6 border rounded-lg bg-gray-50">
                        <h3 class="text-xl font-semibold mb-4">${t('addPlace')}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" id="new-nearby-name" placeholder="${t('placeName')}" class="p-3 border rounded-lg" required>
                            <input type="text" id="new-nearby-distance" placeholder="${t('distance')}" class="p-3 border rounded-lg">
                            <input type="text" id="new-nearby-icon" placeholder="Icon (e.g., pill)" class="p-3 border rounded-lg" value="map-pin">
                        </div>
                        <button type="submit" class="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-5 rounded-lg font-medium transition-all duration-300 active:scale-95">${t('addPlace')}</button>
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
                    <div class="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                        <div class="flex items-center">
                            <i data-lucide="${item.icon || 'map-pin'}" class="h-8 w-8 text-purple-500 mr-4"></i>
                            <div>
                                <p class="font-bold text-lg">${item.name}</p>
                                <p class="text-sm text-gray-500">${item.distance}</p>
                            </div>
                        </div>
                        <button data-id="${item.id}" class="btn-delete-nearby text-red-500 hover:text-red-700 transition-all duration-300">
                            <i data-lucide="trash-2" class="h-5 w-5"></i>
                        </button>
                    </div>`;
            });
            lucide.createIcons();
        }
        
        function renderCaregiverManageCommunity() {
            const container = document.getElementById('page-caregiver-manage_community');
            container.innerHTML = `
                <div class="bg-white p-6 rounded-xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">${t('manageCommunity')}</h2>
                    <form id="form-add-community" class="mb-8 p-6 border rounded-lg bg-gray-50">
                        <h3 class="text-xl font-semibold mb-4">${t('addEvent')}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" id="new-community-name" placeholder="${t('eventName')}" class="p-3 border rounded-lg" required>
                            <input type="text" id="new-community-time" placeholder="${t('time')}" class="p-3 border rounded-lg" required>
                            <input type="text" id="new-community-location" placeholder="${t('location')}" class="p-3 border rounded-lg">
                            <input type="text" id="new-community-icon" placeholder="Icon (e.g., coffee)" class="p-3 border rounded-lg" value="users">
                        </div>
                        <button type="submit" class="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-5 rounded-lg font-medium transition-all duration-300 active:scale-95">${t('addEvent')}</button>
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
                    <div class="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                        <div class="flex items-center">
                            <i data-lucide="${item.icon || 'users'}" class="h-8 w-8 text-orange-500 mr-4"></i>
                            <div>
                                <p class="font-bold text-lg">${item.name}</p>
                                <p class="text-sm text-gray-500">${item.time} | ${item.location}</p>
                            </div>
                        </div>
                        <button data-id="${item.id}" class="btn-delete-community text-red-500 hover:text-red-700 transition-all duration-300">
                            <i data-lucide="trash-2" class="h-5 w-5"></i>
                        </button>
                    </div>`;
            });
            lucide.createIcons();
        }


        // --- STATE HANDLERS ---
        function handleDeleteSchedule(id) {
            mockSchedule = mockSchedule.filter(s => s.id !== id);
            renderManageScheduleList();
        }
        
        // NEW HANDLERS
        function handleAddNearby(e) {
            e.preventDefault();
            const newNearby = {
                id: Date.now(),
                name: document.getElementById('new-nearby-name').value,
                distance: document.getElementById('new-nearby-distance').value,
                icon: document.getElementById('new-nearby-icon').value || 'map-pin'
            };
            mockNearbyServices.push(newNearby);
            renderManageNearbyList();
            e.target.reset();
            showToast(t('addPlace') + 'd');
        }
        
        function handleDeleteNearby(id) {
            mockNearbyServices = mockNearbyServices.filter(s => s.id !== id);
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
            renderManageCommunityList();
            e.target.reset();
            showToast(t('addEvent') + 'd');
        }
        
        function handleDeleteCommunity(id) {
            mockCommunityEvents = mockCommunityEvents.filter(e => e.id !== id);
            renderManageCommunityList();
        }
        
        // ... (Add/Delete handlers for Nearby and Community) ...

        // --- EVENT LISTENERS ---
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            
            // Language switchers
            document.getElementById('lang-en').addEventListener('click', () => setLanguage('en'));
            document.getElementById('lang-hi').addEventListener('click', () => setLanguage('hi'));
            document.getElementById('lang-mr').addEventListener('click', () => setLanguage('mr'));

            // View toggle
            document.getElementById('view-toggle-btn').addEventListener('click', toggleView);

            // SOS Buttons
            document.getElementById('btn-sos-open').addEventListener('click', openSOS);
            document.getElementById('btn-sos-cancel').addEventListener('click', () => closeSOS(true));
            document.getElementById('btn-sos-ok').addEventListener('click', () => closeSOS(false));

            // Modal Buttons
            document.getElementById('modal-btn-cancel').addEventListener('click', closeModal);
            document.getElementById('modal-btn-confirm').addEventListener('click', () => {
                if (modalConfirmCallback) modalConfirmCallback();
                closeModal();
            });
            
            // Elder - Doctor on Call Modal Button
            document.getElementById('btn-open-call-modal').addEventListener('click', () => {
                openModal({
                    title: t('callDoctorTitle'),
                    text: t('callDoctorText'),
                    confirmText: t('call'),
                    onConfirm: () => { console.log("Simulating call..."); }
                });
            });

            // Navigation (Event Delegation)
            document.body.addEventListener('click', (e) => {
                const navButton = e.target.closest('.nav-btn');
                if (navButton) navigate(navButton.dataset.page);
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
                // NEW
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
                if (e.target.id === 'form-add-vital') handleAddVital(e);
                if (e.target.id === 'form-add-contact') handleAddContact(e);
                if (e.target.id === 'form-add-schedule') handleAddSchedule(e);
                // NEW
                if (e.target.id === 'form-add-nearby') handleAddNearby(e);
                if (e.target.id === 'form-add-community') handleAddCommunity(e);
            });

            // Initial Render
            renderApp();
        });

        if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/service-worker.js");
        }
