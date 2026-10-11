// ==========================================

// CUSTOSEDU JAVASCRIPT

// ==========================================



const MAX_FILE_SIZE = 100 * 1024 * 1024;



const DB_NAME = "CustosEduDatabase";

const DB_VERSION = 1;

const STORE_NAME = "documents";



let currentUser = sessionStorage.getItem("custosEduUser");

let verifiedUser = null;

let db;



// ==========================================

// ACCOUNT STORAGE

// ==========================================



function getUsers() {

    return JSON.parse(localStorage.getItem("custosEduUsers") || "[]");

}



function saveUsers(users) {

    localStorage.setItem("custosEduUsers", JSON.stringify(users));

}



function getCurrentAccount() {

    return getUsers().find(user =>

        user.username.toLowerCase() === String(currentUser || "").toLowerCase()

    );

}



function saveCurrentAccount(updatedUser) {

    const users = getUsers();

    const index = users.findIndex(user =>

        user.username.toLowerCase() === currentUser.toLowerCase()

    );



    if (index !== -1) {

        users[index] = updatedUser;

        saveUsers(users);

    }

}



// ==========================================

// MESSAGES

// ==========================================



function showMessage(id, text, type = "") {

    const message = document.getElementById(id);



    if (!message) return;



    message.textContent = text;

    message.className = "message " + type;

}



// ==========================================

// BIRTHDAY

// ==========================================



function formatBirthday(value) {

    if (!value) return null;



    const parts = value.split("-");



    if (parts.length !== 3) return null;



    const year = Number(parts[0]);

    const month = Number(parts[1]);

    const day = Number(parts[2]);



    if (

        !Number.isInteger(year) ||

        !Number.isInteger(month) ||

        !Number.isInteger(day)

    ) {

        return null;

    }



    if (year < 1900 || year > new Date().getFullYear()) {

        return null;

    }



    const date = new Date(year, month - 1, day);



    if (

        date.getFullYear() !== year ||

        date.getMonth() !== month - 1 ||

        date.getDate() !== day

    ) {

        return null;

    }



    return String(month).padStart(2, "0") + "/" +

           String(day).padStart(2, "0") + "/" + year;

}



// ==========================================

// DATABASE

// ==========================================



function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, DB_VERSION);



        request.onupgradeneeded = function(event) {

            const database = event.target.result;



            if (!database.objectStoreNames.contains(STORE_NAME)) {

                const store = database.createObjectStore(STORE_NAME, {

                    keyPath: "id",

                    autoIncrement: true

                });



                store.createIndex("owner", "owner", {

                    unique: false

                });

            }

        };



        request.onsuccess = event => resolve(event.target.result);

        request.onerror = () => reject(request.error);

    });

}



// Build aligned birthday selectors for registration and password recovery.
function setupBirthdayPicker(prefix) {
    const month = document.getElementById(prefix + "Month");
    const day = document.getElementById(prefix + "Day");
    const year = document.getElementById(prefix + "Year");
    const hidden = document.getElementById(prefix);
    if (!month || !day || !year || !hidden) return;

    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1900; y--) {
        const option = document.createElement("option");
        option.value = String(y); option.textContent = String(y); year.appendChild(option);
    }

    function refreshDays() {
        const oldDay = Number(day.value);
        const m = Number(month.value);
        const y = Number(year.value);
        const count = m && y ? new Date(y, m, 0).getDate() : (m ? new Date(2000, m, 0).getDate() : 31);
        day.innerHTML = '<option value="">Day</option>';
        for (let d = 1; d <= count; d++) {
            const option = document.createElement("option");
            option.value = String(d).padStart(2, "0"); option.textContent = String(d); day.appendChild(option);
        }
        if (oldDay && oldDay <= count) day.value = String(oldDay).padStart(2, "0");
        sync();
    }
    function sync() {
        hidden.value = month.value && day.value && year.value
            ? `${year.value}-${month.value}-${String(day.value).padStart(2, "0")}` : "";
    }
    month.addEventListener("change", refreshDays);
    year.addEventListener("change", refreshDays);
    day.addEventListener("change", sync);
    year.parentElement.querySelectorAll("[data-year-step]").forEach(button => {
        button.addEventListener("click", () => {
            const next = Number(year.value || currentYear) + Number(button.dataset.yearStep);
            if (next >= 1900 && next <= currentYear) { year.value = String(next); refreshDays(); }
        });
    });
}

