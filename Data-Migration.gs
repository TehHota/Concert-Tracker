function main() {

  // !!!UPDATE FOLDER IDs IF FOLDER IS DELETED OR CREATED!!! //
  const UPLOAD_FOLDER_ID = "15-WAsHcEKrqY9dZfjQFrR8pqA2OI3Huq";
  const ARCHIVE_FOLDER_ID = "1YmOrbTnamGF8GPGPPIuAHLpbixWy3RIt";
  const DUPLICATE_FOLDER_ID = "1Uegd_Ch9meVACL3pfy4fqVzjL4O9L7lX";
  
  // !!!UPDATE NAMES IF SHEET NAMES CHANGE!!! //
  const CATEGORY_SHEET_NAME = "ConcertCategories";
  const CONCERTS_SHEET_NAME = "Concerts";
  const STUDENTS_SHEET_NAME = "Students";
  const ATTENDANCE_SHEET_NAME = "Attendance";

  var csvs = new Map()
  // Gets all files of type csv in Upload Folder
  const uploadFolder = DriveApp.getFolderById(UPLOAD_FOLDER_ID); 
  var files = uploadFolder.getFilesByType("text/csv");

  // Array to store fileNames that were uploaded to email
  var email = [];

  const categories = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CATEGORY_SHEET_NAME).getDataRange().getValues();

  // Iterates through csv files
  while (files.hasNext()) {
    // Gets the specific file context
    var file = files.next();
    // Stores the filename in the email array
    email.push(file.getName());
    // If it has GeneratedData.csv and has not already been added to the map, add it to the map
    if (!csvs.has(file.getName())) {
      // Checks if the file name is a valid category
      var validCategory = false;
      for (var x = 1; x<categories.length; x++) {
        if (file.getName().includes(categories[x][2])) validCategory = true;
      }
      if (validCategory) {
        Logger.log(file.getName())
        var fileName = file.getName()
        // Make map entry: [fileName : fileID]
        csvs.set(fileName, file.getId())
        // Get blob from fileID
        var blob = getBlob(csvs.get(fileName))
        // Convert blob to array
        var contents = getArray(blob)
        // Get concert info by parsing the fileName
        var newFile = true;
        var concertInfo = getConcertInfo(fileName, CATEGORY_SHEET_NAME);
        var concertString = concertInfo[0] + concertInfo[1] + concertInfo[2]
        var concertHash = concertString.hashCode()
        var concerts = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONCERTS_SHEET_NAME).getDataRange().getValues();
        for (var x = 0; x<concerts.length; x++) {
          if (concertHash == concerts[x][3]) newFile = false;
        }
        writeDataToSheet(contents, concertInfo, CONCERTS_SHEET_NAME, STUDENTS_SHEET_NAME,ATTENDANCE_SHEET_NAME);
        if (newFile) moveFile(file, ARCHIVE_FOLDER_ID);
        else moveFile(file, DUPLICATE_FOLDER_ID);
      }
    } else moveFile(file, DUPLICATE_FOLDER_ID);
  }
}

// Moves file to the designated folder
function moveFile(file, folderID) {
  if (folderID) {
    var folder = DriveApp.getFolderById(folderID);
    file.moveTo(folder);
  }
}

// Gets csv file data as a string
function getBlob(id) {
  var contents = DriveApp.getFileById(id).getBlob().getDataAsString();
  return contents
}

// Get string file data as an array
function getArray(blob) {
  var array = Utilities.parseCsv(blob)
  return array
}


function getConcertInfo(fileName, CATEGORY_SHEET_NAME) {

  const categories = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CATEGORY_SHEET_NAME).getDataRange().getValues();

  var date = fileName.substring(
    fileName.lastIndexOf("_") + 1, 
    fileName.lastIndexOf(".csv")
  );
  var nameMinusDate = fileName.replace("_" + date + ".csv", "");
  var n = nameMinusDate.lastIndexOf("-");
  var instrument = nameMinusDate.substring(n+1);
  var categoryAndArtist = nameMinusDate.replace("-" + instrument, "");
  // Loops through each category found in the categories sheet
  var artist = ""
  for (var x=1; x<categories.length; x++) {
    if (categoryAndArtist.includes(categories[x][2])) {
      var category = categories[x][0];
      artist = categoryAndArtist.replace(categories[x][2] + "-", "")
    }
  }
  if (artist.length < 3) {
    artist = "Student Recital"
  }
  artist = artist.replace(/-/g, " ")
  if (artist == "Student Recital") {
      category = "2"
  }
  var concertInfo = [category, artist, date]
  return concertInfo;
}

function writeDataToSheet(data, concertInfo, CONCERTS_SHEET_NAME, STUDENTS_SHEET_NAME, ATTENDANCE_SHEET_NAME) {


  data.shift()
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var concerts = ss.getSheetByName(CONCERTS_SHEET_NAME)
  var students = ss.getSheetByName(STUDENTS_SHEET_NAME)
  var attendance = ss.getSheetByName(ATTENDANCE_SHEET_NAME)
  // Make sure concert hasn't already been logged
  var concertString = concertInfo[0] + concertInfo[1] + concertInfo[2]
  concertHash = concertString.hashCode()
  var concertRange = concerts.getDataRange()
  var concertFinder = concertRange.createTextFinder(concertHash)
  var concertOccurrences = concertFinder.findAll().map(x => x.getA1Notation())
  // If concert has not yet been logged, ingest
  if (concertOccurrences.length == 0) {
    concertID = concertRange.getValues().length
    concerts.appendRow([concertID, concertInfo[1],concertInfo[0], concertHash])
      var studentRange = students.getDataRange();
      for (x in data) {
        var studentID = data[x][2]
        var firstName = data[x][0]
        var lastName = data[x][1]
        var email = data[x][3]
        email = email.toLowerCase()
        var checkin = data[x][4]
        checkin = checkin.slice(0, -5)
        var idFinder = studentRange.createTextFinder(studentID)
        var occurrences = idFinder.findAll().map(x => x.getA1Notation())
        if (occurrences.length == 0) {
          students.appendRow([studentID,firstName,lastName,email])
        }
        var month = checkin.split('/')[0];
        // var month = checkin.charAt(0)
        var year = checkin.substring(
          checkin.lastIndexOf("/") + 1, 
          checkin.lastIndexOf(" ")
        );
        var semester
        if (month < 7) {
          semester = "Spring"
        } else if (month > 7) {
          semester = "Fall"
        }
        semester = semester + " " + year
        attendance.appendRow([checkin, concertID, studentID, semester])
      }
  }
}

String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};
