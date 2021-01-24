'use strict';
/** @type {!Array} */
var _0x2a1c = ["#MM#", "#M#", "#DDDD#", "#DDD#", "#D#", "#th#", "getHours", "toUpperCase", "getMinutes", "#hhhh#", "#hh#", "#h#", "#mm#", "#m#", "#ss#", "#ampm#", "#AMPM#", "forEach", "$2/$1/20$3", "getTime", "push", "apply", "splice", "split", "shift", "#mon input[alt='", "attr", "alt", ":checked", "val", "#DD#/#MM#/#YYYY# #DDD#", "toString", "substr", "length", "#ngay tr[alt='", "'] td[alt='", "'] a", "html", "'] div", "append", "C\u1ea3nh b\u00e1o tr\u00f9ng l\u1ecbch! K\u00e9o xu\u1ed1ng l\u1ecbch \u0111\u1ec3 xem chi ti\u1ebft c\u00e1c ti\u1ebft h\u1ecdc b\u1ecb tr\u00f9ng.", 
"#mon tr[alt='", "indexOf", "removeClass", "#mon select[alt='", "div", "prototype", "customFormat", "getFullYear", "slice", "January", "February", "April", "May", "August", "September", "October", "November", "December", "substring", "getDate", "Ch\u1ee7 nh\u1eadt", "Th\u1ee9 2", "Th\u1ee9 3", "Th\u1ee9 6", "#YYYY#", "replace", "#YY#", "#MMMM#"];
(function(data, i) {
  /**
   * @param {number} isLE
   * @return {undefined}
   */
  var write = function(isLE) {
    for (; --isLE;) {
      data["push"](data["shift"]());
    }
  };
  write(++i);
})(_0x2a1c, 391);
/**
 * @param {string} i
 * @param {?} parameter1
 * @return {?}
 */
var _0x4475 = function(i, parameter1) {
  /** @type {number} */
  i = i - 0;
  var oembedView = _0x2a1c[i];
  return oembedView;
};
/**
 * @param {!Map} data
 * @return {?}
 */
