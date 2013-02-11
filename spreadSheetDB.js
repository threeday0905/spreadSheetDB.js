/* 
 *  Plugin Name: spreadSheetDB v1.1.5
 *  Author: Herman Lee
 *  Description: Save client-side data into Google Spreadsheet
 *  Restrictions:
 *    IE 8, 9: Need to use in https protocol
 *    IE 7 (and lower): Do not supported
 *    Firefox 2.0 (and lower): Do not support
 */

(function($, window) {
  'use strict';
  var SpreadSheetDB = function(key) {    
    var main = this,
    
    // B: Private Classes
    SpreadSheetColumn,
    SpreadSheetRowData,
    // E: Private Classes
    
    // B: Private Properties 
    setting = { 
      defVal: 'N/A',
      formUrl: 'https://docs.google.com/spreadsheet/viewform?formkey={0}',
      submitUrl: 'https://docs.google.com/spreadsheet/formResponse?formkey={0}',
      formReg: /<div class="ss-form-entry"><label class="ss-q-title" for=".*">([^\n]*)[\s\S]*?<input type="text" name="([^"]*?)" .* id="([^"]*?)">/gm,
      formRegCheck: function(result) {
        return (result && result.length && result.length >= 4 && result[1].length && result[2].length && result[3].length);
      }
    },
    
    pvtProp = {
      html: '',
      formKey : key,
      formUrl : setting.formUrl.replace(/\{0\}/, key),
      submitUrl : setting.submitUrl.replace(/\{0\}/, key),
      columns: [],
      start: undefined
    },
    // E: Private Properties

    // B: Private Methods 
    ajax = function(url, callback, options) {
      if (url && url.length) {
        var 
          link = (url || '').replace( /#.*$/, '').replace(/^\/\//, window.location.protocol),
          opts = options || {},
          fns = callback || {},
          crossDomain = (url.lastIndexOf( window.location.protocol + '//' + window.location.host + '/') === -1),
          xdomain = false,
          xhr = (function() {
            var xhrObj;
            if (crossDomain) {
              if ( window.XMLHttpRequest && ( "withCredentials" in new XMLHttpRequest() ) )  {
                xhrObj = new window.XMLHttpRequest();
              } else if ( window.XDomainRequest) {
                xdomain = true;
                xhrObj = new window.XDomainRequest();
              }
            } else {
              if (window.XMLHttpRequest) {
                xhrObj = new window.XMLHttpRequest();
              } else if (window.ActiveXObject){
                try { xhrObj = new window.ActiveXObject("Microsoft.XMLHTTP"); }
                catch(e){  }
              }
            }
            return xhrObj;
          }()),
          data = (function(data) {
            if (!data) { return null; }
            var key, result = [];
            for ( key in data) {
              if (data.hasOwnProperty(key) && data[key]) {
                switch(typeof (data[key])) {
                  case 'number':
                  case 'string':
                  case 'boolean':
                    result.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
                    break;
                }
              }
            }
            return result.join('&').replace(/%20/g, '+');
          }(opts.data || {}));
      
        if (xhr) { 
          if (opts.type !== 'POST') { opts.type = 'GET'; }          
          if ( ( xdomain || opts.dataToURL) && data.length) {
            link += ((/\?/).test(url) ? "&" : "?") + data;
          }
          
          if (opts.cache !== true) {
           link += ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime();
          }
          
          xhr.open(opts.type, link, (opts.async === undefined) ? true : !!opts.async );
          
          if (!xdomain) {
            xhr.setRequestHeader('Accept', '*/*');
            if (opts.type === 'POST') {
              xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }
          }

          if (typeof fns.beforeSend === 'function') {
            fns.beforeSend(xhr);
          }

          xhr.send(data);
          
          if (xdomain) {
            xhr.ontimeout = xhr.onerror = function() {
              if (typeof fns.error === 'function') { fns.error(xhr, xhr.statusText); }
              if (typeof fns.complete === 'function') { fns.complete(xhr, xhr.statusText); }
            };
            xhr.onload = function() {
              if (typeof fns.success === 'function') { fns.success(xhr.responseText, xhr.statusText, xhr); }
              if (typeof fns.complete === 'function') { fns.complete(xhr, xhr.statusText); }
            };
          } else {
            xhr.onreadystatechange = function() {
              if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                  if (typeof fns.success === 'function') { fns.success(xhr.responseText, xhr.statusText, xhr); }
                } else {
                  if (typeof fns.error === 'function') { fns.error(xhr, xhr.statusText); }
                }
                if (typeof fns.complete === 'function') { fns.complete(xhr, xhr.statusText); }
              }
            };
            if ( opts.async === false ) {
              xhr.onreadystatechange();
            } 
          }
        }
      }
    },
    
    init = function() {
      ajax(pvtProp.formUrl, {
        success: function(data) {
          var arr, i, len, tmpObj;
          
          arr = (function(reg, text) {
            var result, output = [];
            if (!reg.global && (result = reg.exec(text)) !== null) {
              output.push(result);
            } else {
              while ((result = reg.exec(text)) !== null)  {
                output.push( result );
              }
            }
            return output;          
          }(setting.formReg, data));
          
          pvtProp.columns = [];
          for (i = 0, len = arr.length; i < len; i += 1) {
            tmpObj = arr[i];
            if (setting.formRegCheck(tmpObj)) {
              pvtProp.columns.push( new SpreadSheetColumn(tmpObj[1], tmpObj[3], tmpObj[2], 'text'));
            }
          }
          pvtProp.html = data;
          if (pvtProp.start && typeof pvtProp.start === 'function') {
            pvtProp.start.call(main);
            pvtProp.start = function() { return main; };
          }
        }
      });
    },
    
    submitRow = function(row, done) {
      var data = {}, i, len, obj, columns = pvtProp.columns || [];
      if (columns.length) {
        for ( i = 0, len = columns.length; i < len; i += 1) {
          obj = columns[i];
          data[obj.name] = row[obj.title] || setting.defVal;
        }

        ajax( pvtProp.submitUrl, {
          success: function() { row.success = true; },
          error: function() { row.success = false; },
          complete: function() {
            delete row.submit; 
            if (typeof done === 'function') { done.call(row, { success: row.success } ); }
          }          
        }, {
          type: 'GET', 
          dataToURL: true,
          data: data
        });
      }
    },
    // E: Private Methods
    
    // B: Public Methods
    getHtml = function() {
      return pvtProp.html;
    },
    newRow = function() {
      return new SpreadSheetRowData(main);
    },
    start = function(callback) {
      pvtProp.start = callback;
      return main;
    };
    // E: Public Methods

    SpreadSheetColumn = function(title, id, name, type) {
      this.title = title;
      this.id = id;
      this.name = name;
      this.type = type;
    };
    
    SpreadSheetRowData = function() {
      var row = this,
          i, len, columns = pvtProp.columns;
      for (i = 0, len = columns.length; i < len; i += 1) {
        this[columns[i].title] = '';
      }
      this.submit = function(done) { submitRow(row, done); };
    };

    this.getHtml = getHtml;
    this.newRow = newRow;
    this.start = start;
    this.available = !!SpreadSheetDB.available;
    if (this.available) {
      init();
    } else {
      //alert('your browser does not support cross site request');
    }
  };
  
  //SpreadSheetDB.available = (function() { return (/(MSIE [6|7])|(Firefox\/3\.0)/i.test(navigator.userAgent) || (/MSIE [8|9]/i.test(navigator.userAgent) && /http:/i.test(location.protocol)) ); }());
  
  SpreadSheetDB.available = (function() { return (!!window.XMLHttpRequest && ( "withCredentials" in new XMLHttpRequest() )  || (!!window.XDomainRequest ) && /https:/i.test(location.protocol) ); }());
  
  window.SpreadSheetDB = SpreadSheetDB;
  
}(jQuery, window));