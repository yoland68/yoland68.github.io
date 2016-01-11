// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = '894914975362-qfountnanpurki2sjl85l2145hk2aur8.apps.googleusercontent.com';

var TITLES = ["test", "test_name", "df_type", "crbug_id", "owner", "result"];

var FILE_PATH = "file_path";

var BUG_ID = "crbug_id";

var SIGN_UP = "Sign up";

var SCOPES = ['https://www.googleapis.com/auth/drive'];

var PRIMARY_COLOR = "mdl-color-text--cyan";

var SPREADSHEET_LINK = "https://docs.google.com/spreadsheets/d/1ADSMGJKX5I_EzL8j5SwOTaLrPz8WRPAzm065vgcrny0/edit#gid=0";

var CHROMIUM_LINK = "https://code.google.com/p/chromium/codesearch#chromium/src/";

var lineChartData = {
			labels : ["1/06","12 PM", "4 PM", "8 PM", "1/07", "","","", "1/08", "", "", "", "1/11", "", "", "", "1/12", "", "", "", "1/13", "", "", "", "1/14", "", "", "", "1/15", "","","", ],
			datasets : [
				{
					label: "total",
					fillColor : "rgba(220,220,220,0.2)",
					strokeColor : "rgba(220,220,220,1)",
					pointColor : "rgba(220,220,220,1)",
					pointStrokeColor : "#fff",
					pointHighlightFill : "#fff",
					pointHighlightStroke : "rgba(220,220,220,1)",
					data : []
				},
				{
					label: "fixed",
					fillColor : "rgba(151,187,205,0.2)",
					strokeColor : "rgba(148,156,132,1)",
					pointColor : "rgba(100,162,117,1)",
					pointStrokeColor : "#fff",
					pointHighlightFill : "#fff",
					pointHighlightStroke : "rgba(151,187,205,1)",
					data : []
				},
        {
					label: "signup",
					fillColor : "rgba(151,187,205,0.2)",
					strokeColor : "rgba(151,187,205,1)",
					pointColor : "rgba(151,187,205,1)",
					pointStrokeColor : "#fff",
					pointHighlightFill : "#fff",
					pointHighlightStroke : "rgba(151,187,205,1)",
					data : []
				}
			]
}




/**
 * Check if current user has authorized this application.
 */
function checkAuth() {
  gapi.auth.authorize(
    {
      'client_id': CLIENT_ID,
      'scope': SCOPES.join(' '),
      'immediate': true
    }, handleAuthResult);
}

/**
 * Handle response from authorization server.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
  var authorizeDiv = document.getElementById('authorize-div');
  if (authResult && !authResult.error) {
    // Hide auth UI, then load client library.
    authorizeDiv.style.display = 'none';
    callScriptFunction("chart", true);
    callScriptFunction("table", true);
  } else {
    // Show auth UI, allowing the user to initiate authorization by
    // clicking authorize button.
    authorizeDiv.style.display = 'inline';
  }
}

/**
 * Initiate auth flow in response to user clicking authorize button.
 *
 * @param {Event} event Button click event.
 */
