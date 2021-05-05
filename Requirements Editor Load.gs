function loadRequirementsButton() {

  // !!!UPDATE NAMES IF SHEET NAMES CHANGE!!! //
  const REQUIREMENTS_EDITOR_SHEET_NAME = "Requirements Editor";
  const REQUIREMENTS_SHEET_NAME = "Requirements";
  const CATEGORY_SHEET_NAME = "ConcertCategories";


  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const requirementsEditor = sheet.getSheetByName(REQUIREMENTS_EDITOR_SHEET_NAME);
  const requirements = sheet.getSheetByName(REQUIREMENTS_SHEET_NAME);
  const categories = sheet.getSheetByName(CATEGORY_SHEET_NAME);

  const semData = requirementsEditor.getRange("A2:B2").getValues();
  const sem = semData[0][1] + " " + semData[0][0];

  const catData = categories.getDataRange().getValues();
  var catJSON = [];
  
  var cataDataF = true;
  catData.forEach(row => {
    if (cataDataF) cataDataF = false;
    else {
      catJSON.push({
        'id': row[0],
        'name': row[1],
        'value': 0 
      })
    }
  })
  const reqData = requirements.getDataRange().getValues();
  
  var reqDataF = true;
  reqData.forEach(row => {
    if (reqDataF) reqDataF = false;
    else {
      if (row[0].toLowerCase() == sem.toLowerCase()) {
        catJSON.forEach(cat => {
          if (cat.id == row[1]) cat.value = row[2];
        });
      };
    };
  });

  var insertData = [];

  catJSON.forEach(cat => {
    insertData.push([cat.name, cat.value]);
  })

  for (var x = 0; x < 20; x++) {
    if (x >= catJSON.length) insertData.push([null,null]);
  }

  requirementsEditor.getRange('A5:B24').clearContent();
  requirementsEditor.getRange('A5:B24').setValues(insertData);

}