Date[_0x4475("0x0")][_0x4475("0x1")] = function(data) {
  var ss;
  var _maskLayer;
  var _maskLayerSimulate;
  var topShowDialog;
  var MM;
  var M;
  var fillTranslate;
  var knobTranslate;
  var DD;
  var D;
  var position;
  var i;
  var hh;
  var n;
  var temp_live;
  var live_value;
  var mm;
  var dd;
  var str;
  var yy;
  var dMod;
  var tag;
  _maskLayer = ((ss = this[_0x4475("0x2")]()) + "")[_0x4475("0x3")](-2);
  MM = (M = this["getMonth"]() + 1) < 10 ? "0" + M : M;
  topShowDialog = (_maskLayerSimulate = [_0x4475("0x4"), _0x4475("0x5"), "March", _0x4475("0x6"), _0x4475("0x7"), "June", "July", _0x4475("0x8"), _0x4475("0x9"), _0x4475("0xa"), _0x4475("0xb"), _0x4475("0xc")][M - 1])[_0x4475("0xd")](0, 3);
  DD = (D = this[_0x4475("0xe")]()) < 10 ? "0" + D : D;
  knobTranslate = fillTranslate = [_0x4475("0xf"), _0x4475("0x10"), _0x4475("0x11"), "Th\u1ee9 4", "Th\u1ee9 5", _0x4475("0x12"), "Th\u1ee9 7"][this["getDay"]()];
  /** @type {string} */
  tag = D >= 10 && D <= 20 ? "th" : (dMod = D % 10) == 1 ? "st" : dMod == 2 ? "nd" : dMod == 3 ? "rd" : "th";
  data = data["replace"](_0x4475("0x13"), ss)[_0x4475("0x14")](_0x4475("0x15"), _maskLayer)[_0x4475("0x14")](_0x4475("0x16"), _maskLayerSimulate)[_0x4475("0x14")]("#MMM#", topShowDialog)[_0x4475("0x14")](_0x4475("0x17"), MM)[_0x4475("0x14")](_0x4475("0x18"), M)[_0x4475("0x14")](_0x4475("0x19"), fillTranslate)[_0x4475("0x14")](_0x4475("0x1a"), knobTranslate)[_0x4475("0x14")]("#DD#", DD)[_0x4475("0x14")](_0x4475("0x1b"), D)[_0x4475("0x14")](_0x4475("0x1c"), tag);
  n = i = this[_0x4475("0x1d")]();
  if (n == 0) {
    /** @type {number} */
    n = 24;
  }
  if (n > 12) {
    /** @type {number} */
    n = n - 12;
  }
  hh = n < 10 ? "0" + n : n;
  position = i < 10 ? "0" + i : i;
  yy = (str = i < 12 ? "am" : "pm")[_0x4475("0x1e")]();
  temp_live = (live_value = this[_0x4475("0x1f")]()) < 10 ? "0" + live_value : live_value;
  mm = (dd = this["getSeconds"]()) < 10 ? "0" + dd : dd;
  return data[_0x4475("0x14")](_0x4475("0x20"), position)[_0x4475("0x14")]("#hhh#", i)[_0x4475("0x14")](_0x4475("0x21"), hh)["replace"](_0x4475("0x22"), n)[_0x4475("0x14")](_0x4475("0x23"), temp_live)[_0x4475("0x14")](_0x4475("0x24"), live_value)[_0x4475("0x14")](_0x4475("0x25"), mm)["replace"]("#s#", dd)["replace"](_0x4475("0x26"), str)["replace"](_0x4475("0x27"), yy);
};
var sort_mon = {};
/** @type {number} */
var minday = 0;
/** @type {number} */
var maxday = 0;
/** @type {number} */
var one_day_time = 864E5;
var temp;
var temp2;
var temp3;
var temp4;
mon[_0x4475("0x28")](function(params) {
  params[2] = (new Date(params[2][_0x4475("0x14")](/([0-9]{2})\/([0-9]{2})\/([0-9]{2})/, _0x4475("0x29"))))[_0x4475("0x2a")]();
  params[3] = (new Date(params[3][_0x4475("0x14")](/([0-9]{2})\/([0-9]{2})\/([0-9]{2})/, _0x4475("0x29"))))[_0x4475("0x2a")]();
  if (minday == 0) {
    minday = params[2];
  } else {
    if (minday > params[2]) {
      minday = params[2];
    }
  }
  if (maxday == 0) {
    maxday = params[3];
  } else {
    if (maxday < params[3]) {
      maxday = params[3];
    }
  }
  params[_0x4475("0x2b")][_0x4475("0x2c")](params, params[4]["split"]("->"));
  params[_0x4475("0x2d")](4, 1);
  /** @type {number} */
  params[4] = parseInt(params[4]);
  /** @type {number} */
  params[5] = parseInt(params[5]);
  temp = params[0][_0x4475("0x2e")](" (")[0];
  if (!(temp in sort_mon)) {
    sort_mon[temp] = {};
  }
  if (!(params[0] in sort_mon[temp])) {
    /** @type {!Array} */
    sort_mon[temp][params[0]] = [];
  }
  temp2 = params[0];
  params[_0x4475("0x2f")]();
  sort_mon[temp][temp2][_0x4475("0x2b")](params);
});
/**
 * @param {string} val
 * @return {undefined}
 */