let toastTimer;
function showToast(message) {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
}

// ==========================================

// NAVIGATION

// ==========================================



function showPage(pageId) {

    if ((pageId === "documents" || pageId === "settings") && !currentUser) {

        pageId = "login";

    }



    document.querySelectorAll(".page").forEach(page => {

        page.hidden = true;

    });



    const page = document.getElementById(pageId);



    if (page) page.hidden = false;



    if (pageId === "settings" && currentUser) {

        loadAccountSettings();

    }



    if (pageId === "documents" && currentUser) {

        loadDocuments();

    }



    window.scrollTo(0, 0);

}



function openLibrary() {

    showPage("documents");

}



function updateHome() {

    const loggedIn = Boolean(currentUser);



    document.getElementById("homeLoginBtn").hidden = loggedIn;

    document.getElementById("homeRegisterBtn").hidden = loggedIn;

    document.getElementById("openLibraryBtn").hidden = !loggedIn;

    document.getElementById("logoutBtn").hidden = !loggedIn;

    document.getElementById("settingsNavBtn").hidden = !loggedIn;



    const welcome = document.getElementById("welcomeMessage");



    const homeProfile = document.getElementById("homeProfile");
    const homeProfilePicture = document.getElementById("homeProfilePicture");
    const homeProfileName = document.getElementById("homeProfileName");

    if (loggedIn) {

        const account = getCurrentAccount();
        const displayName = account?.displayName || currentUser;

        welcome.textContent = "Welcome, " + displayName + "!";
        homeProfile.hidden = false;
        homeProfileName.textContent = displayName;

        if (account?.profilePicture) {
            homeProfilePicture.src = account.profilePicture;
            homeProfilePicture.hidden = false;
        } else {
            homeProfilePicture.src = "logo.png";
            homeProfilePicture.hidden = false;
        }

        applyTheme(account?.theme || "light");

    } else {

        welcome.textContent = "Please log in to access your document library.";
        homeProfile.hidden = true;
        homeProfilePicture.removeAttribute("src");
        applyTheme("light");

    }

}



// ==========================================

// REGISTER

// ==========================================



document.getElementById("registerForm").addEventListener("submit", function(event) {

    event.preventDefault();



    const username = document.getElementById("regUsername").value.trim();

    const password = document.getElementById("regPassword").value;

    const birthday = formatBirthday(document.getElementById("regBirthday").value);

    const favorite = document.getElementById("regFavorite").value.trim().toLowerCase();



    const users = getUsers();



    if (username.length < 3) {

        showMessage("registerMessage", "Username must have at least 3 characters.", "error");

        return;

    }



    if (password.length < 6) {

        showMessage("registerMessage", "Password must have at least 6 characters.", "error");

        return;

    }



    if (!birthday) {

        showMessage("registerMessage", "Please enter a valid birthday.", "error");

        return;

    }



    const exists = users.some(user =>

        user.username.toLowerCase() === username.toLowerCase()

    );



    if (exists) {

        showMessage("registerMessage", "That username already exists.", "error");

        return;

    }



    users.push({

        username: username,

        password: password,

        birthday: birthday,

        favorite: favorite,

        displayName: username,

        profilePicture: "",

        theme: "light"

    });



    saveUsers(users);



    this.reset();



    showMessage("registerMessage", "Account created successfully! You can now log in.", "success");

});



// ==========================================

// LOGIN

// ==========================================



