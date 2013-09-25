var baseServiceUrl = "/minium-webconsole/minium";

// utilities functions
var escapeHtml = function(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
};

var http = function($scope, $http) {
  if(!(this instanceof http)) {
      return new http($scope, $http);
  }

  this.get = function(url, params) {
    var fn = function() {
      return $http.get(baseServiceUrl + url, { params : params });
    };
    return $scope.$$phase ? fn() : $scope.$apply(fn);
  };
};

//
// Controllers
//

//
// WebConsoleCtrl
//
function WebConsoleCtrl($rootScope, $scope, $http, $location, promiseTracker) {
 

  // fix problem with bootstrap-modal
  var fixBootstrapModal = function() {
    $scope.$on("$viewContentLoaded", function() {
      console.debug("Removing .modal-dialog class because of https://github.com/jschr/bootstrap-modal/pull/164#issuecomment-24649686"); 
      $(".modal-dialog").removeClass("modal-dialog");
    });
  };

  // global tracker (responsible for displaying the global loading "spinner")
  var createGlobalTracker = function() {
    var tracker = promiseTracker("webconsole");

    var toggleLoading = function() { 
      $('body').modalmanager('loading');
    };
    tracker.on("start", toggleLoading);
    tracker.on("done",  toggleLoading);
    $rootScope.globalTracker = tracker;
  };

  var loadWebDrivers = function() {
    // Web drivers stuff
    $rootScope.webDriverTypes = {
      "Chrome"           : { displayName : "Chrome"            , shortDisplayName : "Chrome"    , glyphicon : "fontello-chrome"  },
      "Firefox"          : { displayName : "Firefox"           , shortDisplayName : "Firefox"   , glyphicon : "fontello-firefox" },
      "Safari"           : { displayName : "Safari"            , shortDisplayName : "Safari"    , glyphicon : "fontello-safari"  },
      "InternetExplorer" : { displayName : "Internet Explorer" , shortDisplayName : "IE"        , glyphicon : "fontello-ie"      },
      "Opera"            : { displayName : "Opera"             , shortDisplayName : "Opera"     , glyphicon : "fontello-opera"   },
      "PhantomJS"        : { displayName : "PhantomJS"         , shortDisplayName : "PhantomJS" , glyphicon : "fontello-browser" }
    };

    // $rootScope.webDrivers = [
    //   { "varName" : "wd"  , "type" : "Chrome" },
    //   { "varName" : "wd1" , "type" : "Chrome", "state" : "invalid" }
    // ];
    $rootScope.webDrivers = [];
    http($scope, $http).get("/webDrivers").success(function(data) {
        $rootScope.webDrivers = data;
    });
  };

  var configureEditor = function() {
    
    // Editor stuff
    var loadEditorPreferences = function (defaults) {
      var editorPreferences = $.cookie("editorPreferences");
      editorPreferences = editorPreferences ? JSON.parse(editorPreferences) : {};
      return $.extend({}, defaults, editorPreferences);
    };

    var configureEditor = function (editor, editorPreferences) {
      editor.setTheme(editorPreferences.theme);
      editor.setFontSize(editorPreferences.fontSize + "px");
      editor.getSession().setTabSize(editorPreferences.tabSize);
      editor.getSession().setUseSoftTabs(editorPreferences.softTabs);
    };

    var initEditor = function (preferences) {
      var editor = ace.edit("editor");
      editor.setShowPrintMargin(false);
      editor.getSession().setMode("ace/mode/javascript");
      editor.getSession().getScreenLength();

      configureEditor(editor, preferences);
      
      // commands
      var evalutate = function(editor) {
        var range = editor.getSelectionRange();
        var session = editor.getSession();

        var line = range.start.row;
        var code = range.isEmpty() ? session.getLine(line) : session.getTextRange(range);

        var request = http($scope, $http).get("/console/eval", { expr : code, lineno  : line + 1 }).success(function(data) {
          if (data.exceptionInfo) {
            console.error(data.exceptionInfo);
            $.bootstrapGrowl(data.exceptionInfo.message, { type: "danger" });
            if (data.lineNumber >= 0 && !data.sourceName) {
              var errors = [ { 
                row : data.lineNumber - 1,
                column : 0,
                text: data.exceptionInfo.message,
                type: "error"
              } ];
              editor.getSession().setAnnotations(errors);
            }
          }
          else if (data.size >= 0) {
            $.bootstrapGrowl(data.size + " matching web elements", { type: "success" });
          }
          else {
            $.bootstrapGrowl(data.value ? escapeHtml(data.value) : "No value", { type: "success" });
          }
        });

        $scope.globalTracker.addPromise(request);
      };

      var activateSelectorGadget = function(editor) {
        $scope.$apply(function() {
          $location.path("/selectorGadget/activate");
        });
      };

      editor.commands.addCommand({
        name: "evaluate",
        bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
        exec: evalutate,
        readOnly: false // should not apply in readOnly mode
      });
      editor.commands.addCommand({
        name: '',
        bindKey: { win: "Ctrl-Space", mac: "Command-Space" },
        exec: activateSelectorGadget,
        readOnly: false // should not apply in readOnly mode
      });
      
      editor.focus();

      return editor;
    };

    $rootScope.editorPreferences = loadEditorPreferences({
      theme    : "ace/theme/twilight",
      fontSize : 12,
      tabSize  : 2,
      softTabs : true
    });
    $rootScope.editor = initEditor($rootScope.editorPreferences);
    $rootScope.configureEditor = configureEditor; 
  };

  fixBootstrapModal();
  createGlobalTracker();
  loadWebDrivers();
  configureEditor();

  $scope.countWebDriversByType = function(typeId) {
    return $.grep($scope.webDrivers, function(webDriver) { return webDriver.type === typeId; }).length;
  };
}