function handleAuthClick(event) {
  gapi.auth.authorize(
    {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
    handleAuthResult);
  return false;
}

/**
 * Calls an Apps Script function to list the folders in the user's
 * root Drive folder.
 */
function callScriptFunction(info, initialize) {
  var scriptId = "MCxCi-FUNYsHfTipD3FnKkZxeXXwTpFvz";

  // Create an execution request object.
  var requests = {
      'chart': {'function': 'getCountInfo'},
      'table': {'function': 'getSheetInfoJson'}
      };

  // Make the API request.
  var op = gapi.client.request({
      'root': 'https://script.googleapis.com',
      'path': 'v1/scripts/' + scriptId + ':run',
      'method': 'POST',
      'body': requests[info]
  });

  op.execute(function(resp) {
    if (resp.error && resp.error.status) {
      // The API encountered a problem before the script
      // started executing.
      appendError('Error calling API:');
      appendError(JSON.stringify(resp, null, 2));
    } else if (resp.error) {
      // The API executed, but the script returned an error.

      // Extract the first (and only) set of error details.
      // The values of this object are the script's 'errorMessage' and
      // 'errorType', and an array of stack trace elements.
      var error = resp.error.details[0];
      appendError('Script error message: ' + error.errorMessage);

      if (error.scriptStackTraceElements) {
        // There may not be a stacktrace if the script didn't start
        // executing.
        appendError('Script error stacktrace:');
        for (var i = 0; i < error.scriptStackTraceElements.length; i++) {
          var trace = error.scriptStackTraceElements[i];
          appendError('\t' + trace.function + ':' + trace.lineNumber);
        }
      }
    } else {
      // The structure of the result will depend upon what the Apps
      // Script function returns. Here, the function returns an Apps
      // Script Object with String keys and values, and so the result
      // is treated as a JavaScript object (folderSet).
      var respObj = resp.response.result;
      if (respObj.length == 0) {
          appendTable('No result returned for' + info + '!');
      } else {
        if (info == 'table'){
          if (initialize){
            createTable(respObj);
          } else {
            updateTable(respObj);
          }
        } else if (info == 'chart'){
          if (initialize){
            createChart(respObj);
          } else {
            console.log(1);
            updateChart(respObj);
          }
        } else {
          throw Error("Invalid info argument: " + info);
        }
      }
    }
  });
}

/**
 * Respond obj format as such
 * {'total': [1,2 3,4,5],'fixed':[1,2,3,4,5], 'signup':[1,2,3,4,5]}
 */
function createChart(respObj){
  lineChartData.datasets[0].data = respObj.total;
  lineChartData.datasets[1].data = respObj.fixed;
  lineChartData.datasets[2].data = respObj.signup;
  
	$(function(){
    var ctx = document.getElementById("canvas").getContext("2d");
    window.dfTestChart = new Chart(ctx).Line(lineChartData, {
      responsive: true
    });
  });
}

function updateChart(respObj){
  var labels = Object.keys(respObj);
  for(var i = 0; i < labels.length; i++) {
    var label = labels[i];
    if (respObj[label].length != window.dfTestChart.datasets[i].points.length){
      createTable(respObj);
      return;
    } else {
      var len = respObj[label].length;
      window.dfTestChart.datasets[i].points[len-1].value = respObj[label][len-1];
    }
  }
  window.dfTestChart.update();
}

function updateTable(respObj){
  $("tbody#buglist").empty();
  createTable(respObj);
}

function createTable(respObj) {
  for (var i = 0; i < respObj.results.length; i++) {
    result = respObj.results[i];
    var table = document.getElementById("buglist");
    var newRow = document.createElement("tr");
    var rowHtml = "";
    TITLES.forEach(function(id){
        switch (id) {
            case 'test_name':
                var link = CHROMIUM_LINK + result[FILE_PATH] + "&q=" + result[id];
                rowHtml += formCell(formATag(link, result[id], PRIMARY_COLOR));
                break;
            case 'crbug_id':
                var link = "https://crbug.com/" + result[id];
                rowHtml += formCell(formATag(link, result[id], PRIMARY_COLOR));
                break;
            case 'result':
                if (result[id] == SIGN_UP) {
                    rowHtml += formCell(formATag(SPREADSHEET_LINK, result[id], ""));
                } else {
                    rowHtml += formCell(result[id]);
                }
                break;
            default:
                rowHtml += formCell(result[id]);
        }
    });
    newRow.innerHTML = rowHtml;
    table.appendChild(newRow);
  }
}

function formCell(html) {
    return "<td>" + html + "</td>";
}

function formATag(link, html, tagClass) {
    return '<a class="' + tagClass + '" href="' + link + '">' + html + '</a>';
}

function appendError(errorMessage) {
    var errorSection = document.getElementById("error");
    errorSection.appendChild(document.createTextNode(errorMessage));
}


