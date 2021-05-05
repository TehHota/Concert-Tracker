function progressSearchToolButton() {

  // !!!UPDATE NAMES IF SHEET NAMES CHANGE!!! //
  const SEARCH_TOOL_SHEET = "Progress Search Tool";
  const STUDENTS_SHEET = "Students";
  const ATTENDANCE_SHEET = "Attendance";
  const CONCERTS_SHEET = "Concerts";
  const CONCERT_CATEGORY_SHEET = "ConcertCategories";
  const SEMESTER_SHEET = "Requirements"

  // Sheet contexts for each sheet in the Spreadsheet
  const mainSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SEARCH_TOOL_SHEET);
  const studentsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STUDENTS_SHEET);
  const attendanceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ATTENDANCE_SHEET);
  const concertsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONCERTS_SHEET);
  const concertCategorySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONCERT_CATEGORY_SHEET);
  const semesterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SEMESTER_SHEET);

  // Used to translate column numbers into corrosponding column character for A1 notation
  const alpha = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

  // This section is used to clear any non-input data in case something has been removed
  const numRows = mainSheet.getLastRow();
  const numCols = mainSheet.getLastColumn();

  // Clears any data found in the result columns
  if (numCols > 4) {
    const clearRangeString = "E2:" + alpha[numCols-1] + String(numRows);
    const clearRange = mainSheet.getRange(clearRangeString).clearContent();
  }

  // Early escape if a semester is not defined
  if(!mainSheet.getRange('B1').getValues()[0][0]) {
    SpreadsheetApp.getUi().alert("No valid semester selected. Please input a valid semester.");
    return;
  }

  // Get input data from sheet
  const inputData = mainSheet.getDataRange().getValues();

  // Early escape if there is no input data
  if (inputData.length <= 2) return;

  // Stores the selected semester
  const semester = inputData[0][1];

  // Converts input data array into a JSON array with only the students information
  var stuJSON = [];
  for (var x = 2; x < inputData.length; x++) {
    var student = {
      pos: null,
      found: false,
      id: null,
      firstName: null,
      lastName: null,
      email: null,
      concerts: [],
      categories: [],
      catTotal: 0
    }
    if (inputData[x][0]) {
      student.pos = x;
      student.id = inputData[x][0];
    }
    if (inputData[x][1]) {
      student.pos = x;
      student.email = inputData[x][1];
    }
    if (inputData[x][2]) {
      student.pos = x;
      student.lastName = inputData[x][2];
    }
    if (inputData[x][3]) {
      student.pos = x;
      student.firstName = inputData[x][3];
    }
    if (student.pos) stuJSON.push(student);
  }

  // Updates any missing student information in the stuJSON array with the info found in the students table
  const stuData = studentsSheet.getDataRange().getValues();
  for (var x=1; x<stuData.length; x++) {
    stuJSON.forEach(student => {
      if (student.found) return;
      if (student.id) {
        if (stuData[x][0] == student.id) {
          student.firstName = stuData[x][1];
          student.lastName = stuData[x][2];
          student.email = stuData[x][3];
          student.found = true;
        }
      } else if (student.email) {
        if (stuData[x][3] == student.email) {
          student.id = stuData[x][0];
          student.firstName = stuData[x][1];
          student.lastName = stuData[x][2];
          student.found = true;
        }
      } else if (student.lastName && student.firstName) {
        if (student.lastName == stuData[x][2] && student.firstName == stuData[x][1]) {
          student.id = stuData[x][0];
          student.email = stuData[x][3];
          student.found = true;
        }
      } else if (student.lastName) {
          if (student.lastName == stuData[x][2]) {
          student.id = stuData[x][0];
          student.firstName = stuData[x][1];
          student.email = stuData[x][3];
          student.found = true;
          }
      } else if (student.firstName) {
          if (student.firstName == stuData[x][1]) {
          student.id = stuData[x][0];
          student.lastName = stuData[x][2];
          student.email = stuData[x][3];
          student.found = true;
          } 
      }
    })
  }

  // Updates the stuJSON array with the list of categories, their names, and their IDs
  const catData = concertCategorySheet.getDataRange().getValues();
  var categories = [];
  for (var x=1; x<catData.length; x++) {
    stuJSON.forEach(student => {
      const cat = {
        id: catData[x][0],
        name: catData[x][1],
        value: 0,
        req: null
      }
      student.categories.push(cat);
    })
    categories.push(catData[x][1]);
  }

  // Updates the stuJSON array with the reuqirements for each category previously entered
  const reqData = semesterSheet.getDataRange().getValues();
  for (var x=1; x<reqData.length; x++) {
    if (reqData[x][0] == semester) {
      stuJSON.forEach(student => {
        student.categories.forEach(cat => {
          if (cat.id == reqData[x][1]) {
            cat.req = reqData[x][2];
          }
        })
      })
    }
  }

  // Updates the stuJSON array with the list of concerts the student has attended in the currently selected semester
  const attData = attendanceSheet.getDataRange().getValues();
  for (var x=1; x<attData.length; x++) {
    if (semester == attData[x][3]) {
      stuJSON.forEach(student => {
        if (student.id == attData[x][2]) {
          student.concerts.push(attData[x][1]);
        }
      })
    }
  }

  // Updates the stuJSON array with the total number of concerts each student has attended in each category
  const conData = concertsSheet.getDataRange().getValues();
  for (var x=1; x<conData.length; x++) {
    stuJSON.forEach(student => {
      student.concerts.forEach(concert => {
        if (concert == conData[x][0]) {
          student.categories.forEach(category => {
            if (category.id == conData[x][2]) {
              category.value++;
              student.catTotal++;
            }
          })
        }
      })
    })
  }

  // Empty array of arrays to store the final output
  var output = [];

  // Get the number of columns the output will contain. The plus 5 is to account for 5 pre-generated columns
  const outputColNum = 5+categories.length;

  // Creates a blank row with empty strings to match the number of columns of the region 
  var blankRow = []
  for (var x=0; x<outputColNum; x++) {
    blankRow.push("");
  }

  // Creates and pushes the Header row to the output array
  var firstRow = ["Student ID", "Email", "Last Name", "First Name"];
  categories.forEach(category => {
    firstRow.push(category);
  })
  firstRow.push(" Total ");
  output.push(firstRow);

  // Loops through each row based on the original region size and either fills the row with the student information or creates a blank row
  for (var x=2; x<=stuJSON[stuJSON.length-1].pos; x++) {
    var row = []
    stuJSON.forEach(student => {
      if (x === student.pos) {
        row.push(student.id);
        row.push(student.email);
        row.push(student.lastName);
        row.push(student.firstName);
        student.categories.forEach(category => {
          var value;
          if (category.req) value = String(category.value) + "/" + String(category.req);
          else value = String(category.value);
          row.push(value);
        })
        var total = String(student.catTotal);
        row.push(total);
      }
    })
    if (row.length === blankRow.length) output.push(row);
    else output.push(blankRow);
  }

  // Defines the output range and sets the range values to those set in the output array
  const outputRange = "A2:" + alpha[outputColNum-1] + String(stuJSON[stuJSON.length-1].pos+1);
  mainSheet.getRange(outputRange).setValues(output);

  // Resizes the category columns to their appropriate size
  for (var x=5; x<outputColNum+1; x++) {
    mainSheet.autoResizeColumn(x);
  }

}