//
// WebDriverCreateCtrl
//
function WebDriverCreateCtrl($rootScope, $scope, $http, $location, $routeParams) {
  var typeId = $routeParams.typeId;
  var dialog = $("#webdriver-create-dialog").one("hidden", function() {
    $scope.$apply(function() {
      $location.path("");
      editor.focus();
    });
  });

  $scope.type = $rootScope.webDriverTypes[typeId];
  $scope.varName = "";
  
  $scope.submit = function() {
    var varName = $scope.varName;

    var request = http($scope, $http).get("/webDrivers/" + varName + "/create", { type : typeId }).success(function() {
      $rootScope.webDrivers.push({ varName : varName, type : typeId, valid : true });
      
      // close modal
      dialog.modal("hide");

      $.bootstrapGrowl("Web driver <code>" + varName + "</code> created!", { type: "success" });
    });

    $rootScope.globalTracker.addPromise(request);
  };

  // now, let's show the dialog
  dialog.modal("show");
};

//
// WebDriverListCtrl
//
function WebDriverListCtrl($rootScope, $scope, $http, $location) {
  var dialog = $("#webdriver-list-dialog").one("hidden", function() {
    $scope.$apply(function() {
      $location.path("");
      editor.focus();
    });
  });
  var screenshotDialog = $("#webdriver-screenshot-dialog");

  $scope.removeWebDriver = function(varName) {
    var request = http($scope, $http).get("/webDrivers/" + varName + "/quit").success(function(data) {
      // remove from local list of webDrivers
      $rootScope.webDrivers = $.grep($rootScope.webDrivers, function(webDriver) { return webDriver.varName !== varName; });
      
      // close modal
      dialog.modal("hide");

      $.bootstrapGrowl("Web driver <code>" + varName + "</code> removed!", { type: "success" });
    });
    $rootScope.globalTracker.addPromise(request);
  };

  $scope.showScreenshot = function(varName) {
    $scope.selectedVarName = varName;
    $scope.refreshScreenshot();
    screenshotDialog.modal("show");
  };

  $scope.refreshScreenshot = function() {
    // we add a timestamp parameter to force image refresh
    $scope.screenshotUrl = baseServiceUrl + "/webDrivers/" + $scope.selectedVarName + "/screenshot?ts=" + new Date().getTime();
  };

  // now, let's show the dialog
  dialog.modal("show");
};

