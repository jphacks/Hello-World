(function () {
  function forEach(arr, f) {
    for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
  }

  function arrayContains(arr, item) {
    if (!Array.prototype.indexOf) {
      var i = arr.length;
      while (i--) {
        if (arr[i] === item) {
          return true;
        }
      }
      return false;
    }
    return arr.indexOf(item) != -1;
  }

  function scriptHint(editor, _keywords, getToken) {
    // Find the token at the cursor
    var cur = editor.getCursor(), token = getToken(editor, cur), tprop = token;
    // If it's not a 'word-style' token, ignore the token.

    if (!/^[\w$_]*$/.test(token.string)) {
        token = tprop = {start: cur.ch, end: cur.ch, string: "", state: token.state,
                         className: token.string == ":" ? "ruby-type" : null};
    }

    if (!context) var context = [];
    context.push(tprop);

    var completionList = getCompletions(token, context);
    completionList = completionList.sort();
    //prevent autocomplete for last word, instead show dropdown with one word
    if(completionList.length == 1) {
      completionList.push(" ");
    }

    return {list: completionList,
            from: CodeMirror.Pos(cur.line, token.start),
            to: CodeMirror.Pos(cur.line, token.end)};
  }

  CodeMirror.rubyHint = function(editor) {
    return scriptHint(editor, rubyKeywordsU, function (e, cur) {return e.getTokenAt(cur);});
  };

  var rubyKeywords = "BEGIN END if elsif else unless case when then begin end rescue"
	+ "retry ensure for while until do break redo next in return true false nil self"
	+ "__FILE__ __LINE__ and or not class def alias undef module defined? super yield";
  var rubyKeywordsL = rubyKeywords.split(" ");
  var rubyKeywordsU = rubyKeywords.toUpperCase().split(" ");

  var rubyBuiltins = ".new casecmp center chomp chomp! chop chop! chr clear codepoints concat"
	+ "count crypt delete delete! downcase downcase! dump each_line empty? encode encoding"
	+ "eql? force_encoding getbyte gsub gsub! hash hex include? index insert inspect intern"
	+ "inspect intern length lines ljust lstrip lstrip! match next next! oct ord" 
	+ "partition replace reverse reverse! rindex rjust rpartition rstrip rstrip!"
	+ "scan setbyte size slice slice! split squeeze squeeze! start_with? strip strip!"
	+ "sub sub! succ succ! sum swapcase swapcase! to_f to_i to_s to_str to_sym"
	+ "tr tr! tr_s tr_s! unpack upcase upcase! upto valid_encoding?"
	+ "induced_from chr downto even? floor integer? next odd? ord pred round "
	+ "singleton_method_added succ times to_i to_int truncate upto puts rand"
  var rubyBuiltinsL = rubyBuiltins.split(" ").join(" .").split(" ");
  var rubyBuiltinsU = rubyBuiltins.toUpperCase().split(" ").join(" .").split(" ");

  function getCompletions(token, context) {
    var found = [], start = token.string;
    function maybeAdd(str) {
      if (str.indexOf(start) == 0 && !arrayContains(found, str)) found.push(str);
    }

    function gatherCompletions(_obj) {
        forEach(rubyBuiltinsL, maybeAdd);
        forEach(rubyBuiltinsU, maybeAdd);
        forEach(rubyKeywordsL, maybeAdd);
        forEach(rubyKeywordsU, maybeAdd);
    }

    if (context) {
      // If this is a property, see if it belongs to some object we can
      // find in the current environment.
      var obj = context.pop(), base;

      if (obj.type == "variable")
          base = obj.string;
      else if(obj.type == "variable-3")
          base = ":" + obj.string;

      while (base != null && context.length)
        base = base[context.pop().string];
      if (base != null) gatherCompletions(base);
    }
    return found;
  }
})();