function chon_lop(val) {
  if ($(_0x4475("0x30") + $(val)[_0x4475("0x31")](_0x4475("0x32")) + "']")["is"](_0x4475("0x33"))) {
    bo_lop($(val)[_0x4475("0x31")](_0x4475("0x32")));
    if ($(val)["val"]() == null) {
      return;
    }
    /** @type {number} */
    temp2 = 0;
    sort_mon[$(val)[_0x4475("0x31")](_0x4475("0x32"))][$(val)[_0x4475("0x34")]()][_0x4475("0x28")](function(extents) {
      var n2 = extents[1];
      for (; n2 <= extents[2]; n2 = n2 + one_day_time) {
        temp = (new Date(n2))["customFormat"](_0x4475("0x35"))[_0x4475("0x36")]();
        if (parseInt(temp[_0x4475("0x37")](temp[_0x4475("0x38")] - 1)) == extents[0]) {
          var minZ = extents[3];
          for (; minZ <= extents[4]; minZ++) {
            if ($(_0x4475("0x39") + temp + _0x4475("0x3a") + minZ + _0x4475("0x3b"))[_0x4475("0x3c")]() != "") {
              /** @type {number} */
              temp2 = 1;
              $(_0x4475("0x39") + temp + _0x4475("0x3a") + minZ + "']")["addClass"]("bg-danger");
            }
            $(_0x4475("0x39") + temp + _0x4475("0x3a") + minZ + _0x4475("0x3b"))[_0x4475("0x3c")]("X");
            $(_0x4475("0x39") + temp + _0x4475("0x3a") + minZ + _0x4475("0x3d"))[_0x4475("0x3e")]($(val)[_0x4475("0x34")]() + " ");
          }
        }
      }
    });
    if (temp2 == 1) {
      alert(_0x4475("0x3f"));
    }
  }
  $(_0x4475("0x40") + $(val)[_0x4475("0x31")]("alt") + "'] a")[_0x4475("0x3c")]($(val)[_0x4475("0x34")]());
}
/**
 * @param {string} ballNumber
 * @return {undefined}
 */
function bo_lop(ballNumber) {
  if ($(_0x4475("0x40") + ballNumber + "'] a")[_0x4475("0x3c")]() == "") {
    return;
  }
  sort_mon[ballNumber][$("#mon tr[alt='" + ballNumber + _0x4475("0x3b"))[_0x4475("0x3c")]()][_0x4475("0x28")](function(extents) {
    var n2 = extents[1];
    for (; n2 <= extents[2]; n2 = n2 + one_day_time) {
      temp = (new Date(n2))["customFormat"](_0x4475("0x35"))[_0x4475("0x36")]();
      if (parseInt(temp[_0x4475("0x37")](temp[_0x4475("0x38")] - 1)) == extents[0]) {
        var minZ = extents[3];
        for (; minZ <= extents[4]; minZ++) {
          temp2 = $("#ngay tr[alt='" + temp + "'] td[alt='" + minZ + _0x4475("0x3d"))["html"]()[_0x4475("0x14")]($(_0x4475("0x40") + ballNumber + "'] a")["html"]() + " ", "");
          $("#ngay tr[alt='" + temp + "'] td[alt='" + minZ + _0x4475("0x3d"))[_0x4475("0x3c")](temp2);
          temp3 = $(_0x4475("0x39") + temp + _0x4475("0x3a") + minZ + _0x4475("0x3d"))["html"]()[_0x4475("0x2e")](/ \(.+?\) /);
          temp4 = temp3[_0x4475("0x41")]("");
          for (; temp4 > -1;) {
            temp3[_0x4475("0x2d")](temp4, 1);
            temp4 = temp3[_0x4475("0x41")]("");
          }
          if (temp3[_0x4475("0x38")] <= 1) {
            $(_0x4475("0x39") + temp + "'] td[alt='" + minZ + "']")[_0x4475("0x42")]();
          }
          if ($("#ngay tr[alt='" + temp + "'] td[alt='" + minZ + _0x4475("0x3d"))[_0x4475("0x3c")]() == "") {
            $(_0x4475("0x39") + temp + _0x4475("0x3a") + minZ + "'] a")["html"]("");
          }
        }
      }
    }
  });
  $(_0x4475("0x40") + ballNumber + _0x4475("0x3b"))[_0x4475("0x3c")]("");
}
/**
 * @param {?} elem
 * @return {undefined}
 */
function check_mon(elem) {
  if (!$(elem)["is"](_0x4475("0x33"))) {
    bo_lop($(elem)[_0x4475("0x31")]("alt"));
  } else {
    chon_lop(_0x4475("0x43") + $(elem)["attr"](_0x4475("0x32")) + "']");
  }
}
/**
 * @param {?} doc
 * @return {undefined}
 */