document.getElementById("loginForm").addEventListener("submit", function(event) {

    event.preventDefault();



    const username = document.getElementById("loginUsername").value.trim();

    const password = document.getElementById("loginPassword").value;



    const user = getUsers().find(account =>

        account.username.toLowerCase() === username.toLowerCase() &&

        account.password === password

    );



    if (!user) {

        showMessage("loginMessage", "Incorrect username or password.", "error");

        return;

    }



    currentUser = user.username;

    sessionStorage.setItem("custosEduUser", currentUser);



    this.reset();
    updateHome();
    showPage("home");
    showToast("Successfully logged in. Welcome to CustosEdu, " + (user.displayName || user.username) + "!");
    showMessage("loginMessage", "", "");

});



// ==========================================

// LOGOUT

// ==========================================



function logout() {

    currentUser = null;

    sessionStorage.removeItem("custosEduUser");

    verifiedUser = null;



    updateHome();

    showPage("home");

}



// ==========================================

// FORGOT PASSWORD

// ==========================================



document.getElementById("forgotForm").addEventListener("submit", function(event) {

    event.preventDefault();



    const username = document.getElementById("forgotUsername").value.trim();

    const birthday = formatBirthday(document.getElementById("forgotBirthday").value);

    const favorite = document.getElementById("forgotFavorite").value.trim().toLowerCase();

    const newPassword = document.getElementById("newPassword").value;

    const confirmPassword = document.getElementById("confirmPassword").value;

    const robotCheck = document.getElementById("robotCheck").checked;



    const users = getUsers();



    const index = users.findIndex(user =>

        user.username.toLowerCase() === username.toLowerCase()

    );



    if (index === -1) {

        showMessage("forgotMessage", "Account not found.", "error");

        return;

    }



    const user = users[index];



    if (user.birthday !== birthday || user.favorite !== favorite) {

        showMessage("forgotMessage", "Birthday or recovery answer is incorrect.", "error");

        return;

    }



    if (!robotCheck) {

        showMessage("forgotMessage", "Please confirm that you are not a robot.", "error");

        return;

    }



    if (newPassword.length < 6) {

        showMessage("forgotMessage", "Password must have at least 6 characters.", "error");

        return;

    }



    if (newPassword !== confirmPassword) {

        showMessage("forgotMessage", "Passwords do not match.", "error");

        return;

    }



    users[index].password = newPassword;

    saveUsers(users);



    this.reset();



    showMessage("forgotMessage", "Password changed successfully. You can now log in.", "success");

});



// ==========================================

// ACCOUNT SETTINGS

// ==========================================



function loadAccountSettings() {

    const user = getCurrentAccount();



    if (!user) return;



    document.getElementById("displayName").value =

        user.displayName || user.username;



    document.getElementById("themeSelect").value =

        user.theme || "light";



    const preview = document.getElementById("profilePreview");



    if (user.profilePicture) {

        preview.src = user.profilePicture;

        preview.hidden = false;

    } else {

        preview.removeAttribute("src");

        preview.hidden = true;

    }



    document.getElementById("profilePicture").value = "";



    applyTheme(user.theme || "light");

}



function applyTheme(theme) {

    document.body.classList.toggle("dark-theme", theme === "dark");

}



// ==========================================

// SAVE THEME

// ==========================================



function saveTheme() {

    const user = getCurrentAccount();



    if (!user) return;



    user.theme = document.getElementById("themeSelect").value;



    saveCurrentAccount(user);

    applyTheme(user.theme);



    showMessage("settingsMessage", "Appearance saved successfully.", "success");

}



// ==========================================

// PROFILE CUSTOMIZATION

// ==========================================



document.getElementById("profileForm").addEventListener("submit", function(event) {

    event.preventDefault();



    const user = getCurrentAccount();



    if (!user) return;



    const displayName = document.getElementById("displayName").value.trim();

    const file = document.getElementById("profilePicture").files[0];



    if (!displayName) {

        showMessage("settingsMessage", "Please enter a display name.", "error");

        return;

    }



    function saveProfile(pictureData) {

        const account = getCurrentAccount();



        if (!account) return;



        account.displayName = displayName;



        if (pictureData !== undefined) {

            account.profilePicture = pictureData;

        }



        saveCurrentAccount(account);



        updateHome();



        showMessage("settingsMessage", "Profile customized successfully.", "success");

    }



    if (file) {

        if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {

            showMessage("settingsMessage", "Choose an image under 2 MB.", "error");

            return;

        }



        const reader = new FileReader();



        reader.onload = () => saveProfile(reader.result);



        reader.onerror = () => {

            showMessage("settingsMessage", "Could not read that image.", "error");

        };



        reader.readAsDataURL(file);

    } else {

        saveProfile(undefined);

    }

});



