let db;
// create a new db request for a "budget" database.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
    // create object store called pending
    // set autoIncrement to true so it renders information
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;

    // check if app is online before reading from db
    // offline info can be different from online or updated
    if (navigator.onLine) {
        loadingDatabase();
    }
};

request.onerror = function (event) {
    console.log("Oh no, something went wrong... 404error! " + event.target.errorCode);
};

function saveRecord(record) {
    // create a transaction on the pending
    // need db with readwrite access rights in order to 
    const transaction = db.transaction(["pending"], "readwrite");

    // access your pending object store
    const store = transaction.objectStore("pending");

    // Use the add method to store information to record
    store.add(record);
}

function loadingDatabase() {
    // open a transaction on your pending db
    const transaction = db.transaction(["pending"], "readwrite");
    // access your pending object store
    const store = transaction.objectStore("pending");
    // get all records from store and set to a variable
    const getAll = store.getAll();

    // POST method
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                // using promises to change the status of "pending"
                .then(response => response.json())
                .then(() => {
                    // if successful, open a transaction on your pending db
                    const transaction = db.transaction(["pending"], "readwrite");

                    // access your pending object store
                    const store = transaction.objectStore("pending");

                    // clear all items in your store
                    store.clear();
                });
        }
    };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
