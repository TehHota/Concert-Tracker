function saveRequirementsButton() {
  
  // !!!UPDATE NAMES IF SHEET NAMES CHANGE!!! //
  const REQUIREMENTS_EDITOR_SHEET_NAME = "Requirements Editor";
  const REQUIREMENTS_SHEET_NAME = "Requirements";
  const CATEGORY_SHEET_NAME = "ConcertCategories";


  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const requirementsEditor = sheet.getSheetByName(REQUIREMENTS_EDITOR_SHEET_NAME);
  const requirements = sheet.getSheetByName(REQUIREMENTS_SHEET_NAME);
  const categories = sheet.getSheetByName(CATEGORY_SHEET_NAME);

  const reqEData = requirementsEditor.getRange("A5:B24").getValues();
  var reqJSON = [];

  reqEData.forEach(row => {
    if (row[0] != '') reqJSON.push({
      'id': null,
      'name': row[0],
      'value': row[1],
      'row': null,
      'add': true
    })
  })

  const semData = requirementsEditor.getRange("A2:B2").getValues();
  const sem = semData[0][1] + " " + semData[0][0];

  const catData = categories.getDataRange().getValues();

  var catDataF = true;
  catData.forEach(row => {
    if (catDataF) {
      catDataF = false;
    }
    else {
      reqJSON.forEach(cat => {
        if (cat.name == row[1]) cat.id = row[0];
      })
    }
  })

  const reqData = requirements.getDataRange().getValues();

  for (var x = 0; x < reqData.length; x++) {
    if (x>0) {  
      if (reqData[x][0] == sem) {
        reqJSON.forEach(cat => {
          if (cat.id == reqData[x][1]) {
            reqData[x][2] = cat.value; 
            cat.add = false;
          }
        })
      }
    }
  }

  requirements.getDataRange().setValues(reqData);
  
  reqJSON.forEach(cat => {
    console.log(cat);
    if (cat.add) requirements.appendRow([sem, cat.id, cat.value]);
  })

}
