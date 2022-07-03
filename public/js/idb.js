// variable to hold db connection
let db;
// connection to IndexedDB database 
const request = indexedDB.open('budget', 1);

// this event will emit if the database version changes
request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `new_transaction`, 
    //set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_transaction', { autoIncrement: true });
  };

  // upon a successful 
request.onsuccess = function(event) {
    // db successfully created with its object store, established a connection 
    //save reference to db in global variable
    db = event.target.result;
    // if app is online run uploadTransaction() to send all local db data to api
    if (navigator.onLine) {
        uploadTransaction();
    }
  };
  
  request.onerror = function(event) {
    console.log(event.target.errorCode);
  };

  // function executed when there is no connection and submit a new transaction
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    // access the object store for `new_transaction`
    const transactionObjectStore = transaction.objectStore('new_transaction');
    // add record to your store with add method
    transactionObjectStore.add(record);
  }

  function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    // access object store
    const transactionObjectStore = transaction.objectStore('new_transaction');
    // get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();
  
    // upon successful .getAll() , run this function
getAll.onsuccess = function() {
    // if data in indexedDb's store, send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          // access the new_transaction object store
          const transactionObjectStore = transaction.objectStore('new_transaction');
          // clear all items in your store
          transactionObjectStore.clear();

          alert('A saved transaction has been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
  }

  // listen for app coming back online
window.addEventListener('online', uploadTransaction);