// Profile picture preview



document.getElementById("profilePicture").addEventListener("change", function() {

    const file = this.files[0];

    const preview = document.getElementById("profilePreview");



    if (!file) return;



    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {

        showMessage("settingsMessage", "Choose an image under 2 MB.", "error");

        this.value = "";

        preview.hidden = true;

        return;

    }



    preview.src = URL.createObjectURL(file);

    preview.hidden = false;

});



// ==========================================

// CHANGE PASSWORD

// ==========================================



document.getElementById("changePasswordForm").addEventListener("submit", function(event) {

    event.preventDefault();



    const users = getUsers();



    const index = users.findIndex(user =>

        user.username.toLowerCase() === currentUser.toLowerCase()

    );



    if (index === -1) return;



    const currentPassword = document.getElementById("currentPassword").value;

    const newPassword = document.getElementById("settingsNewPassword").value;

    const confirmPassword = document.getElementById("settingsConfirmPassword").value;



    if (users[index].password !== currentPassword) {

        showMessage("settingsMessage", "Your current password is incorrect.", "error");

        return;

    }



    if (newPassword.length < 6) {

        showMessage("settingsMessage", "New password must have at least 6 characters.", "error");

        return;

    }



    if (newPassword !== confirmPassword) {

        showMessage("settingsMessage", "The new passwords do not match.", "error");

        return;

    }



    users[index].password = newPassword;

    saveUsers(users);



    this.reset();



    showMessage("settingsMessage", "Password changed successfully.", "success");

});



// ==========================================

// DELETE ACCOUNT

// ==========================================



async function deleteAccount() {

    const user = getCurrentAccount();



    if (!user) return;



    const password = document.getElementById("deleteAccountPassword").value;

    const confirmed = document.getElementById("confirmDeleteAccount").checked;



    if (password !== user.password) {

        showMessage("settingsMessage", "Enter your correct password to delete your account.", "error");

        return;

    }



    if (!confirmed) {

        showMessage("settingsMessage", "Please check the confirmation box first.", "error");

        return;

    }



    const sure = confirm(

        "Are you sure? Your account and all files belonging to it will be permanently deleted from this browser."

    );



    if (!sure) return;



    try {

        await new Promise((resolve, reject) => {

            const transaction = db.transaction([STORE_NAME], "readwrite");

            const store = transaction.objectStore(STORE_NAME);

            const request = store.getAll();



            request.onsuccess = function() {

                request.result

                    .filter(doc =>

                        doc.owner &&

                        doc.owner.toLowerCase() === currentUser.toLowerCase()

                    )

                    .forEach(doc => store.delete(doc.id));

            };



            transaction.oncomplete = resolve;

            transaction.onerror = () => reject(transaction.error);

            transaction.onabort = () => reject(transaction.error);

        });



        const users = getUsers().filter(account =>

            account.username.toLowerCase() !== currentUser.toLowerCase()

        );



        saveUsers(users);



        sessionStorage.removeItem("custosEduUser");



        currentUser = null;

        verifiedUser = null;



        updateHome();

        showPage("home");



        alert("Your account and its stored files have been deleted from this browser.");



    } catch (error) {

        showMessage("settingsMessage", "Could not delete the account files. Please try again.", "error");

    }

}



// ==========================================

// UPLOAD FILES

// ==========================================



function getFileType(file) {

    const name = file.name.toLowerCase();

    const type = file.type.toLowerCase();



    if (type === "application/pdf" || name.endsWith(".pdf")) {

        return "PDF";

    }



    if (type.startsWith("image/") ||

        /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(name)) {

        return "Image";

    }



    if (type.startsWith("video/") ||

        /\.(mp4|webm|ogg|mov)$/.test(name)) {

        return "Video";

    }



    return "Other";

}



