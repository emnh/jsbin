var Jor1k = require("Jor1k");

function OnUploadFiles(files)
{
    for (var i = 0, f; f = files[i]; i++) {
        jor1kgui.UploadExternalFile(f);
    }
}

function RandomString(length) {
    var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

function Start() {

    var userid = RandomString(10);

    var MackeTerm = require("MackeTerm");

    jor1kparameters = {
        system: {
            kernelURL: "vmlinux.bin.bz2", // kernel image
            memorysize: 32, // in MB, must be a power of two
            cpu: "asm", // short name for the cpu to use
            ncores: 1,
        },
        fs: {
            basefsURL: "basefs.json", // json file with the basic filesystem configuration.
            extendedfsURL: "../../jor1k-sysroot/fs.json", // json file with extended filesystem informations. Loaded after the basic filesystem has been loaded.
            earlyload: [], // list of files which should be loaded immediately after they appear in the filesystem
            lazyloadimages: [
            ] // list of automatically loaded images after the basic filesystem has been loaded
	},

        term: new MackeTerm("tty"),             // canvas id for the terminal
        fbid: null,                // canvas id for the framebuffer
        clipboardid: "clipboard",  // input id for the clipboard
        statsid: "stats",          // object id for the statistics test
        fps: 10, // update interval of framebuffer
        relayURL: "ws://relay.widgetry.org/", // relay url for the network
        userid: userid, // unique user id string. Empty, choosen randomly, from a url, or from a cookie.
        syncURL: "http://jor1k.com/sync/upload.php", // url to sync a certain folder
        path: "/jor1k/bin/",
    }

    // --------------------------------------------------------
    // parse URL
    var loc = document.URL.split('?');
    userid = "";
    if (loc[1]) {
        var params = loc[1].split('&');
        for(var i=0; i<params.length; i++) {
            if (params[i].substr(0,4) == "user") {
                userid = params[i].split('=')[1];
                jor1kparameters.userid = userid;
                jor1kparameters.fs.lazyloadimages.push("http://jor1k.com/sync/tarballs/"+userid+".tar.bz2");
            }
            if (params[i].substr(0,3) == "cpu") {
                jor1kparameters.system.cpu = params[i].split('=')[1];
                if (jor1kparameters.system.cpu == "smp") {
                    console.log("Load smp kernel");
                    jor1kparameters.system.kernelURL = "bin/vmlinuxsmp.bin.bz2";
                    jor1kparameters.system.ncores = 4;
                }
            }
            if (params[i].substr(0,1) == "n") {
                jor1kparameters.system.ncores = params[i].split('=')[1];
            }
        }
    }
    /* don't mess with JSBin location parameters just yet
    if (userid == "") {
        if (loc[1])
              window.history.pushState([], "", location + "&user="+jor1kparameters.userid);
          else
              window.history.pushState([], "", location + "?user="+jor1kparameters.userid);
    }
    */

    // --------------------------------------------------------

    jor1kgui = new Jor1k(jor1kparameters);

    var readFile = (function(fileName) {
      function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
      }
      var report = (function(file) {
        console.log("read changed file: " + file.name);
        if (file !== null) {
          var uintArray = file.data;
          var encodedString = String.fromCharCode.apply(null, uintArray),
            decodedString = decodeURIComponent(escape(encodedString));
          decodedString = decodedString.replace(/\0/g, '');
          if (endsWith(file.name, "index.html")) {
            jsbin.panels.panels.html.setCode(decodedString);
            //jsbin.panels.panels.html.editor.getDoc().setValue(decodedString);
          } else if (endsWith(file.name, "index.css")) {
            jsbin.panels.panels.css.setCode(decodedString);
            //jsbin.panels.panels.css.editor.getDoc().setValue(decodedString);
          } else if (endsWith(file.name, "index.js")) {
            jsbin.panels.panels.javascript.setCode(decodedString);
            //jsbin.panels.panels.javascript.editor.getDoc().setValue(decodedString);
          }
        }
      });
      jor1kgui.ReadFile(fileName, report);
    });

    function loadFiles() {
        var html = window.jsbin.panels.panels.html.getCode();
        var css = window.jsbin.panels.panels.css.getCode();
        var js = window.jsbin.panels.panels.javascript.getCode();
        //var html = window.jsbin.panels.panels.html.editor.getDoc().getValue();
        //var css = window.jsbin.panels.panels.css.editor.getDoc().getValue();
        //var js = window.jsbin.panels.panels.javascript.editor.getDoc().getValue();
        jor1kgui.MergeFile("index.html", html);
        jor1kgui.MergeFile("index.css", css);
        jor1kgui.MergeFile("index.js", js);
        window.jsbin.panels.panels.html.editor.on("inputRead", function(change) {
          //var data = window.jsbin.panels.panels.html.editor.getDoc().getValue();
          var data = window.jsbin.panels.panels.html.getCode();
          jor1kgui.MergeFile("index.html", data);
        });
        window.jsbin.panels.panels.css.editor.on("inputRead", function(change) {
          var data = window.jsbin.panels.panels.css.getCode();
          jor1kgui.MergeFile("index.css", data);
        });
        window.jsbin.panels.panels.javascript.editor.on("inputRead", function(change) {
          var data = window.jsbin.panels.panels.javascript.getCode();
          jor1kgui.MergeFile("index.js", data);
        });
    }

    var startWatching = (function() {
        console.log("start watching");
        var watcher = (function(file) {
          readFile(file.name);
        });
        jor1kgui.WatchFile("index.html", readFile);
        jor1kgui.WatchFile("index.css", readFile);
        jor1kgui.WatchFile("index.js", readFile);
    });

    setTimeout(loadFiles, 1000); // TODO: on change
    startWatching();
}
$(Start);