function in_ngay(doc) {
  alert($(doc)["find"](_0x4475("0x44"))[_0x4475("0x3c")]());
}
;
// Loader
$(window).ready(function() {
	$('#container-dual-ring').animate({
	    height: "500%",
	    width: "500%"
	  }, 700, function() {
	  	$("#body").css({'display': 'block'});
	    $('#container-dual-ring').fadeOut(500, function() {
	    	$('body').css({'overflow': 'visible'});
	    });
	  });
});

'use strict';
/** @type {!Array} */
var _0x2cd0 = ["toString", "#ngay tbody", "'><td scope='row'>", "</td></tr>", "tr[alt='", "<td style='text-align: center' alt='", "' onclick='enablePopup(this)'><a style='cursor: pointer; display: block; width: 100%; height: 100%'></a><div style='display: none'></div></td>", "<tr alt='", "</td><td><select alt='", "' class='w-100' onchange='chon_lop(this)'><option selected='selected' disabled='disabled'>Ch\u1ecdn l\u1edbp</option></select><a style='display: none'></a></td><td><label class='checkbox-container'><input type='checkbox' alt='", "' onchange='check_mon(this)'></input><span class='checkmark'></span></label></td></tr>", 
"select[alt='", "append", "<option value='", "customFormat", "#DD#/#MM#/#YYYY# #DDD#"];
(function(data, i) {
  /**
   * @param {number} isLE
   * @return {undefined}
   */
  var write = function(isLE) {
    for (; --isLE;) {
      data["push"](data["shift"]());
    }
  };
  write(++i);
})(_0x2cd0, 327);
/**
 * @param {string} level
 * @param {?} ai_test
 * @return {?}
 */
var _0x16c4 = function(level, ai_test) {
  /** @type {number} */
  level = level - 0;
  var rowsOfColumns = _0x2cd0[level];
  return rowsOfColumns;
};
var key;
for (key in sort_mon) {
  $("#mon tbody")["append"](_0x16c4("0x0") + key + "'><td>" + key + _0x16c4("0x1") + key + _0x16c4("0x2") + key + _0x16c4("0x3"));
  var lop;
  for (lop in sort_mon[key]) {
    $(_0x16c4("0x4") + key + "']")[_0x16c4("0x5")](_0x16c4("0x6") + lop + "'>" + lop + "</option>");
  }
}
var i = minday;
for (; i <= maxday; i = i + one_day_time) {
  temp = (new Date(i))[_0x16c4("0x7")](_0x16c4("0x8"))[_0x16c4("0x9")]();
  $(_0x16c4("0xa"))[_0x16c4("0x5")](_0x16c4("0x0") + temp + _0x16c4("0xb") + temp + _0x16c4("0xc"));
  /** @type {number} */
  var j = 1;
  for (; j <= 16; j++) {
    $(_0x16c4("0xd") + temp + "']")[_0x16c4("0x5")](_0x16c4("0xe") + j + _0x16c4("0xf"));
  }
}
;

// Popup
function enablePopup(elem) {
	if($(elem).find('a').html().length == 0) return;
	let popupTitle = $(elem).parent().find('td')[0].innerHTML + " Tiết " + $(elem).attr('alt');
	let popupContent = $(elem).find('div').html();
	$('body').prepend(`
		<div id="popup-container" style="display: none; position: fixed; left: 0; top: 0; background: black; opacity: .7; width: 100%; height: 100%; z-index: 99;">
		</div>
		<div id="popup-content" class="w-100" style="display: none; position: fixed; top: 0; left: 0; background: transparent; z-index: 999;">
			<div class="row">
				<div class="col-md-3"></div>
				<div class="col-md-6 m-3">
					<div class="card bg-white">
						<h5 class="m-3">Lịch học `+popupTitle+`</h5>
						<p class="m-3">`+popupContent+`</p>
						<hr>
						<button class="btn btn-secondary m-3" onclick="disablePopup()">Đóng</button>
					</div>
				</div>
				<div class="col-md-3"></div>
			</div>
		</div>
	`);
	$('#popup-container').fadeIn();
	$('#popup-content').fadeIn();
}
function disablePopup(elem) {
	$('#popup-container').fadeOut().remove();
	$('#popup-content').fadeOut().remove();
}