function isAllowedFile(file) {

    return ["PDF", "Image", "Video"].includes(getFileType(file));

}



function getCategoryForFile(file) {

    const type = getFileType(file);



    if (type === "Image") return "Photos";

    if (type === "Video") return "Videos";



    return document.getElementById("documentCategory").value;

}



document.getElementById("uploadForm").addEventListener("submit", function(event) {

    event.preventDefault();



    if (!currentUser) {

        showPage("login");

        return;

    }



    const title = document.getElementById("documentTitle").value.trim();

    const file = document.getElementById("pdfFile").files[0];



    if (!title || !file) {

        showMessage("uploadMessage", "Please enter a title and choose a file.", "error");

        return;

    }



    if (!isAllowedFile(file)) {

        showMessage("uploadMessage", "Only PDF, image, and video files are supported.", "error");

        return;

    }



    if (file.size > MAX_FILE_SIZE) {

        showMessage("uploadMessage", "File size must not exceed 100 MB.", "error");

        return;

    }



    const category = getCategoryForFile(file);



    const documentData = {

        title: title,

        category: category,

        fileName: file.name,

        fileType: file.type || getFileType(file),

        type: getFileType(file),

        file: file,

        owner: currentUser,

        date: new Date().toLocaleDateString()

    };



    const transaction = db.transaction([STORE_NAME], "readwrite");

    const store = transaction.objectStore(STORE_NAME);



    store.add(documentData);



    transaction.oncomplete = function() {

        showMessage("uploadMessage", "File uploaded successfully.", "success");

        document.getElementById("uploadForm").reset();

        loadDocuments();

    };



    transaction.onerror = function() {

        showMessage("uploadMessage", "Could not upload the file. Browser storage may be full.", "error");

    };

});



// ==========================================

// LOAD DOCUMENTS

// ==========================================



function loadDocuments() {

    if (!currentUser || !db) return;



    const transaction = db.transaction([STORE_NAME], "readonly");

    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();



    request.onsuccess = function() {

        const documents = request.result.filter(doc =>

            doc.owner &&

            doc.owner.toLowerCase() === currentUser.toLowerCase()

        );



        displayDocuments(documents);

    };



    request.onerror = function() {

        showMessage("documentMessage", "Unable to load files.", "error");

    };

}



// ==========================================

// DISPLAY DOCUMENTS

// ==========================================



function displayDocuments(documents) {

    const list = document.getElementById("documentList");

    const search = document.getElementById("searchInput").value.toLowerCase();

    const category = document.getElementById("categoryFilter").value;



    list.innerHTML = "";



    const filtered = documents.filter(doc => {

        const matchesSearch =

            doc.title.toLowerCase().includes(search) ||

            doc.category.toLowerCase().includes(search) ||

            doc.fileName.toLowerCase().includes(search);



        const matchesCategory =

            category === "All" || doc.category === category;



        return matchesSearch && matchesCategory;

    });



    if (filtered.length === 0) {

        showMessage("documentMessage", "No files found.", "");

        return;

    }



    showMessage("documentMessage", "", "");



    filtered.forEach(doc => {

        const card = document.createElement("div");

        card.className = "document-card";



        const title = document.createElement("h3");

        title.textContent = doc.title;



        const fileInfo = document.createElement("p");

        fileInfo.textContent = "File: " + doc.fileName;



        const categoryInfo = document.createElement("p");

        categoryInfo.textContent = "Category: " + doc.category;



        const type = doc.type || getFileType({

            name: doc.fileName,

            type: doc.fileType || ""

        });



        const icon = document.createElement("div");

        icon.className = "file-icon";

        icon.textContent =

            type === "PDF" ? "📄" :

            type === "Image" ? "🖼️" :

            type === "Video" ? "🎬" : "📁";



        card.appendChild(icon);

        card.appendChild(title);

        card.appendChild(fileInfo);

        card.appendChild(categoryInfo);



        if (type === "Image" && doc.file) {

            const image = document.createElement("img");

            image.className = "document-preview";

            image.src = URL.createObjectURL(doc.file);

            image.alt = doc.title;



            image.onclick = () => viewFile(doc.id);



            card.appendChild(image);

        }



        if (type === "Video" && doc.file) {

            const video = document.createElement("video");

            video.className = "document-video";

            video.controls = true;

            video.src = URL.createObjectURL(doc.file);



            card.appendChild(video);

        }



        const viewButton = document.createElement("button");

        viewButton.textContent = type === "Video" ? "Open Video" : "View File";

        viewButton.onclick = () => viewFile(doc.id);



        const downloadButton = document.createElement("button");

        downloadButton.textContent = "Download";

        downloadButton.onclick = () => downloadFile(doc.id);



        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";

        deleteButton.className = "delete-btn";

        deleteButton.onclick = () => deleteFile(doc.id);



        card.appendChild(viewButton);

        card.appendChild(downloadButton);

        card.appendChild(deleteButton);



        list.appendChild(card);

    });

}