//
// EditorPreferencesCtrl
//
function EditorPreferencesCtrl($rootScope, $scope, $http, $location) {
  var dialog = $("#editor-preferences-dialog").one("hidden", function() {
    $scope.$apply(function() {
      $location.path("");
      editor.focus();
    });
  });

  $scope.model = angular.copy($rootScope.editorPreferences);
  $scope.submit = function() {
    // copy updated values to editorPreferences
    $rootScope.editorPreferences = angular.copy($scope.model);
    $rootScope.configureEditor($rootScope.editor, $rootScope.editorPreferences);

    $.cookie("editorPreferences", JSON.stringify($rootScope.editorPreferences), { expires : 365 * 5 });

    // close modal
    dialog.modal("hide");

    $.bootstrapGrowl("Editor preferences updated!", { type: "success" });
  };

  // now, let's show the dialog
  dialog.modal("show");
};

//
// SelectorGadgetCtrl
//
function SelectorGadgetCtrl($rootScope, $scope, $http, $location) {
  var editor = $rootScope.editor;
  var dialog = $("#selector-gadget-dialog").one("hidden", function() {
    $scope.$apply(function() {
      if (!$scope.accepted) {
        $scope.cancel();
      }
      $location.path("");
      editor.focus();
    });
  });

  var webDrivers = $rootScope.webDrivers;
  var varName = $rootScope.selectorGadgetVarName;

  if (!(varName && $.grep(webDrivers, function(webDriver) { return webDriver.varName = varName; }).length > 0)) {
    varName = $rootScope.selectorGadgetVarName = webDrivers && webDrivers.length > 0 ? webDrivers[0].varName : null;
  }

  if (!varName) {
    // this means we don't have web drivers
    return;
  }

  $scope.model = { varName : varName };

  var range = editor.getSelectionRange();
  var hidden = true;

  $scope.activate = function() {
    var varName = $scope.model.varName;
    var prevVarName = $rootScope.selectorGadgetVarName;
    
    var params = {};
    if (prevVarName && prevVarName !== varName) {
      params = { previousVar : prevVarName };
    }
    
    $rootScope.selectorGadgetVarName = varName;

    var request = http($scope, $http).get("/selectorGadget/" + varName + "/activate", params).success(function() {
      $.bootstrapGrowl("You can now select elements in <code>" + varName + "</code> window!", { type: "success" });
    });

    if (hidden) {
      var showDialog = function() {
        dialog.modal("show");
        $rootScope.globalTracker.off("done", showDialog);
      };
      $rootScope.globalTracker.on("done", showDialog);
    }
    
    $rootScope.globalTracker.addPromise(request);
  };

  $scope.accept = function() {
    var varName = $scope.model.varName;
    var request = http($scope, $http).get("/selectorGadget/" + varName + "/cssSelector").success(function(data) {

      var session = $rootScope.editor.getSession();
      var position = range.start;
      session.remove(range);
      session.insert(position, "$(" + varName + ", " + data + ")");

      // let's just indicate that selector gadget was accepted and therefore deactivated, so there is no need to deactivate it      
      $scope.accepted = true;

      // close modal
      dialog.modal("hide");

      $.bootstrapGrowl("Picked CSS selector is <code>" + data + "</code>!", { type: "success" });
    });
    $rootScope.globalTracker.addPromise(request);
  };

  $scope.cancel = function() {
    var varName = $scope.model.varName;
    var request = http($scope, $http).get("/selectorGadget/" + varName + "/deactivate").success(function(data) {
      // close modal
      dialog.modal("hide");
    });
    $rootScope.globalTracker.addPromise(request);
  };

  // let's activate
  $scope.activate();
};