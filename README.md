spreadSheetDB
=============
This library is use to save the clinet-side data into google spread sheet.



Live Demo
=============
[Demo Survey (Static Page) ]<br/>
https://gc.digitalriver.com/store/rivtw011/static/file.easysurvey_demo


[Data report to Google Doc ]<br/>
https://docs.google.com/spreadsheet/ccc?key=0AtB7rOkgel61dG9fb3I0OXNWUm9fRUlzdlpRa0RKeEE#gid=0



How to Use:
=============
  1. Create a google account.
  2. Create a google form via goole document.
  3. Add some customize columns ( all column type should be text box)

  4. Then you will got an automatically generated form as below link.      
      ex: https://docs.google.com/spreadsheet/viewform?formkey=dG9fb3I0OXNWUm9fRUlzdlpRa0RKeEE6MQ

  5. Record the following information
      a. Form Key on the url. sample: dG9fb3I0OXNWUm9fRUlzdlpRa0RKeEE6MQ
      b. Columns Names. sample: Score, Feedback

  6. Sample code will like below:      
<pre>
      var sheet = new SpreadSheetDB('dG9fb3I0OXNWUm9fRUlzdlpRa0RKeEE6MQ') // initial the object with form key.
        .start(function() { 
          var row = sheet.newRow(); // create new row.
          row.Score = '100';        // assign data to the customize column.
          row.Feedback = 'kukuku';
          row.submit(function(result) { if (result.success) { alert('Saved!!'); }} ); // save the data.
        });
</pre>

Restrictions:
  * IE 8, 9: The page should be used in "https" protocol
  * IE 7 (and lower): Do not supported
  
