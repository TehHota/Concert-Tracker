function formSubmit(e) {
  var email = e.namedValues['Email'][0];
  var semester = e.namedValues['Semester'] + ' ' + e.namedValues['Year'];
  getData(email, semester);
}

/** Gets data based on form email and semester responses and emails */
function getData(fEmail, fSemester){
  
  // !!!UPDATE NAMES IF SHEET NAMES CHANGE!!! //
  const STUDENTS_SHEET = 'Students';
  const ATTENDANCE_SHEET = 'Attendance';
  const CONCERTS_SHEET = 'Concerts';
  const CONCERT_CATEGORY_SHEET = 'ConcertCategories';
  const REQUIREMENTS_SHEET = 'Requirements';

  // Opens Master Sheet Google Sheet
  var sheet = SpreadsheetApp.openById("1Ccec3zdEEe37Zjt8O64k9a1GyqRF2x-0AAKRBti2Ew4");

  // Variables for each table
  var students = sheet.getSheetByName(STUDENTS_SHEET);
  var attendance = sheet.getSheetByName(ATTENDANCE_SHEET);
  var concerts = sheet.getSheetByName(CONCERTS_SHEET);
  var categories = sheet.getSheetByName(CONCERT_CATEGORY_SHEET);
  var requirements = sheet.getSheetByName(REQUIREMENTS_SHEET);
  
  // Variables to store data for the student and the concerts he/she attended
  var email = fEmail;                                                                                               // Student email
  var semester = fSemester;                                                                                         // Semester selected
  var studentName = search(students.getDataRange().getValues(), email, 3, 1);                                       // Student first name from students table based on student email

  // If student email does not return a student name, then the script is halted and error email is sent to user
  if (studentName === 0) return MailApp.sendEmail("tjyurek@gmail.com", "Concert Attendance Data Error", "The email you entered did not return any results. Please check if spelling is correct for email.");

  var studentID = search(students.getDataRange().getValues(), email, 3, 0);                                         // Student ID from students table based on student email
  var concertIDs = searchArry(attendance.getDataRange().getValues(), studentID, semester, 2, 3, 1);                 // Array of concert IDs from attendance table based on student ID
  var concertDates = searchArry(attendance.getDataRange().getValues(), studentID, semester, 2, 3, 0);               // Array of concert dates from attendance table based on student ID
  var attendedConcerts = [];                                                                                        // Empty array for all concert data

  // Loops through each concert ID and gets the concert name category and date for the concert
  for (var i=0; i<concertIDs.length; i++) {
    
    // Variables to store concert info
    var concertName = search(concerts.getDataRange().getValues(), concertIDs[i], 0, 1);                             // Gets concert name
    var categoryID = search(concerts.getDataRange().getValues(), concertIDs[i], 0, 2);                              // Gets category ID 
    var concertCategory = search(categories.getDataRange().getValues(), categoryID, 0, 1);                          // Gets category name
    // Pushes JSON object with variable data to attendedConcerts Array
    attendedConcerts.push({                                                                                        
      'name': concertName,
      'category': concertCategory,
      'date': Utilities.formatDate(concertDates[i], "GMT+1", "MM/dd/yyyy")
    });
  
  };

  // Variables for output category HTML table
  var categoriesData = categories.getDataRange().getValues();
  var uniqueCategories = [];

  var categoriesDataF = true;
  // Fills uniqueCategories array with each category from ConcertCategory table
  categoriesData.forEach(row => {
    if (categoriesDataF) categoriesDataF = false;
    else {
      uniqueCategories.push({
        'id': row[0],
        'name': row[1],
        'num': 0,
        'req': "N/A"
      });
    }
  });

  var reqData = requirements.getDataRange().getValues();

  var reqDataF = true;
  reqData.forEach(row => {
    if (reqDataF) reqDataF = false;
    else {
      if (row[0] == semester) {
        uniqueCategories.forEach(cat => {
          if (cat.id == row[1]) cat.req = String(row[2]);
        })
      }
    }
  })

  var totalReq = 0;

  uniqueCategories.forEach(cat => {
    if (cat.req != 'N/A') totalReq += parseInt(cat.req);
  })

  if (totalReq === 0) totalReq = 'N/A';

  // If the concert category matches the uniqueCategories category, then the num value is incremented 
  attendedConcerts.forEach(concert => {
    uniqueCategories.forEach(category => {
      if (concert.category === category.name) category.num++;
    })
  });

  console.log(uniqueCategories);

  // Variable to store the total number of concerts attended
  var total = attendedConcerts.length;

  // Creates HTML template and fills it with data
  var html = HtmlService.createTemplateFromFile('Email');
  html.concerts = attendedConcerts;
  html.categories = uniqueCategories;
  html.studentName = studentName;
  html.total = total;
  html.totalReq = totalReq;
  var message = html.evaluate().getContent();

  // Sends email with HTML formatted body to student email
  MailApp.sendEmail({
    to: String(email),
    subject: "Concert Attendance Data",
    htmlBody: message
  });

  

}

/** Searches a column based on input variable from Google Sheets Table and returns a column as an array */
function search(data, searchInput, searchCol, returnCol) {                                                          
  var first = true;                                                                                                 // Variable to skip first row for headings
  var returnValue = 0;                                                                                              // Initializes return value as 0 or null
  data.forEach(row => {                                                                                             // Loops through each row in table to check for criteria
    if (!first) {                                                                                                   // If not the first row
      if (row[searchCol] == searchInput) returnValue = row[returnCol];                                             // If colum matches search criteria, then add return column value to return array
    } else first = false;                                                                                           // Sets first bool to false as it is now past the first row
  })
  return returnValue;
}

/** Searches two columns based on 2 input variables from Google Sheets Table and returns a column as an array */
function searchArry(data, searchInput1, searchInput2, searchCol1, searchCol2, returnCol) {
  var first = true;                                                                                                 // Variable to skip first row for headings
  var returnArry = [];                                                                                              // Initializes return array
  data.forEach(row => {                                                                                             // Loops through each row in table to check for criteria
    if (!first) {
      if (row[searchCol1] == searchInput1 && row[searchCol2] == searchInput2) returnArry.push(row[returnCol]);
    } else first = false;
  })
  return returnArry;
}