// ==========================================

// GET DOCUMENT

// ==========================================



function getDocumentById(id) {

    return new Promise((resolve, reject) => {

        const transaction = db.transaction([STORE_NAME], "readonly");

        const store = transaction.objectStore(STORE_NAME);

        const request = store.get(id);



        request.onsuccess = function() {

            const doc = request.result;



            if (!doc || doc.owner.toLowerCase() !== currentUser.toLowerCase()) {

                reject("File not found.");

                return;

            }



            resolve(doc);

        };



        request.onerror = () => reject(request.error);

    });

}



// ==========================================

// VIEW FILE

// ==========================================



async function viewFile(id) {

    try {

        const doc = await getDocumentById(id);

        const fileURL = URL.createObjectURL(doc.file);



        const newWindow = window.open(fileURL, "_blank");



        if (!newWindow) {

            alert("Please allow pop-ups to view this file.");

        }

    } catch (error) {

        alert("Unable to open this file.");

    }

}



// ==========================================

// DOWNLOAD FILE

// ==========================================



async function downloadFile(id) {

    try {

        const doc = await getDocumentById(id);

        const fileURL = URL.createObjectURL(doc.file);



        const link = document.createElement("a");

        link.href = fileURL;

        link.download = doc.fileName;



        document.body.appendChild(link);

        link.click();

        link.remove();



        setTimeout(() => URL.revokeObjectURL(fileURL), 3000);



    } catch (error) {

        alert("Unable to download this file.");

    }

}



// ==========================================

// DELETE FILE

// ==========================================



function deleteFile(id) {

    if (!confirm("Are you sure you want to delete this file?")) {

        return;

    }



    getDocumentById(id).then(doc => {

        const transaction = db.transaction([STORE_NAME], "readwrite");

        const store = transaction.objectStore(STORE_NAME);



        store.delete(doc.id);



        transaction.oncomplete = function() {

            loadDocuments();

            showMessage("documentMessage", "File deleted successfully.", "success");

        };



        transaction.onerror = function() {

            alert("Unable to delete this file.");

        };

    }).catch(() => {

        alert("File not found.");

    });

}



// ==========================================

// SEARCH AND CATEGORY FILTER

// ==========================================



document.getElementById("searchInput").addEventListener("input", loadDocuments);

document.getElementById("categoryFilter").addEventListener("change", loadDocuments);



// ==========================================

// START CUSTOSEDU

// ==========================================



async function startCustosEdu() {
    // Initialize birthday selectors before opening the file database.
    // This keeps registration and password recovery usable if IndexedDB fails.
    setupBirthdayPicker("regBirthday");
    setupBirthdayPicker("forgotBirthday");

    updateHome();
    showPage("home");

    try {
        db = await openDatabase();
    } catch (error) {
        console.error("CustosEdu database could not be opened:", error);
        showToast("The vault file database could not start. Open CustosEdu with VS Code Live Server in Chrome or Edge.");
    }
}

startCustosEdu();
