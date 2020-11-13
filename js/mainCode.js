$(document).ready(function(){

function getRand(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

var InImg = {
  top: 0, left: 0, width: 0, height: 0, angle: 0, prop: 1,
  textSize: 30, textFont: 0, textStroke: false, textBold: false, textItalic: false,
}
var Selection = {
  top: 0, left: 0, width: 0, height: 0, points: [], creating: 0, creatingType: 0, btns: false, cut: false,
}
var select, sel;

var canvas = getNode('main_canvas');
var instBlock = getNode("inst-settings");
var ctx = canvas.getContext('2d');
var bg = getNode('bg_canvas').getContext('2d');
var dl = getNode('dl_canvas').getContext('2d');
var un2 = getNode('undo_canvas2');
var un1 = getNode('undo_canvas1');
var undo = un1.getContext('2d');
var lastAct = false, adding = 0, correctingBool = false;
var isMoving = 0, isDrawing = 0, isSliding = 0;
var instrument = 0;
var x1, x2, y1, y2, canvX=0, canvY=0;
var shift = false, ctrl = false, reservedBool = false;
var addImg = new Image(), bgImg = new Image(); addImg.setAttribute("crossorigin", "anonymous");
var cBorder=1, saved_inst = "", scale = 1, scale1 = 1, scale2 = 0;; brushCoords = [[],[]];
var overlay = [getNode("addImg_container"), getNode("editCanvas_container"), getNode("filters_container"), getNode("download_container"), getNode("blur_container"), getNode("histogram_container"), getNode("curves_container")];
main_x = canvas.width; main_y = canvas.height;
var colCorrect = [0,0,0,0,0], tempData;
var circle = null;
var cx = [0,256], cy= [256,0], ck = [], cxr = [0,256], cyr = [256,0], ckr = [], cxg = [0,256], cyg = [256,0], ckg = [], cxb = [0,256], cyb = [256,0], ckb = [];
var valsCW = new Uint8ClampedArray(256), valsCR = new Uint8ClampedArray(256), valsCG = [], valsCB = new Uint8ClampedArray(256);
var base64 = "";
size = 2; ctxX=0; ctxY=0;
hue = 0; saturation = 100; value = 100; transparency = 1; tr1 = transparency; tr11 = transparency; tr2 = tr1;
red1 = 255; green1 = 0; blue1 = 0;
red2 = 0; green2 = 0; blue2 = 0;
bgColor = '#ffffff';
selectedColor = '#ff0000';
selectedColor2 = '#000000';
$('#l1').css('background','#348bee');
bg.fillStyle = bgColor; bg.fillRect(0,0,main_x,main_y);
ctx.imageSmoothingEnabled = false;
bg.imageSmoothingEnabled = true;

function getNode(node) {
  return document.getElementById(node);
}

function median(values){
  if(values.length ===0) return 0;
  values.sort(function(a,b){
    return a-b;
  });
  var half = Math.floor(values.length / 2);
  if (values.length % 2) return values[half];
  return (values[half - 1] + values[half]) / 2.0;
}

function getAngle(x1,y1,x2,y2) {
  var a = [x2-x1, y2-y1]; var b = [10, 0];
  if (y2 >= y1)
  return Math.atan2(a[1], a[0]);
  else {
  return Math.atan2(a[1], a[0]);
  }
}

function interpolateArr(arr, step) {
  var newArr = [];
  for (var i = 0; i < arr.length; i++) newArr[i*(step)] = arr[i];
  for (var i = 0; i < arr.length-1; i++) {
    for (var j = 1; j < step+1; j++) {
      newArr[i*step+j] = arr[i] + (arr[i+1]-arr[i])*(j/step);
    }
  }
  return newArr;
}

function changeInst(block) {
  Selection.creatingType = 0;
  instrument = 0; instBlock.innerHTML = "";
  Array.prototype.forEach.call(document.getElementsByClassName("selButton"), (block) => {
    block.classList.remove("visible");
  });
  $('.button').css({'background':''}); $(block).css({'background':'#348bee'});
  if (block.classList.contains("inslin")) {
    var par = block.parentElement;
    var bl = block.parentElement.parentElement.children[0];
    par.parentElement.prepend(block);
    par.appendChild(bl);
    bl.classList.add("inslin");
    block.classList.remove("inslin");
  }
}

function sliding() {
var x = event.pageX - $('#size_slider .slider_line').offset().left;
width = $('#size_slider .slider_line').width();
if (x > width ) x = width;
if (x < 1) x = 1;
$('#size_slider .slider_button').css('left', x-10);
size = Math.round(x);
getNode("brush-size").children[0].innerText = size + "px";
$('.slider_line div').css('width', size + 'px');
$('#cursor').css({'width':size+'px', 'height':size+'px'});
}

function drawing(context, event, x, y) {
  var x1 = event.pageX - $('#main_canvas').offset().left;
  var y1 = event.pageY - $('#main_canvas').offset().top;
  var Size = size;
  if (Size < 5) Size -= Math.trunc(Size/2);
  context.save();
  if (instrument == 2) context.globalCompositeOperation = 'destination-out';
  else if (getNode("penType").selectedIndex) {brushCoords[0].push(x1/scale); brushCoords[1].push(y1/scale);}
  context.beginPath();
  context.lineWidth = 0;
  context.fillStyle = selectedColor;
  context.arc(x/scale, y/scale, Math.trunc(Size/2), 0, 2*Math.PI);
  context.fill();
  context.arc(x1/scale, y1/scale, Math.trunc(Size/2), 0, 2*Math.PI);
  context.fill();
  context.closePath();

  context.beginPath();
  context.strokeStyle = selectedColor;
  context.lineWidth = size;
  context.moveTo(x/scale,y/scale);
  context.lineTo(x1/scale, y1/scale);
  context.stroke();
  context.closePath();
  context.restore();
}

function pipette(canvas) {
  var x = event.pageX - $('#main_canvas').offset().left; var y = event.pageY - $('#main_canvas').offset().top;
  var p = canvas.getImageData(x/scale, y/scale, 1, 1).data;
  var pB = bg.getImageData(x/scale, y/scale, 1, 1).data;
  if (!p[3]) p = pB; else {
    var pr = p[3] / pB[3];
    for (var i=0; i<3; i++) p[i] = p[i]*pr + pB[i]*(1-pr);
  }
  var color = 'rgb(' + p[0] + ',' + p[1] + ',' + p[2] + ')';
  selectedColor = color;
  getNode("pagemax").style.setProperty("--main-col", color);
  var res = rgb_to_hsv(p[0],p[1],p[2]);
  hue = res[0]; saturation = res[1]*100; value = res[2]*100; tr1 = 1;
  red1=p[0]; green1=p[1]; blue1=p[2];
  if (value >= 75) {$('#updateBrush').css('color', 'black'); $('#colorButton').css('color', 'black');} else {$('#updateBrush').css('color', 'white'); $('#colorButton').css('color', 'white');};
  updateSelector();
}

function drawLine(context) {
  x2 = (event.pageX - $('#main_canvas').offset().left)/scale;
  y2 = (event.pageY - $('#main_canvas').offset().top)/scale;
  var angle = getAngle(x1,y1,x2,y2);
  if (shift) {
    if (Math.abs(Math.cos(angle)) > 0.707) {
      x2 = event.pageX - $('#main_canvas').offset().left;
      y2 = y1;
    } else {
      x2 = x1;
      y2 = event.pageY - $('#main_canvas').offset().top;
    }
  }
  context.clearRect(0,0,main_x,main_y);
  if (getNode("lineType").selectedIndex == 0) {
    context.lineCap = "butt";
  }
  else if (getNode("lineType").selectedIndex == 1) {
    context.lineCap = "round";
  }
  else if (getNode("lineType").selectedIndex == 2) {
    context.lineCap = "round";
    context.save();
    context.translate(x2,y2);
    context.rotate(angle);
    context.beginPath();
    context.moveTo(size,0);
    context.lineTo(-size*2,-size);
    context.lineTo(-size*2,size);
    context.lineTo(size,0);
    context.fillStyle = 'rgb('+red1+','+green1+','+blue1+','+tr1+')';
    context.fill();
    context.stroke();
    context.closePath();
    context.restore();
  }
  context.beginPath();
  context.strokeStyle = 'rgb('+red1+','+green1+','+blue1+','+tr1+')';
  context.lineWidth = size;
  context.moveTo(x1,y1);
  context.lineTo(x2,y2);
  context.stroke();
  context.closePath();
}

function drawRect(context) {
  x2 = (event.pageX - $('#main_canvas').offset().left)/scale;
  y2 = (event.pageY - $('#main_canvas').offset().top)/scale;
  var xt = x1, yt = y1, s;
  context.clearRect(0,0,main_x,main_y);
  context.beginPath();
  if (getNode("fillShape").checked) context.fillStyle = 'rgb('+red1+','+green1+','+blue1+','+tr1+')';
  else context.fillStyle = "transparent";
  context.strokeStyle = 'rgb('+red2+','+green2+','+blue2+','+tr11+')';
  if (getNode("strokeShape").checked) {s = size;} else {s=0;}
  context.lineWidth = s;
  var Y = (y2-yt);
  if (shift) {Y = (x2-xt); if (x2 < x1) {xt = x2; x2 = x1; Y = (xt-x2);}}
  context.fillRect(xt, yt, (x2-xt), Y);
  if (getNode("strokeShape").checked) {context.strokeRect(xt ,yt, (x2-xt), Y);}
  context.closePath();
}

function drawArc(context) {
  x2 = (event.pageX - $('#main_canvas').offset().left)/scale;
  y2 = (event.pageY - $('#main_canvas').offset().top)/scale;
  var sqX = (x2 - x1) * (x2 - x1);
  var sqY = (y2 - y1) * (y2 - y1);
  var s=0;
  if (getNode("strokeShape").checked) {s = size;}
  var rad =  Math.sqrt(sqX + sqY) - s / 2;
  context.clearRect(0,0,main_x,main_y);
  context.beginPath();
  if (getNode("fillShape").checked) context.fillStyle = 'rgb('+red1+','+green1+','+blue1+','+tr1+')';
  else context.fillStyle = "transparent";
  context.strokeStyle = 'rgb('+red2+','+green2+','+blue2+','+tr11+')';
  context.lineWidth = s;
  if (shift) context.arc(x1, y1, rad, 0, Math.PI * 2); else
    context.ellipse(x1, y1, Math.abs(x2-x1), Math.abs(y2-y1), 0, 0, Math.PI * 2);
  context.fill();
  context.closePath();
  context.beginPath();
  if (getNode("strokeShape").checked) {
    if (shift) context.arc(x1, y1, rad+s/2, 0, Math.PI * 2);
    else context.ellipse(x1, y1, Math.abs(x2-x1)+s/2, Math.abs(y2-y1)+s/2, 0, 0, Math.PI * 2);
    context.stroke();}
  context.closePath();
}

function moveImg(event) {
  if (!ctrl) {
    var x2 = (event.pageX - $('#main_canvas').offset().left)/scale, y2 = (event.pageY - $('#main_canvas').offset().top)/scale;
    var width = x2 - x1, height = y2 - y1;
    if (adding == 1) {
      getNode("image_border").style.top = (InImg.top + height) + "px";
      getNode("image_border").style.left = (InImg.left + width) + "px";
      getNode("addedImage").style.top = (InImg.top + height) + "px";
      getNode("addedImage").style.left = (InImg.left + width) + "px";
    } else if (adding == 2) {
      getNode("text_border").style.top = (InImg.top + height) + "px";
      getNode("text_border").style.left = (InImg.left + width) + "px";
    }
    else if (adding == 3) {
      getNode("image_border").style.top = (InImg.top + height) + "px";
      getNode("image_border").style.left = (InImg.left + width) + "px";
    }
  }
}

function imgResize(event, wR, hR) {
  var x2 = (event.pageX - $('#main_canvas').offset().left)/scale, y2 = (event.pageY - $('#main_canvas').offset().top)/scale;
  var width = x2 - x1;
  if (!shift) {var height = y2 - y1;}
  else {
    if (wR && hR || !wR && !hR) {var height = width * InImg.prop;}
    else {var height = -width * InImg.prop;}
  }
  var W = InImg.width + width; var H = InImg.height + height;
  if (wR) {
    W = InImg.width - width;
    getNode("image_border").style.left = (InImg.left + width) + "px";
    getNode("addedImage").style.left = (InImg.left + width) + "px";
  }
  if (hR) {
    H = InImg.height - height;
    getNode("image_border").style.top = (InImg.top + height) + "px";
    getNode("addedImage").style.top = (InImg.top + height) + "px";
  }
  getNode("image_border").style.width = W + "px";
  getNode("image_border").style.height = H + "px";
  getNode("addedImage").style.width = (W+1) + "px";
  getNode("addedImage").style.height = (H+1) + "px";
  if (adding == 3) {
    getNode("newRes").innerText = (getNode("image_border").offsetWidth-2) + 'x' + (getNode("image_border").offsetHeight-2);
  }
}

function imgRotate(event) {
  var y2 = (event.pageY - $('#main_canvas').offset().top)/scale;
  var h = (y2 - y1) / 2;
  InImg.angle = h;
  if (adding == 1) {
    getNode("full_img_border").style.transform = 'rotate('+h+'deg)';
    getNode("addedImage").style.transform = 'rotate('+h+'deg)';
  } else if (adding == 2) {
    getNode("textMove").style.transform = 'rotate('+h+'deg)';
  }
}

function swapColors() {
  var temp = selectedColor;
  var tempB = getComputedStyle(getNode("pagemax")).getPropertyValue("--main-col");
  var tempC = $("#updateBrush").css('color');
  var tempT = tr1;
  var tempRGB = [red1, green1, blue1];
  selectedColor = selectedColor2;
  selectedColor2 = temp;
  getNode("pagemax").style.setProperty("--main-col", getComputedStyle(getNode("pagemax")).getPropertyValue("--sec-col"));
  getNode("pagemax").style.setProperty("--sec-col", tempB);
  $("#updateBrush").css('color', $("#updateBrush2").css('color') );
  $("#colorButton").css('color', $("#updateBrush2").css('color') );
  $("#updateBrush2").css('color', tempC);
  tr1 = tr11; tr11 = tempT;
  red1 = red2; green1 = green2; blue1 = blue2;
  red2 = tempRGB[0]; green2 = tempRGB[1]; blue2 = tempRGB[2];
  var hsv = rgb_to_hsv(red1,green1,blue1);
  hue = hsv[0]; saturation = hsv[1]*100; value = hsv[2]*100;
  updateSelector();
  $("#exchange-colors").css('animation','0.33s rotation linear');
  setTimeout(function(){$("#exchange-colors").css('animation','');},333);
}

function updateInputWidth(block) {
  var punctuations = " .,:;%^@#!&?><1234567890-+_='\/*()№";
  var font_size = getComputedStyle(block).getPropertyValue("font-size");
  var uppercases = 0;
  for (var i = 0; i < block.value.length; i++) {
    if (block.value[i] == block.value[i].toUpperCase() && !punctuations.includes(block.value[i])) uppercases++;
  }
  font_size = font_size.slice(0, font_size.length-2);
  font_size = parseInt(font_size);
  block.style.width = block.value.length + (uppercases/3) + 2 + "ch";
}

function updateZoom(m) {
  document.getElementsByClassName("in")[0].style.transform = "scale("+scale+")";
  getNode("zoom-info").innerText = Math.round(scale*100) + '%';
  var B = document.getElementsByClassName("canvases")[0];
  var b = B.getElementsByClassName("imgBorder");
  for (var i = 0; i < b.length; i++) b[i].style.transform = "scale("+(1/scale)+")";
  b = B.getElementsByClassName("imgApply");
  for (var i = 0; i < b.length; i++) b[i].style.transform = "translateX(-50%) scale("+(1/scale)+")";
  b = B.getElementsByClassName("imgCancel");
  for (var i = 0; i < b.length; i++) b[i].style.transform = "translateX(-50%) scale("+(1/scale)+")";
  b = B.getElementsByClassName("imgRotate");
  for (var i = 0; i < b.length; i++) b[i].style.transform = "translateY(-50%) scale("+(1/scale)+")";
  cBorder = 1/scale;
  getNode("cursor").style.transform = "scale("+scale+")";
  getNode("cursor").style.borderWidth = cBorder+'px';
  getNode("cutSel").style.transform = "translateY(-50%) scale("+(1/scale)+")";
  getNode("copySel").style.transform = "translateY(-50%) scale("+(1/scale)+")";
  getNode("bg_canvas").style.backgroundSize = 1/scale + "%";
}

function updateCursor(a) {
  var cursor = getNode("cursor");
  if (a == 1 || a == 2) {
    cursor.style.display = "";
    un1.style.cursor = "none";
  } else if (a >2 && a < 11) {
    cursor.style.display = "none";
    un1.style.cursor = "crosshair";
  } else if (a == -2) {
    cursor.style.display = "none";
    un1.style.cursor = "move";
  } else if (a==-1) {
    cursor.style.display = "none";
    un1.style.cursor = "default";
  }
}

function moveCanvas(event) {
  var x2 = event.pageX, y2 = event.pageY;
  var X = (x2 - x1), Y = (y2 - y1);
  document.getElementsByClassName("in")[0].style.top = (canvY + Y) + 'px';
  document.getElementsByClassName("in")[0].style.left = (canvX + X) + 'px';
}

function fill() {
  var x2 = Math.round((event.pageX - $('#main_canvas').offset().left)/scale), y2 = Math.round((event.pageY - $('#main_canvas').offset().top)/scale);
  var wi = main_x, he = main_y;
  if (Selection.points == false)
    var data = ctx.getImageData(0,0,main_x,main_y);
  else {
    var c = document.createElement('canvas');
    c.width = Selection.width;
    c.height = Selection.height;
    c.getContext('2d').imageSmoothingEnabled = false;
    c.getContext('2d').drawImage(canvas, -Selection.left, -Selection.top);
    var data = c.getContext('2d').getImageData(0,0,c.width,c.height);
    x2 = Math.floor(x2 - Selection.left); y2 = Math.floor(y2 - Selection.top);
    wi = c.width; he = c.height;
  }
  var depth = getNode("fillWeight").value / 2;
  if (depth < 0) depth = 0; else if (depth > 255) depth = 128;
  var coords = [];
  var cI = 0;

  function getCol(x,y) {
    return [data.data[4*(wi*y+x)+0], data.data[4*(wi*y+x)+1], data.data[4*(wi*y+x)+2], data.data[4*(wi*y+x)+3]];
  }
  Array.prototype.compareCols = function (array) {
    var d = depth;
    for (var i = 0; i < 4; i++) {
      var s = Math.abs(this[i]-array[i]);
      if (s > d) { return false; }  else {d -= s}
    }
    //if (Math.abs(this[i]-array[i]) > depth*5) { return false; }
    return true;
}
  var matchColor = getCol(x2,y2);
  if (JSON.stringify(matchColor) == JSON.stringify([red1,green1,blue1,matchColor[3]])) return;
  if (x2 < 0 || x2 > wi || y2 < 0 || y2 > he) {console.log("yes"); return;}
  if (matchColor.compareCols([red1,green1,blue1,matchColor[3]])) depth = 0;
  function checkVert(x,y) {
    var left=false,right=false;
    var Y = y, X = x;
    while (getCol(X,Y).compareCols(matchColor) && Y >= 0) {
        data.data[4*(wi*Y+X)+0] = red1;
        data.data[4*(wi*Y+X)+1] = green1;
        data.data[4*(wi*Y+X)+2] = blue1;
        data.data[4*(wi*Y+X)+3] = tr1*255;
        if (getCol(X-1,Y).compareCols(matchColor) && X >= 0) {if(!left) {left = true; coords.push([X-1,Y]); cI++;} } else {left = false;}
        if (getCol(X+1,Y).compareCols(matchColor) && X < wi) {if(!right) {right = true; coords.push([X+1,Y]); cI++;} } else {right = false;}
      Y--;
    }
    Y = y+1;
    while (getCol(X,Y).compareCols(matchColor) && Y < he) {
        data.data[4*(wi*Y+X)+0] = red1;
        data.data[4*(wi*Y+X)+1] = green1;
        data.data[4*(wi*Y+X)+2] = blue1;
        data.data[4*(wi*Y+X)+3] = tr1*255;
        if (getCol(X-1,Y).compareCols(matchColor) && X >= 0) { if(!left) {left = true; coords.push([X-1,Y]); cI++;} } else {left = false;}
        if (getCol(X+1,Y).compareCols(matchColor) && X < wi) { if(!right) {right = true; coords.push([X+1,Y]); cI++;} } else {right = false;}
      Y++;
    }
  }
  checkVert(x2,y2);
  for (var i=0; i<cI; i++) {
    checkVert(coords[i][0],coords[i][1]);
  }
  if (Selection.points == false) ctx.putImageData(data,0,0);
  else {
    c.getContext('2d').putImageData(data,0,0);
    ctx.drawImage(c, Selection.left, Selection.top);
  }
}

function addImage(url) {
  if (!adding) {
      document.getElementsByClassName("imgRotate")[0].style.display = "";
      getNode("grid").style.display = "none";
      adding = 1;
      resetInstrument();
      instBlock.innerHTML = '<div class="imgApply flexed"><span></span></div><div class="imgCancel flexed">×</div>';
      var w = addImg.width; var h = addImg.height;
      if (h > main_y) {
        w *= main_y / h; h = main_y;
      }
      if (w > main_x) {
        h *= main_x/w; w  =main_x;
      }
      InImg.width = w; InImg.height = h;
      InImg.prop = h / w;
      InImg.top = (main_y - h)/2;
      InImg.left = (main_x - w)/2;
      InImg.angle = 0;
      document.getElementsByClassName("overlay_container")[0].classList.remove("visible");
      getNode("full_img_border").style.transform = '';
      $("#image_border").css({
        "display":"block",
        "width":w+"px",
        "height":h+"px",
        "top":InImg.top,
        "left":InImg.left,
        "backdrop-filter":"",
      });
      $("#addedImage").css({
        "background-image":"url("+url+")",
        "width":(w)+"px",
        "height":(h)+"px",
        "display":"block",
        "transform":"",
        "top":InImg.top,
        "left":InImg.left
      });
      return;
    }
}

function penBrush(mode) {
  if (mode == 1) {
    brushCoords[0] = interpolateArr(brushCoords[0],3); brushCoords[1] = interpolateArr(brushCoords[1],3);
    var len = brushCoords[0].length;
    var D = size / len * 3, T = tr1 / len * 6;
    var d = D, t = T;
    for (var i = 0; i < len; i++) {
      var x = brushCoords[0][i], y = brushCoords[1][i], X = brushCoords[0][i+1], Y = brushCoords[1][i+1];
      ctx.globalAlpha = t;
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = d;
      ctx.moveTo(x,y);
      ctx.lineTo(X, Y);
      ctx.stroke();
      ctx.closePath();
      if (i < len*0.33) d += D; else
        if (i > len*0.66) d -= D; else
        d = size;
      if (i < (len/6)) t+=T; else
          if (i > len-len/6) t-=T; else
        	  t = tr1;
    }
  } else if (mode == 2) {
    brushCoords[0] = interpolateArr(brushCoords[0],6); brushCoords[1] = interpolateArr(brushCoords[1],6);
    var len = brushCoords[0].length;
    for (var i = 0; i < len; i++) {
      var Shift = getRand(-size/1.5, size/5);
      var ShiftT = getRand(0, 20)/25;
      var x = brushCoords[0][i], y = brushCoords[1][i], X = brushCoords[0][i+1], Y = brushCoords[1][i+1];
      ctx.globalAlpha = tr1 - ShiftT;
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = size+Shift;
      ctx.moveTo(x,y);
      ctx.lineTo(X, Y);
      ctx.stroke();
      ctx.closePath();
    }
  } else if (mode == 3) {
    var nbx = [], nby = [];
    var spx = [], spy = [];
    for (var i=1; i<brushCoords[0].length; i++) {
      spx.push(Math.abs(brushCoords[0][i] - brushCoords[0][i-1]));
      spy.push(Math.abs(brushCoords[1][i] - brushCoords[1][i-1]));
    }
    var speed = (median(spx) + median(spy)) / 3;
    if (speed > 8) speed = 8;
    speed = Math.round(9-speed);
    for (var i=0; i<brushCoords[0].length; i+=speed) {
      nbx.push(brushCoords[0][i]);
      nby.push(brushCoords[1][i]);
    }
    nbx.push(brushCoords[0][brushCoords[0].length-1]);
    nby.push(brushCoords[1][brushCoords[1].length-1]);
    function smooth(arr) {
      var newArr = [arr[0]];
      for (var i=1; i<arr.length; i++) {
        var start = arr[i-1] + (arr[i]-arr[i-1])/3;
        var end = arr[i] - (arr[i]-arr[i-1])/3;
        newArr.push(start); newArr.push(end);
      }
      newArr.push(arr[arr.length-1]);
      return newArr;
    }
    for (var i=0; i<4; i++) {
      nbx = smooth(nbx); nby = smooth(nby);
    }
    for (var i = 0; i < nbx.length; i++) {
        var x = nbx[i], y = nby[i], X = nbx[i+1], Y = nby[i+1];
        ctx.globalAlpha = tr1 - ShiftT;
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = size;
        ctx.moveTo(x,y);
        ctx.lineTo(X, Y);
        ctx.stroke();
        ctx.closePath();
    }
  }
  brushCoords = [[],[]];
  ctx.globalAlpha = tr1;
}

function toggleVisible(block) {
  if ( block.classList.contains("visible") ) {block.classList.remove("visible"); return false;}
  else {block.classList.add("visible"); return true;}
}

function resetInstrument() {
  Selection.creatingType = 0;
  updateCursor(-1);
  instrument = -1;
  $('.button').css({'background':''});
  if (!adding) instBlock.innerHTML = '';
}

function colorCorrection(mode) {
  if (mode == 0) {var block = getNode('contrastSlider'); var valtext = "Контраст: ";} else
  if (mode == 1) {var block = getNode('saturationSlider'); var valtext = "Насыщенность: ";} else
  if (mode == 2) {var block = getNode('brightnessSlider'); var valtext = "Яркость: ";} else
  if (mode == 3) {var block = getNode('temperatureSlider'); var valtext = "Температура: ";}
  var x = event.pageX - $(block).offset().left;
  if (x < 0) x = 0; else if (x > 200) x = 200; else if (x > 95 && x < 105) x = 100;
  var value = x - 100;
  if (value > 0) valtext += '+'+value+'%'; else valtext += value+'%';
  block.getElementsByClassName("bump")[0].style.left = x / 2 + '%';
  block.getElementsByClassName("text")[0].innerText = valtext;
  if (mode == 0) {colCorrect[0] = value;} else
  if (mode == 1) {colCorrect[1] = value;} else
  if (mode == 2) {colCorrect[2] = value;} else
  if (mode == 3) {colCorrect[3] = value;
                  var red=0, blue=0;
                  if (colCorrect[3] > 0) red = 225; else
                  if (colCorrect[3] < 0) blue = 225;
                  var T = Math.abs(colCorrect[3])/1500;
                  getNode("tempFilter").style.background = "rgba("+red+",50,"+blue+","+T+")";
                 }
  canvas.style.filter = "brightness("+(100+colCorrect[2])+"%) contrast("+(100+colCorrect[0])+"%) saturate("+(100+colCorrect[1])+"%)";
}

function applyColorCorrection() {
  ctx.globalAlpha = tr1; un2.getContext('2d').clearRect(0,0,main_x,main_y); un2.getContext('2d').drawImage(canvas,0,0);
  var data = ctx.getImageData(0,0,main_x,main_y);
  var d = data.data;
  //КОНТРАСТ, ЯРКОСТЬ И ТЕМПЕРАТУРА//
  var contrast = colCorrect[0]/100+1;
  var intercept = 128 * (1 - contrast);
  var brightness = colCorrect[2]/100+1;
  var temperature = 0;
  if (colCorrect) temperature = colCorrect[3]/8;
  for (var i=0; i<d.length; i+=4){
    d[i] = d[i]*contrast*brightness + intercept + temperature;
    d[i+1] = d[i+1]*contrast*brightness + intercept;
    d[i+2] = d[i+2]*contrast*brightness + intercept - temperature;
  }
  //НАСЫЩЕННОСТЬ В РОТ Я ЕЁ КОПАЛ//
  var sv = colCorrect[1]/100+1;
  var luR = 0.3086, luG = 0.6094, luB = 0.0820;
  var az = (1 - sv)*luR + sv;
  var bz = (1 - sv)*luG;
  var cz = (1 - sv)*luB;
  var dz = (1 - sv)*luR;
  var ez = (1 - sv)*luG + sv;
  var fz = (1 - sv)*luB;
  var gz = (1 - sv)*luR;
  var hz = (1 - sv)*luG;
  var iz = (1 - sv)*luB + sv;

  for (var i = 0; i < d.length; i += 4) {
    var red = d[i];
    var green = d[i + 1];
    var blue = d[i + 2];
    var saturatedRed = (az*red + bz*green + cz*blue);
    var saturatedGreen = (dz*red + ez*green + fz*blue);
    var saturatedBlue = (gz*red + hz*green + iz*blue);
    d[i] = saturatedRed;
    d[i + 1] = saturatedGreen;
    d[i + 2] = saturatedBlue;
  }
  //СБРОС НАСТРОЕК//
  colCorrect = [0,0,0,0];
  var blocks = document.getElementsByClassName("h-slider");
  for (var i=0; i<blocks.length; i++) {
    blocks[i].getElementsByClassName("bump")[0].style.left = "50%";
    var text = blocks[i].getElementsByClassName("text")[0].innerText;
    text = text.slice(0, text.indexOf(":")+1);
    blocks[i].getElementsByClassName("text")[0].innerText = text;
  }
  getNode("tempFilter").style.background = "";
  var button = getNode("applyProps");
  button.innerText = "Настройки применены";
  button.style.color =  "green"; button.style.borderColor = "green"; button.style.background = "transparent";
  setTimeout(function(){button.style.color =  ""; button.style.borderColor = ""; button.style.background = ""; button.innerText = "Применить";}, 1500);
  ctx.clearRect(0,0,main_x,main_y);
  ctx.putImageData(data,0,0);
  canvas.style.filter = "";
}

function applyFilter(context, mode) {
  var power =  getNode("filterPower").value / 100;
  var c = context.getContext('2d');
  if (context == canvas) {
    ctx.globalAlpha = tr1; un2.getContext('2d').clearRect(0,0,main_x,main_y); un2.getContext('2d').drawImage(canvas,0,0);
  } else if (context == getNode("filterPreview")) c.putImageData(tempData,0,0);
  var data = c.getImageData(0,0,context.width,context.height);
  var d = data.data;
  var dOriginal = d.slice();
  if (mode == 1) { //Янтарь
    for (var i = 0; i < d.length; i += 4) {
      var rgb = [d[i+0], d[i+1], d[i+2]]
      var hsv = rgb_to_hsv(rgb[0],rgb[1],rgb[2]);
      var v = hsv[2];
      if (v < 0.33) {
        d[i] = d[i] * ( 1.33 - 0.33*(hsv[2]+0.67) );
        d[i+1] = d[i+1] * ( 1.33 - 0.33*(hsv[2]+0.67) );
        d[i+2] = d[i+2] * ( 1.33 - 0.33*(hsv[2]+0.67) );
        v = 0.33*2-v; d[i] += 100*v; d[i+1] += 10*v; d[i+2] += 50*v;
      } else {d[i] += 80*v; d[i+1] += 20*v;}
    }
  } else if (mode == 2) { // Мрак
    for (var i = 0; i < d.length; i += 4) {
      var rgb = [d[i+0], d[i+1], d[i+2]]
      var hsv = rgb_to_hsv(rgb[0],rgb[1],rgb[2]);
      var v = hsv[2];
      if (v < 0.9) {
        d[i]= d[i]*v-8+8*(v+0.1); d[i+1] = d[i+1]*v+32-32*(v+0.1); d[i+2]=d[i+2]*v+16-16*(v+0.1);
      } else {
        d[i] = d[i]*v/(v+0.1); d[i+1] = d[i+1]*v/(v+0.1); d[i+2] = d[i+2]*v/(v+0.1);
      }
      d[i] -= 10; d[i+2] += 15;
    }
  } else if (mode == 9) { //только красный
    for (var i = 0; i < d.length; i += 4) {
      var rgb = [d[i+0], d[i+1], d[i+2]]
      var hsv = rgb_to_hsv(rgb[0],rgb[1],rgb[2]);
      if ( !((hsv[0] < 5 || hsv[0] > 345) && hsv[1] > 0.85) ) {
        var Shift = 0;
        if (hsv[0] < 180) {var a = hsv[0] - 5; if (a < 0) a = 0; Shift += a/8;}
        else {var a = 345 - hsv[0]; if (a < 0) a = 0; Shift += a/10;}
        Shift += (0.85 - hsv[1])/2;
        if (Shift > 1) Shift = 1;
        var luR = 0.3086, luG = 0.6094, luB = 0.0820;
        var az = 1*luR, bz = 1*luG, cz = 1*luB, dz = 1*luR;
        var ez = 1*luG, fz = 1*luB, gz = 1*luR, hz = 1*luG, iz = 1*luB;
        var saturatedRed = (az*d[i] + bz*d[i+1] + cz*d[i+2]);
        var saturatedGreen = (dz*d[i] + ez*d[i+1] + fz*d[i+2]);
        var saturatedBlue = (gz*d[i] + hz*d[i+1] + iz*d[i+2]);
        d[i] = saturatedRed * Shift + d[i] * (1 - Shift);
        d[i+1] = saturatedGreen * Shift + d[i+1] * (1 - Shift);;
        d[i+2] = saturatedBlue * Shift + d[i+2] * (1 - Shift);;
      }
    }
  } else if (mode == 3) {
    var contrast = 0.9;
    var intercept = 128 * (1 - contrast);
    for (var i = 0; i < d.length; i += 4) {
      var hsv = rgb_to_hsv(d[i], d[i+1], d[i+2]);
      if (hsv[2] <= 0.66) {
        d[i] = d[i] - 50 + 50*(hsv[2]+0.34);
        d[i+1] = d[i+1] + 10 - 10*(hsv[2]+0.34);
        d[i+2] = d[i+2] + 100 - 100*(hsv[2]+0.34);
      }
      d[i] = d[i] * contrast * 1.1 + intercept+20;
      d[i+1] = d[i+1] * contrast * 1.1 + intercept+10;
      d[i+2] = d[i+2] * contrast * 1.1 + intercept;
    }
  }
  else if (mode == 4) {
    for (var i = 0; i < d.length; i += 4) {
      var hsv = rgb_to_hsv(d[i], d[i+1], d[i+2]);
      if (hsv[2] <= 0.8) {
        var contrast = 2 - hsv[2] - 0.2;
        var intercept = 128 * (1 - contrast);
        d[i] = d[i] * contrast + intercept;
        d[i+1] = d[i+1] * contrast + intercept;
      }
      d[i] -= 3;
      d[i+2] = d[i+2] * 1.2 + 10;
    }
  }
  else if (mode == -1) {

  }
  else if (mode == 11) {
    for (var i = 0; i < d.length; i += 4) {
      d[i] = 255-d[i];
      d[i+1] = 255-d[i+1];
      d[i+2] = 255-d[i+2];
    }
  }
  else if (mode == 5) {
    for (var i = 0; i < d.length; i += 4) {
      var hsv = rgb_to_hsv(d[i], d[i+1], d[i+2]);
      if (hsv[2] > 0.5) {
        d[i] = d[i] + 120 - 120*(1.5-hsv[2]);
        d[i+1] = d[i+1] + 30 - 30*(1.5-hsv[2]);
      } else {
        d[i] = d[i]-20+20*(hsv[2]+0.5);
        d[i+1] = d[i+1]-20+20*(hsv[2]+0.5);
        d[i+2] = d[i+2]*3/(1+hsv[2]*4);
      }
    }
  }
  else if (mode == 6) { //Сахарная вата
    for (var i = 0; i < d.length; i += 4) {
      var contrast = 0.8;
      var intercept = 128 * (1 - contrast);
      d[i] = (d[i] * contrast * 1.1 + intercept) + 15;
      d[i+1] = (d[i+1] * contrast * 0.9 + intercept);
      d[i+2] = (d[i+2] * contrast + intercept) + 10;
    }
  }
  else if (mode == 7) { //Лоза
    var sv = 0.75;
    var luR = 0.3086, luG = 0.6094, luB = 0.0820;
    var az = (1 - sv)*luR + sv, bz = (1 - sv)*luG, cz = (1 - sv)*luB;
    var dz = (1 - sv)*luR, ez = (1 - sv)*luG + sv, fz = (1 - sv)*luB;
    var gz = (1 - sv)*luR, hz = (1 - sv)*luG, iz = (1 - sv)*luB + sv;
    for (var i = 0; i < d.length; i += 4) {
      var contrast = 1.15;
      var intercept = 128 * (1 - contrast);
      var saturatedRed = (az*d[i] + bz*d[i+1] + cz*d[i+2]);
      var saturatedGreen = (dz*d[i] + ez*d[i+1] + fz*d[i+2]);
      var saturatedBlue = (gz*d[i] + hz*d[i+1] + iz*d[i+2]);
      d[i] = saturatedRed * contrast + intercept - 5;
      d[i+1] = saturatedGreen * contrast + intercept;
      d[i+2] = saturatedBlue * contrast + intercept + 5;
      var hsv = rgb_to_hsv(d[i], d[i+1], d[i+2]);
      if (hsv[2] < 0.5) {
        d[i] = d[i]-25+25*(hsv[2]+0.5);
        d[i+1] = d[i+1]+60-60*(hsv[2]+0.5);
        d[i+2] = d[i+2]+50-50*(hsv[2]+0.5);
      } else {
        d[i] = d[i]-40+40*(1.5-hsv[2]);
        d[i+1] = d[i+1]+60-60*(1.5-hsv[2]);
        d[i+2] = d[i+2]+50-50*(1.5-hsv[2]);
      }
    }
  }
  else if (mode == 8) { //Ультрафиолет
    var contrast = 1.25;
    var intercept = 128 * (1 - contrast);
    for (var i = 0; i < d.length; i += 4) {
      d[i] = d[i] * contrast + intercept - 22;
      d[i+1] = d[i+1] * contrast + intercept - 22;
      d[i+2] = d[i+2] * contrast + intercept - 22;
      var hsv = rgb_to_hsv(d[i],d[i+1],d[i+2]);
      var rgb = hsv_to_rgb(0,0,hsv[2]*100);
      d[i] = rgb[0]+30; d[i+1] = rgb[1]-5; d[i+2] = rgb[2]+30;
      if (hsv[2] < 0.5) {
        d[i] = d[i]-80+80*(hsv[2]+0.5);
        d[i+1] = d[i+1]-40+40*(hsv[2]+0.5);
        d[i+2] = d[i+2]+40-40*(hsv[2]+0.5);
      } else {
        d[i+2] = d[i+2]-50+50*(hsv[2]+0.5);
        d[i] = d[i]+50-50*(hsv[2]+0.5);
      }
    }
  }
  else if (mode == 10) { //Чернила
    var contrast = 1.5;
    var intercept = 128 * (1 - contrast);
    for (var i = 0; i < d.length; i += 4) {
      d[i] = d[i] * contrast + intercept - 22;
      d[i+1] = d[i+1] * contrast + intercept - 22;
      d[i+2] = d[i+2] * contrast + intercept - 22;
      var hsv = rgb_to_hsv(d[i],d[i+1],d[i+2]);
      var rgb = hsv_to_rgb(0,0,hsv[2]*100);
      d[i] = rgb[0]; d[i+1] = rgb[1]; d[i+2] = rgb[2];
      if (hsv[2] < 0.5) {
        d[i] = d[i]+60-60*(hsv[2]+0.5);
        d[i+1] = d[i]; d[i+2] = d[i];
      } else {
        d[i] = d[i]-80+80*(1.5-hsv[2]);
        d[i+1] = d[i]; d[i+2] = d[i];
      }
    }
  }
  for (var i = 0; i < d.length; i += 4) {
    d[i] = d[i] * power + dOriginal[i] * (1-power);
    d[i+1] = d[i+1] * power + dOriginal[i+1] * (1-power);
    d[i+2] = d[i+2] * power + dOriginal[i+2] * (1-power);
  }
  c.clearRect(0,0,context.width,context.height);
  c.putImageData(data,0,0);
  return;
}

function applySharpness(context, mode, power, radius) {
  var c = context.getContext('2d');
  if (context == canvas) {
    ctx.globalAlpha = tr1; un2.getContext('2d').clearRect(0,0,main_x,main_y); un2.getContext('2d').drawImage(canvas,0,0);
  } else if (context == getNode("filterPreview")) c.putImageData(tempData,0,0);
  var data = c.getImageData(0,0,context.width,context.height);
  var d = data.data;
  var med;
  if (mode == 0) { //Медиана
    med = d.slice();
    for (var kk=0; kk<3; kk++) {
      for (var y=1; y<main_y-1; y++) {
        for (var x=1; x<main_x-1; x++) {
          var arr = [ med[4*(main_x*y+x)+0], med[4*(main_x*(y+1)+x)+0], med[4*(main_x*y+x+1)+0], med[4*(main_x*(y-1)+x)+0], med[4*(main_x*y+x-1)+0], med[4*(main_x*(y-1)+x-1)+0], med[4*(main_x*(y-1)+x+1)+0], med[4*(main_x*(y+1)+x-1)+0], med[4*(main_x*(y+1)+x+1)+0] ];
          med[4*(main_x*y+x)+0] = median(arr);
          arr = [ med[4*(main_x*y+x)+1], med[4*(main_x*(y+1)+x)+1], med[4*(main_x*y+x+1)+1], med[4*(main_x*(y-1)+x)+1], med[4*(main_x*y+x-1)+1], med[4*(main_x*(y-1)+x-1)+1], med[4*(main_x*(y-1)+x+1)+1], med[4*(main_x*(y+1)+x-1)+1], med[4*(main_x*(y+1)+x+1)+1] ];
          med[4*(main_x*y+x)+1] = median(arr);
          arr = [ med[4*(main_x*y+x)+2], med[4*(main_x*(y+1)+x)+2], med[4*(main_x*y+x+1)+2], med[4*(main_x*(y-1)+x)+2], med[4*(main_x*y+x-1)+2], med[4*(main_x*(y-1)+x-1)+2], med[4*(main_x*(y-1)+x+1)+2], med[4*(main_x*(y+1)+x-1)+2], med[4*(main_x*(y+1)+x+1)+2] ];
          med[4*(main_x*y+x)+2] = median(arr);
        }
      }
    }
  }
  else if (mode == 1) {//По рамке
    var medD = ctx.getImageData(0,0,main_x,main_y);
    StackBlur.imageDataRGB(medD, 0,0,main_x,main_y,10);
    med = medD.data;
  }
  for (var i=0; i < d.length; i+= 4) {
    d[i] = d[i] + (d[i] - med[i])*power; d[i+1] = d[i+1] + (d[i+1] - med[i+1])*power; d[i+2] = d[i+2] + (d[i+2] - med[i+2])*power;
  }
  c.clearRect(0,0,context.width,context.height);
  c.putImageData(data,0,0);
}


function updateCanvasPreview() {
  var w = parseInt(getNode("canvasWidth").value), h = parseInt(getNode("canvasHeight").value), W, H;
  var block = getNode("canvasPreview");
  if (w > h) {W=200; H=200*(h/w);} else if (w < h) {H=200; W=200*(w/h);} else {H=200; W=200;}
  block.style.width = W+'px'; block.style.height = H+'px';
  var x = w, y = h;
  while (x && y) {
    x > y ? x %= y : y %= x;
  }
  x += y;
  getNode("canvasAspectRatio").innerText = (w/x)+':'+(h/x);
}

function updateCanvas(w, h) {
  var blocks = document.getElementsByClassName("canvases")[0].getElementsByTagName("canvas");
  for (var i=0; i<blocks.length; i++) {
    blocks[i].width = w; blocks[i].height = h;
  }
  main_x = canvas.width; main_y = canvas.height;
  var bb = document.getElementsByClassName("canvases")[0];
  bb.style.width = w+'px'; bb.style.height = h+'px'; bb.style.minWidth = w+'px';
  bg.fillStyle = bgColor;
  bg.fillRect(0,0,main_x,main_y);
  if (w > h) scale1 = 1200 / w; else scale1 = 600 / h;
  scale2 = 0;
  scale = scale1+scale2;
  updateZoom(0);
  canvX = 0; canvY = 0;
  document.getElementsByClassName("in")[0].style.top = canvY + 'px';
  document.getElementsByClassName("in")[0].style.left = canvX + 'px';
  getNode("infoWidth").innerText = "Ширина: " + main_x;
  getNode("infoHeight").innerText = "Высота: " + main_y;
  InImg.textSize = Math.round(main_x * main_y / 24000);
  Selection.btns = false;
  Array.prototype.forEach.call(document.getElementsByClassName("selButton"), (block) => {
    block.classList.remove("visible");
  });
  ctx.imageSmoothingEnabled = false;
}

function applyBlur(canvas, mode, weight) {
  if (mode == 0) {
    StackBlur.canvasRGBA(canvas, 0, 0, main_x, main_y, weight);
  }
}

;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  getNode("pagemax").addEventListener(eventName, preventDefaults, false)
})
function preventDefaults (e) {
  e.preventDefault()
  e.stopPropagation()
}

getNode("actions").addEventListener('dragenter', function(e){
  getNode("actions").classList.add("draggedFile");
}, false);
getNode("dropImg").addEventListener('dragover', function(e){
}, false);
;['dragleave', 'drop'].forEach(eventName => {
  getNode("dropImg").addEventListener(eventName, function(e){
    getNode("actions").classList.remove("draggedFile");
  }, false)
})

getNode("pagemax").addEventListener('drop', function(e){
  if (!adding) {
    var tried = false;
    var items = e.dataTransfer.items;
    var url;
    for (var index=0; index<items.length; index++) {
      var item = items[index];
      console.log('Dropped file info: kind=' + item.kind + ', type=' + item.type);
      if (item.type.indexOf('image/') === 0) {
        url = URL.createObjectURL(item.getAsFile());
        addImg.src = url;
        addImg.onload = function (e) {
          addImage(url);
        }
      } else if (item.kind == "string" && item.type.match('^text/plain')) {
        addImg.crossOrigin = "Anonymous";
        var el = e.dataTransfer.getData('text/html');
        var bl = document.createElement('div');
        bl.innerHTML = el;
        var url = bl.getElementsByTagName('img')[0].getAttribute('src');
        console.log(url);
        addImg.src = url;
        addImg.onload = function (e) {
          addImage(url);
        }
        addImg.onerror = function (e) {
          if (!tried) {addImg.src = "https://cors-anywhere.herokuapp.com/"+url; tried = true; return;}
          console.warn("error while loading dropped image from another website"); return;
        }
      }
    }
  }
});

function flip(horizontal = false, vertical = false) {
  ctx.globalAlpha = 1; un2.getContext('2d').clearRect(0,0,main_x,main_y); un2.getContext('2d').drawImage(canvas,0,0);
  var img = new Image();
  img.onload = function() {
    ctx.save();
    ctx.setTransform(
      horizontal ? -1 : 1, 0,
      0, vertical ? -1 : 1,
      (horizontal ? main_x : 0),
      (vertical ? main_y : 0)
    );
    ctx.clearRect(0,0,main_x,main_y);
    ctx.drawImage(img,0,0);
    ctx.restore();
  }
  img.src = canvas.toDataURL();
}

function generateHistogram() {
  function draw(arr, color) {
    canvx.beginPath();
    canvx.strokeStyle = color;
    for (var j=0; j<arr.length; j++) {
      canvx.moveTo(j*cc,-arr[j]);
      canvx.lineTo((j+1)*cc,-arr[j+1]);
    }
    canvx.stroke();
    canvx.closePath();
  }
  var canv = getNode("histogramPreview");
  var canvx = canv.getContext('2d');
  canv.width = 512; canv.height = 512;
  canvx.globalCompositeOperation = 'screen';
  canvx.translate(0,canv.height);
  canvx.lineWidth = 2;
  var data = ctx.getImageData(0,0,main_x,main_y);
  var d = data.data;
  var valuesR = [], valuesG = [], valuesB = [], valuesW = [];
  for (var i=0; i<256; i++) {valuesR[i] = 0; valuesG[i] = 0; valuesB[i] = 0; valuesW[i] = 0;}
  for (var i=0; i<d.length; i+=4) {valuesR[d[i+0]]++; valuesG[d[i+1]]++; valuesB[d[i+2]]++; valuesW[Math.floor(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2])]++;}
  valuesR = valuesR.slice(1, valuesR.length-1); valuesG = valuesG.slice(1, valuesG.length-1);
  valuesB = valuesB.slice(1, valuesB.length-1); valuesW = valuesW.slice(1, valuesW.length-1);
  var vals = [Math.max.apply(null, valuesR), Math.max.apply(null, valuesG), Math.max.apply(null, valuesB), Math.max.apply(null, valuesW)]
  var normal = canv.height / Math.max.apply(null, vals);
  var cc = canv.width / valuesR.length;
  for (var i=0; i<valuesR.length; i++) {
    valuesR[i] *= normal;
    valuesG[i] *= normal;
    valuesB[i] *= normal;
    valuesW[i] *= normal;
  }
  getNode("hist1").innerText = Math.floor(128 / normal) + " -";
  getNode("hist2").innerText = Math.floor(256 / normal) + " -";
  getNode("hist3").innerText = Math.floor(384 / normal) + " -";
  draw(valuesR, "red"); draw(valuesG, "chartreuse"); draw(valuesB, "blue"); //draw(valuesW, "white");
}

function updateCurvesVals(bl = null) {
  if (!bl) {
    if (getNode('curveWhite').checked) {var X = cx, Y = cy, k = ck, c = "white"; var vals = valsCW;}
    else if (getNode('curveRed').checked) {var X = cxr, Y = cyr, k = ckr, c = "red"; var vals = valsCR;}
      else if (getNode('curveGreen').checked) {var X = cxg, Y = cyg, k = ckg, c = "green"; var vals = valsCG;}
        else if (getNode('curveBlue').checked) {var X = cxb, Y = cyb, k = ckb, c = "blue"; var vals = valsCB;}
  } else {
    var blocks = document.getElementsByClassName("curve_channels");
    var index = [].indexOf.call(blocks, bl);
    if (index == 0) {var c = "white"; var vals = valsCW;}
    else if (index == 1) {var c = "red"; var vals = valsCR;}
      else if (index == 2) {var c = "green"; var vals = valsCG;}
        else if (index == 3) {var c = "blue"; var vals = valsCB;}
  }
  CSPL.getNaturalKs(cx,cy,ck);
  CSPL.getNaturalKs(cxr,cyr,ckr);
  CSPL.getNaturalKs(cxg,cyg,ckg);
  CSPL.getNaturalKs(cxb,cyb,ckb);
  for (var i=0; i< 256; i++) {
    valsCW[i] = CSPL.evalSpline(i, cx, cy, ck);
    valsCR[i] = CSPL.evalSpline(i, cxr, cyr, ckr);
    valsCG[i] = CSPL.evalSpline(i, cxg, cyg, ckg);
    valsCB[i] = CSPL.evalSpline(i, cxb, cyb, ckb);
  }
  updateCurve(vals, c);
}

function moveCircle(block,x2,y2) {
  var canv = getNode("curves");
  var canvx = canv.getContext('2d');
  if (getNode('curveWhite').checked) {var X = cx, Y = cy, k = ck, c = "white"; var vals = valsCW;}
  else if (getNode('curveRed').checked) {var X = cxr, Y = cyr, k = ckr, c = "red"; var vals = valsCR;}
    else if (getNode('curveGreen').checked) {var X = cxg, Y = cyg, k = ckg, c = "green"; var vals = valsCG;}
      else if (getNode('curveBlue').checked) {var X = cxb, Y = cyb, k = ckb, c = "blue"; var vals = valsCB;}
  if (X[X.length-1] != canv.width) {X.push(canv.width); Y.push(0);}
  if (x2 > canv.width) x2 = canv.width;
  else if (x2 < 0) x2 = 0;
  if (y2 > canv.height) y2 = canv.height;
  else if (y2 < 0) y2 = 0;
  block.style.left = x2+'px';
  block.style.top = y2+'px';
  var index = [].indexOf.call(block.parentElement.children, block);
  X[index] = x2;
  Y[index] = y2;
  if (X[X.length-1] != canv.width) {X.push(canv.width); Y.push(0);}
  if (x2 < X[index-1]) {
    var par = block.parentNode;
    par.insertBefore(block, par.children[index-1]);
    var temp = X[index];
    X[index] = X[index-1];
    X[index-1] = temp;
    temp = Y[index];
    Y[index] = Y[index-1];
    Y[index-1] = temp;
  }
  if (x2 > X[index+1]) {
    var par = block.parentNode;
    par.insertBefore(par.children[index+1], block);
    var temp = X[index];
    X[index] = X[index+1];
    X[index+1] = temp;
    temp = Y[index];
    Y[index] = Y[index+1];
    Y[index+1] = temp;
  }
  updateCurvesVals();
}

function updateCurve(vals, color) {
  var canv = getNode("curves");
  var canvx = canv.getContext('2d');
  canvx.clearRect(0,0,canv.width,canv.height);
  canvx.beginPath();
  for (var x=0; x<canv.width; x++) {
    canvx.moveTo(x, vals[x]);
    canvx.lineTo(x+1, vals[x+1]);
  }
  canvx.strokeStyle = color;
  canvx.stroke();
  canvx.closePath();
  canvx.beginPath();
  canvx.moveTo(0, canv.height);
  canvx.lineTo(canv.width, 0);
  canvx.strokeStyle = "rgba(255,255,255,0.34)";
  canvx.lineWidth = 2;
  canvx.stroke();
  canvx.closePath();
  var cx = getNode("curvesPreview").getContext('2d');
  cx.putImageData(tempData,0,0);
  var data = cx.getImageData(0,0,canvas.width,canvas.height);
  var d = data.data;
  for (var i=0; i<d.length; i+=4) {
    d[i] = (512 - valsCW[d[i]] - valsCR[d[i]])/2;
    d[i+1] = (512 - valsCW[d[i+1]] - valsCG[d[i+1]])/2;
    d[i+2] = (512 - valsCW[d[i+2]] - valsCB[d[i+2]])/2;
  }
  cx.putImageData(data,0,0);
}

function createSelection() {
  var mode = Selection.creatingType;
  var x2 = (event.pageX - $('#main_canvas').offset().left)/scale, y2 = (event.pageY - $('#main_canvas').offset().top)/scale;
  sel.globalAlpha = 1;
  sel.strokeStyle = 'white';
  sel.fillStyle = 'white';
  sel.lineWidth = 2;
  sel.clearRect(0,0,main_x,main_y);
  if (mode == 1) {
    Selection.points[0] = x1+2;
    Selection.points[1] = y1+2;
    Selection.points[2] = x2-2;
    Selection.points[3] = y2-2;
    sel.strokeRect(x1,y1,x2-x1,y2-y1);
  }
  if (mode == 2) {
    Selection.points[0] = x1+1;
    Selection.points[1] = y1+1;
    Selection.points[2] = x2+1;
    Selection.points[3] = y2+1;
    sel.beginPath();
    sel.ellipse(x1+(x2-x1)/2, y1+(y2-y1)/2, Math.abs((x2-x1)/2), Math.abs((y2-y1)/2), 0, 0, Math.PI*2);
    sel.stroke();
  }
  if (mode == 3) {
    var arr = Selection.points;
    if (arr == false) {arr.push(x1); arr.push(y1);}
    arr.push(x2); arr.push(y2);
    sel.beginPath();
    sel.moveTo(arr[0],arr[1]);
    for (var i=2; i<arr.length; i+=2) {
      sel.lineTo(arr[i], arr[i+1]);
      sel.moveTo(arr[i],arr[i+1]);
    }
    sel.closePath();
    sel.stroke();
  }
}

function setSelection(c) {
  var arr = Selection.points;
  if (arr == false) {c.restore();}
  else {
    c.save();
    c.beginPath();
    var mode = Selection.creatingType;
    if (mode == 1) {
      var ax = [arr[0], arr[2]], ay = [arr[1], arr[3]];
      Selection.left = Math.min.apply(Math, ax);
      Selection.top = Math.min.apply(Math, ay);
      Selection.width = Math.max.apply(Math, ax) - Selection.left;
      Selection.height = Math.max.apply(Math, ay) - Selection.top;

      c.rect(arr[0],arr[1],Selection.width,Selection.height);
    }
    else if (mode == 2) {
      var ax = [arr[0], arr[2]], ay = [arr[1], arr[3]];
      Selection.left = Math.min.apply(Math, ax);
      Selection.top = Math.min.apply(Math, ay);
      Selection.width = Math.max.apply(Math, ax) - Selection.left;
      Selection.height = Math.max.apply(Math, ay) - Selection.top;
      c.ellipse(arr[0]+(arr[2]-arr[0])/2, arr[1]+(arr[3]-arr[1])/2, (Selection.width)/2, (Selection.height)/2, 0, 0, Math.PI*2);
    }
    else if (mode == 3) {
      sel.beginPath();
      c.moveTo(arr[0],arr[1]);
      sel.moveTo(arr[0],arr[1]);
      for (var i=2; i<arr.length; i+=2) {
        c.lineTo(arr[i], arr[i+1]);
        sel.lineTo(arr[i], arr[i+1]);
      }
      sel.closePath();
      sel.stroke();
      var ax = [], ay = [];
      for (var i=0; i<arr.length; i+=2) {
        ax[i/2] = arr[i];
        ay[i/2] = arr[i+1];
      }
      Selection.left = Math.min.apply(Math, ax);
      Selection.top = Math.min.apply(Math, ay);
      Selection.width = Math.max.apply(Math, ax) - Selection.left;
      Selection.height = Math.max.apply(Math, ay) - Selection.top;
    }
    c.clip();
    c.closePath();
    Selection.btns = true;
    Array.prototype.forEach.call(document.getElementsByClassName("selButton"), (block) => {
      block.classList.add("visible");
      block.style.top = ((Selection.top)+(Selection.height/2)) + 'px';
    });
    getNode("cutSel").style.left = (Selection.left - 30) + 'px';
    getNode("copySel").style.left = (Selection.left + Selection.width + 10) + 'px';
  }
}

function selectionButtons(btn, bl) {
  if (!adding) {
    if (Selection.creatingType == btn) {resetInstrument(); return;}
    changeInst(bl); Selection.creatingType = btn;
    instrument = btn+7;
    updateCursor(6);
    if (Selection.btns)
    Array.prototype.forEach.call(document.getElementsByClassName("selButton"), (block) => {
      block.classList.add("visible");
    });
  }
}

function removeSelection() {
  sel.clearRect(0,0,main_x,main_y);
  Selection.btns = false;
  Selection.creating = true;
  Selection.points = [];
  ctx.restore();
  Array.prototype.forEach.call(document.getElementsByClassName("selButton"), (block) => {
    block.classList.remove("visible");
  });
}

function infoCoords() {
  getNode("infoX").innerText = "X: " + Math.floor(ctxX/scale); getNode("infoY").innerText = "Y: " + Math.floor(ctxY/scale);
}

function getDownloadBase64() {
  dl.clearRect(0,0,main_x,main_y);
  dl.drawImage(getNode('bg_canvas'),0,0);
  dl.drawImage(getNode('main_canvas'),0,0);
  dl.globalAlpha = tr2;
  dl.drawImage(getNode('undo_canvas1'),0,0);
  var mm, fm;
  if (getNode("jpg").checked) {mm="image/jpeg";}
    else if (getNode("png").checked) {mm="image/webp";}
      else if (getNode("webp").checked) {mm="image/webp";}
  var q = getNode("downloadQuality").value / 10;
  base64 = getNode('dl_canvas').toDataURL(mm, q);
  console.log(base64);
  var length = base64.length - 'data:image/png;base64,'.length;
  var sizeInBytes = Math.round(4 * Math.ceil((length / 3))*0.5624896334383812);
  var step = "B";
  if (sizeInBytes > 1024) {
    sizeInBytes = Math.round(sizeInBytes * 100 / 1024) / 100; step = "KB";
    if (sizeInBytes > 1024) {
      sizeInBytes = Math.round(sizeInBytes * 100 / 1024) / 100; step = "MB";
    }
  }
  getNode("fileSize").innerText = '~ ' + sizeInBytes + step;
}

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////

document.addEventListener('keydown', function(event) {
  if (event.shiftKey) {
    shift = true;
  }
  if (event.ctrlKey || event.metaKey) {ctrl = true; updateCursor(-2);}
  if (event.code == "Space" && !$("input").is(":focus")) {$("#colorButton").click();}
  if (event.code == 'KeyX' && !$("input").is(":focus")) {swapColors();}
  if (event.code == 'Enter' && adding && !$("input").is(":focus")) {$(".imgApply")[0].click();}
  if (event.code == 'Escape' && adding) {$(".imgCancel")[0].click();}
  if (event.code == 'KeyB' && !$("input").is(":focus")) {$('#brushButton').click();}
  if (event.code == 'KeyG' && !$("input").is(":focus")) {$('#fillButton').click();}
  if (event.code == 'KeyE' && !$("input").is(":focus")) {$('#eraserButton').click();}
  if (event.code == 'KeyP' && !$("input").is(":focus")) {$('#pipetteButton').click();}
  if (event.code == 'Digit0' && ctrl && !$("input").is(":focus")) {$('#zoom-info').click();}
  if (event.code == 'KeyZ' && ctrl && !$("input").is(":focus")) {
    event.preventDefault(); $("#undoButton").click();
  }
  //console.log(event.code);
});

document.addEventListener('keyup', function(event) {
  if (event.code == 'Backspace' && adding == 2) {updateInputWidth(getNode("addedText"));}
  if (event.key == "Shift") {shift = false;}
  if (event.key = "Control" || event.metaKey) {ctrl = false; updateCursor(instrument);}
  //console.log(event);
});

document.addEventListener('wheel', function(event) {
  if (event.ctrlKey == true) {
    event.preventDefault();
    var e = event || window.event;
    var m=0;
    var delta = e.deltaY || e.detail || e.wheelDelta;
    if (delta < 0) {
      scale2 += 0.05;
      m=1;
    }
    else {
      scale2 -= 0.05;
      m=-1
    }
    if (scale1+scale2 > 4) scale2 = 4-scale1; else if (scale1+scale2 < 0.1) scale2 = 0.1-scale1;
    scale = scale1+scale2;
    updateZoom(m);
  }
}, { passive: false});

Array.prototype.forEach.call([getNode('copySel'), getNode('cutSel')], function(el, mode){
  el.addEventListener('mousedown', function(){
    var canv = document.createElement('canvas');
    var canvx = canv.getContext('2d');
    canv.width = Selection.width;
    canv.height = Selection.height;
    canvx.imageSmoothingEnabled = false;
    addImg.width = canv.width;
    addImg.height = canv.height;
    var m = Selection.creatingType;
    if (m == 2) {
      canvx.ellipse(canv.width/2, canv.height/2, canv.width/2, canv.height/2, 0, 0, Math.PI*2);
      canvx.clip();
    }
    else if (m == 3) {
      var arr = Selection.points;
      canvx.beginPath();
      canvx.moveTo(arr[0]-Selection.left,arr[1]-Selection.top);
      for (var i=2; i<arr.length-3; i+=2) {
        canvx.lineTo(arr[i]-Selection.left, arr[i+1]-Selection.top);
      }
      canvx.closePath();
      canvx.clip();
    }
    canvx.drawImage(canvas, -Selection.left, -Selection.top);
    var url = canv.toDataURL();
    addImg.src = url;
    addImage(url);
    if (mode) {
      ctx.clearRect(Selection.left, Selection.top, Selection.width, Selection.height);
      Selection.cut = true;
    }
    removeSelection();
  });
});

  un1.addEventListener("mousedown", function() {
    if (instrument != 6 && !ctrl && !correctingBool && !adding) {
      un2.getContext('2d').clearRect(0,0,main_x,main_y); un2.getContext('2d').drawImage(canvas,0,0);
      if (!(instrument>2 && instrument < 6)) {ctx.globalAlpha = tr1; un1.style.opacity = tr1;}
      else {
        ctx.globalAlpha = 1; un1.style.opacity = 1;
      }
      isDrawing = 1;
      if (instrument) {
        ctx.drawImage(un1,0,0);
      }
    }
    if (Selection.creatingType && !ctrl) {
      if (getNode('selectionCanvas')) getNode('selectionCanvas').remove();
      select = document.createElement('canvas');
      select.setAttribute('id', 'selectionCanvas');
      sel = select.getContext('2d');
      select.width=main_x; select.height=main_y;
      document.getElementsByClassName("inin")[0].appendChild(select);
      removeSelection();
    }
    });
    document.getElementsByClassName("canvases")[0].addEventListener("mousedown", function() {
      x1 = (event.pageX - $('#main_canvas').offset().left)/scale; y1 = (event.pageY - $('#main_canvas').offset().top)/scale;
      ctxX = event.pageX - $('#main_canvas').offset().left; ctxY = event.pageY - $('#main_canvas').offset().top; tr2 = tr1;
    if (ctrl) {
      x1 = event.pageX; y1 = event.pageY;
      isMoving = 1;
    }
  });
  $('#undo_canvas1').click(function(){
      if (instrument == 6 && !ctrl) {
        pipette(ctx);
      }
      if (instrument == 7 && !ctrl) {fill();}
  });
  $(document).on("mousedown", '#size_slider', function() {
    isSliding = 1;
  });
  $("#contrastSlider").on("mousedown", function() {
    isSliding = 2;
  });
  $("#saturationSlider").on("mousedown", function() {
    isSliding = 3;
  });
  $("#brightnessSlider").on("mousedown", function() {
    isSliding = 4;
  });
  $("#temperatureSlider").on("mousedown", function() {
    isSliding = 5;
  });
  $('#image_border #imgMove').on("mousedown", function() {
    if (!ctrl) {x1 = event.pageX - $('#main_canvas').offset().left; y1 = event.pageY - $('#main_canvas').offset().top; isMoving = 1;}
  });
  $("#image_border #imgBordRB").on("mousedown", function() {
    if (!ctrl) {x1 = event.pageX - $('#main_canvas').offset().left; y1 = event.pageY - $('#main_canvas').offset().top; isMoving = 2;}
  });
  $("#image_border #imgBordLT").on("mousedown", function() {
    if (!ctrl) {x1 = event.pageX - $('#main_canvas').offset().left; y1 = event.pageY - $('#main_canvas').offset().top; isMoving = 3;}
  });
  $("#image_border #imgBordRT").on("mousedown", function() {
    if (!ctrl) {x1 = event.pageX - $('#main_canvas').offset().left; y1 = event.pageY - $('#main_canvas').offset().top; isMoving = 4;}
  });
  $("#image_border #imgBordLB").on("mousedown", function() {
    if (!ctrl) {x1 = event.pageX - $('#main_canvas').offset().left; y1 = event.pageY - $('#main_canvas').offset().top; isMoving = 5;}
  });
  $(".imgRotate").on("mousedown", function() {
    if (!ctrl) {y1 = event.pageY - $('#main_canvas').offset().top; isMoving =6;}
  });
  $('#textMove').on("mousedown", function() {
    if (!ctrl) if (!$('#text_border input').is(":hover")) {x1 = event.pageX - $('#main_canvas').offset().left; y1 = event.pageY - $('#main_canvas').offset().top; isMoving = 1;}
  });

  $(document).on("mouseup", function() {
    isDrawing = 0; isSliding = 0; isMoving = 0;
    if (lastAct) {
      un1.style.opacity = 1;
    }
    if (instrument != 6) {
      if (!(instrument>2 && instrument<6))ctx.globalAlpha = tr1;
      if (instrument != 1) ctx.drawImage(un1,0,0); else {
        if (!getNode("penType").selectedIndex) ctx.drawImage(un1,0,0);
        else penBrush(getNode("penType").selectedIndex);
      }
      undo.clearRect(0,0,main_x,main_y);
    }
    if (Selection.creating) {
      Selection.creating = 0;
      setSelection(ctx);
    }
    if (adding == 1 || adding == 3) {InImg.top = getNode("image_border").offsetTop; InImg.left = getNode("image_border").offsetLeft;
    InImg.height = getNode("image_border").offsetHeight; InImg.width = getNode("image_border").offsetWidth;}
    else if (adding == 2) {InImg.top = getNode("text_border").offsetTop; InImg.left = getNode("text_border").offsetLeft;}
    canvX = document.getElementsByClassName('in')[0].offsetLeft; canvY = document.getElementsByClassName('in')[0].offsetTop;
    circle = null;
  });

  $(document).on("mousemove", function(event) {
    if (isDrawing == 1) {if (instrument==3) {drawLine(undo); lastAct = false;}
                         if (instrument==4) {drawRect(undo); lastAct = false;}
                         if (instrument==5) {drawArc(undo); lastAct = false;}
                         if (instrument==1) {lastAct = false; drawing(undo, event, ctxX, ctxY);}
                         if (instrument==2) {lastAct = false; drawing(ctx, event, ctxX, ctxY);}
                        }
    if (isSliding) {
      if (isSliding == 1) {sliding(event);}
      if (isSliding == 2) {colorCorrection(0);}
      if (isSliding == 3) {colorCorrection(1);}
      if (isSliding == 4) {colorCorrection(2);}
      if (isSliding == 5) {colorCorrection(3);}
    }
    if (circle) {moveCircle(circle, event.pageX - $('#curvesContainer').offset().left, event.pageY - $('#curvesContainer').offset().top);}
    if (Selection.creating) {createSelection(Selection.creatingType);}
    if (isMoving == 1 && !ctrl) {moveImg(event);}
    if (isMoving == 1 && ctrl) {moveCanvas(event);}
    if (isMoving > 1) {
      switch (isMoving) {
        case 2: imgResize(event, false, false); break;
        case 3: imgResize(event, true, true); break;
        case 4: imgResize(event, false, true); break;
        case 5: imgResize(event, true, false); break;
        case 6: imgRotate(event); break;
      }
    }
    getNode("cursor").style.left = event.pageX-size/2-cBorder + 'px';
    getNode("cursor").style.top = event.pageY-size/2-cBorder + 'px';
    ctxX = event.pageX - $('#main_canvas').offset().left; ctxY = event.pageY - $('#main_canvas').offset().top;
  });

$('#clearButton').click(function(){
  console.log(1)
  if (!adding) {
    console.log(2)
    ctx.drawImage(un1, 0, 0); un2.getContext('2d').clearRect(0, 0, main_x, main_y);
    un2.getContext('2d').drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, main_x, main_y);   undo.clearRect(0, 0, main_x, main_y);
  }
});

getNode('exchange-colors').addEventListener("click", swapColors);

document.getElementsByClassName('inin')[0].addEventListener('mousemove', infoCoords);
document.getElementsByClassName('inin')[0].addEventListener('mouseleave', function(){
  getNode('infoX').innerText = "Вне"; getNode('infoY').innerText = "холста";
});


$('#brushButton').click(function(){
  if (instrument == 1) {resetInstrument(); return;}
  if (!adding && !correctingBool) {
    changeInst(this); instrument=1;
    updateCursor(1);
    instBlock.innerHTML = '<span class="flexed" style="color: white; height: 100%; margin: 0px 15px;">Размер пера: </span><div class="flexed" id="brush-size"><span style="text-align: center; width: 100%;">'+size+'px</span><div class="slider flexed" id="size_slider"><div style="position: relative; width: 100%;"><div class="slider_button" style="left:' + (size-10) + 'px;"></div> <div class="slider_line"><div style="width:'+ size +'px;"></div></div></div></div></div><select id="penType" style="margin:0px 10px;"><option>Обычное перо</option>  <option>Тонкие края</option>  <option>Карандаш</option>  <option>Плавная линия</option></select>';
  }
});

$('#eraserButton').click(function(){
  if (instrument == 2) {resetInstrument(); return;}
  if (!adding && !correctingBool) {
    changeInst(this); instrument=2;
    updateCursor(2);
    instBlock.innerHTML = '<span class="flexed" style="color: white; height: 100%; margin: 0px 15px;">Размер пера: </span><div class="flexed" id="brush-size"><span style="text-align: center; width: 100%;">'+size+'px</span><div class="slider flexed" id="size_slider"><div style="position: relative; width: 100%;"><div class="slider_button" style="left:' + (size-10) + 'px;"></div> <div class="slider_line"><div style="width:'+ size +'px;"></div></div></div></div></div>';
  }
});

$('#fillButton').click(function(){
  if (instrument == 7) {resetInstrument(); return;}
  if (!adding && !correctingBool) {
    changeInst(this); instrument=7;
    updateCursor(7);
    instBlock.innerHTML = '<span style="margin: 0px 15px;">Допуск: </span><input type="number" min="0" max="255" id="fillWeight" style="width: 55px;" class="borderedInput" placeholder="0-255"/>';
  }
});

$('#lineButton').click(function(){
  if (instrument == 3) {resetInstrument(); return;}
  if (!adding && !correctingBool) {
    changeInst(this); instrument = 3;
    updateCursor(3);
    instBlock.innerHTML = '<span class="flexed" style="color: white; height: 100%; margin: 0px 15px;">Толщина линии: </span><div class="flexed" id="brush-size"><span style="text-align: center; width: 100%;">'+size+'px</span><div class="slider flexed" id="size_slider"><div style="position: relative; width: 100%;"><div class="slider_button" style="left:' + (size-10) + 'px;"></div> <div class="slider_line"><div style="width:'+ size +'px;"></div></div></div></div></div><select id="lineType" style="margin:0px 10px;"><option>Прямые края</option>  <option>Скруглённые края</option>  <option>Стрелка</option></select>';
  }
});

$('#rectButton').click(function(){
  if (instrument == 4) {resetInstrument(); return;}
  if (!adding && !correctingBool) {
    changeInst(this); instrument = 4;
    updateCursor(4);
    instBlock.innerHTML = '<span class="flexed" style="color: white; height: 100%; margin: 0px 15px;">Толщина контура: </span><div class="flexed" id="brush-size"><span style="text-align: center; width: 100%;">'+size+'px</span><div class="slider flexed" id="size_slider"><div style="position: relative; width: 100%;"><div class="slider_button" style="left:' + (size-10) + 'px;"></div> <div class="slider_line"><div style="width:'+ size +'px;"></div></div></div></div></div><label class="input-cont flexed"><input id="strokeShape" type="checkbox" /><div class="input-style"></div><span>Обводка контура</span></label><label class="input-cont flexed"><input id="fillShape" type="checkbox" checked /><div class="input-style"></div><span>Заливка</span></label>';
  }
});

$('#arcButton').click(function(){
  if (instrument == 5) {resetInstrument(); return;}
  if (!adding && !correctingBool) {
    changeInst(this); instrument = 5;
    updateCursor(5);
    instBlock.innerHTML = '<span class="flexed" style="color: white; height: 100%; margin: 0px 15px;">Толщина контура: </span><div class="flexed" id="brush-size"><span style="text-align: center; width: 100%;">'+size+'px</span><div class="slider flexed" id="size_slider"><div style="position: relative; width: 100%;"><div class="slider_button" style="left:' + (size-10) + 'px;"></div> <div class="slider_line"><div style="width:'+ size +'px;"></div></div></div></div></div><label class="input-cont flexed"><input id="strokeShape" type="checkbox" /><div class="input-style"></div><span>Обводка контура</span></label><label class="input-cont flexed"><input id="fillShape" type="checkbox" checked /><div class="input-style"></div><span>Заливка</span></label>';
  }
});

$('#pipetteButton').click(function(){
  if (instrument == 6) {resetInstrument(); return;}
  if (!adding && !correctingBool) {
    changeInst(this); instrument = 6;
    updateCursor(6);
  }
});

$('#colorButton').click(function(){
  var block = document.getElementsByClassName("color_square_container")[0];
  toggleVisible(block);
});

$('#undoButton').click(function(){
  if (!lastAct) {
    var temp1 = ctx.getImageData(0,0,main_x,main_y);
    var temp2 = un2.getContext('2d').getImageData(0,0,main_x,main_y);
    ctx.clearRect(0,0,main_x,main_y); ctx.putImageData(temp2,0,0);
    un2.getContext('2d').clearRect(0,0,main_x,main_y); un2.getContext('2d').putImageData(temp1,0,0);
  }
});

$('#zoominButton').click(function(){scale2 += 0.2; if (scale1+scale2>4) scale2=4-scale1; scale = scale1+scale2; updateZoom(1);});
$('#zoomoutButton').click(function(){scale2 -= 0.2; if (scale1+scale2<0.1) scale2=0.1-scale1; scale = scale1+scale2; updateZoom(-1);});

$('#zoom-info').click(function(){
  scale2 = 0; canvX = 0; canvY = 0;
  document.getElementsByClassName("in")[0].style.top = (canvY) + 'px';
  document.getElementsByClassName("in")[0].style.left = (canvX) + 'px';
  scale = scale1 + scale2;
  updateZoom();
  if (ctrl && shift) {
    getNode("TEST").style.display = "flex";
    var blocks = document.getElementsByClassName("imgRotate");
    for (var i=0; i<blocks.length; i++) blocks[i].style.display = "flex";
  }
});

$('#applyProps').click(function(){
  applyColorCorrection();
});

getNode("rectselButton").addEventListener("click",function(){
  selectionButtons(1, this);
});

getNode("arcselButton").addEventListener("click",function(){
  selectionButtons(2, this);
});

getNode("lassoButton").addEventListener("click",function(){
  selectionButtons(3, this);
});

$(document).on("click", "#brush-size span", function(){
  var block = getNode("size_slider");
  toggleVisible(block);
})

$('#imagePropsButton').click(function(){
    block = getNode("imageProperties");
    correctingBool = toggleVisible(block);
    resetInstrument();
    canvas.style.filter = "brightness("+(100+colCorrect[2])+"%) contrast("+(100+colCorrect[0])+"%) saturate("+(100+colCorrect[1])+"%)";
  if (correctingBool) {
    var div = document.createElement('div'); div.setAttribute('id','tempFilter');
    document.getElementsByClassName('in')[0].appendChild(div);
  }
  if (!correctingBool) {
    canvas.style.filter = "";
    document.getElementsByClassName('in')[0].removeChild(getNode('tempFilter'));
  }
});

$('.filter').click(function(){
  var mode = [].indexOf.call(document.getElementsByClassName("filter"), this);
  getNode("filterPower").value = 100;
  console.log("Selected filter index is " + mode);
  var canvx = getNode("filterPreview");
  applyFilter(canvx, mode);
  colCorrect[4] = mode;
  var blocks = document.getElementsByClassName("filter");
  for (var i=0; i<blocks.length; i++) blocks[i].getElementsByTagName("span")[0].style.background = "";
  this.getElementsByTagName("span")[0].style.background = "green";
});

$('#downloadButton').click(function(){
  var block = document.getElementsByClassName("overlay_container")[0];
  toggleVisible(block);
  for (var i=0; i<overlay.length; i++) overlay[i].style.display = "none";
  getNode("download_container").style.display = "flex";
  getDownloadBase64();
});

$(".layers_container .show-hide-btn").click(function(){
  var block = document.getElementsByClassName("layers_container")[0];
  toggleVisible(block);
});

$("#imageButton").click(function(){
  if (!adding) {
    var block = document.getElementsByClassName("overlay_container")[0];
    toggleVisible(block);
    for (var i=0; i<overlay.length; i++) overlay[i].style.display = "none";
    getNode("addImg_container").style.display = "flex";
    getNode("imageLink").focus(); getNode("imageLink").select();
  }
});

$(".overlay_dark").click(function(){
  var block = document.getElementsByClassName("overlay_container")[0];
  toggleVisible(block);
});

$("#addImage").click(function(){
  var tried = false;
  var url = getNode("imageLink").value;
  var file = getNode("imageFile").files[0];
  var msg = getNode("addImg_container").getElementsByClassName("errorText")[0];
  if (document.getElementsByName("file")[0].checked) {
    var reader = new FileReader();
    reader.onload = function() {
      addImg.src = reader.result;
      url = reader.result;
    }
    reader.readAsDataURL(file);
  }
  if (document.getElementsByName("file")[1].checked) {
  if (url == '') {
    msg.innerText = "Введите ссылку на изображение";
  } else {
    msg.innerText = '';
    addImg.src = url;
  }
  }

    addImg.onerror = function() {
      if (!tried) {addImg.src = "https://cors-anywhere.herokuapp.com/"+url; tried = true; return;}
      msg.innerText = "Невозможно загрузить изображение"; return;
    }
    addImg.onload = function (e) {
      msg.innerText = '';
      addImage(url);
  }
});

document.onpaste = function(event){
  if (!$("input").is(":focus")) {
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    var url;
    for (var index in items) {
      var item = items[index];
      if (item.kind === 'file') {
        var blob = item.getAsFile();
        var reader = new FileReader();
        reader.onload = function(event){
        url = reader.result;
        addImg.src = url;
      addImg.onload = function (e) {
      addImage(url);
      }
      };
        reader.readAsDataURL(blob);
      }
    }
  }
}

$(document).on('click', ".imgCancel", function(){
  instBlock.innerHTML = "";
  if (adding == 1) {
    getNode("image_border").style.display = "none";
    getNode("addedImage").style.display = "none";
    getNode("addedImage").style.backgroundImage = "none";
  } else if (adding == 2) {
    getNode("text_border").style.display = "none";
  } else if (adding == 3) {
    getNode("image_border").style.display = "none";
    canvas.style.filter = ""; getNode('bg_canvas').style.filter = "";
  }
  if (!correctingBool) {var blocks = document.getElementsByClassName("button");
                        for (var i=0; i<blocks.length; i++) blocks[i].style.color = "";}
  adding = 0;
});

$(document).on('click', ".imgApply", function(){
  if (!Selection.cut) {
    un2.getContext('2d').clearRect(0,0,main_x,main_y);
    un2.getContext('2d').drawImage(canvas,0,0);
  }
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = true;
  if (adding == 1) {
    ctx.save();
    ctx.translate(InImg.left+InImg.width/2, InImg.top+InImg.height/2);
    ctx.rotate(InImg.angle * Math.PI / 180);
    ctx.drawImage(addImg, -InImg.width/2, -InImg.height/2, InImg.width, InImg.height);
    ctx.restore();
    getNode("image_border").style.display = "none";
    getNode("addedImage").style.display = "none";
    getNode("addedImage").style.backgroundImage = "none";
  } else if (adding == 2) {
    ctx.beginPath();
    var i = getNode("addedText");
    var t = i.value;
    var style;
    var fSize = getNode("fontSize").value;
    var Shift = 0;
    if (InImg.textFont == 3) {
      Shift = fSize / 2.8;
      style = "ComicSans, cursive, sans-serif";
    }
    if (InImg.textFont == 2) {
      Shift = fSize / 8;
      style = "Impact, sans-serif"
    }
    if (InImg.textFont == 0) {
      Shift = fSize / 7;
      style = "Arial, sans-serif";
    }
    if (InImg.textFont == 1) {
      Shift = fSize / 7;
      style = "TimesNewRoman, sans"
    }
    var res = fSize + "px " + style;
    if (getNode("boldText").checked) res = "bold " + res;
    if (getNode("italicText").checked) res = "italic " + res;
    ctx.font = res;
    ctx.textAlign = "center"
    ctx.textBaseline = "top";
    var container = getNode("text_border");
    InImg.textStroke = getNode("strokeText").checked;
    ctx.save();
    ctx.translate(InImg.left+container.offsetWidth/2, InImg.top+container.offsetHeight/2);
    ctx.rotate(InImg.angle * Math.PI / 180);
    if (InImg.textStroke) {
      var stroke = fSize / 12;
      ctx.lineWidth = stroke;
      ctx.strokeStyle = selectedColor2;
      ctx.strokeText(t,0, -container.offsetHeight/2+12+Shift);
    }
    ctx.fillStyle = selectedColor;
    ctx.fillText(t, 0, -container.offsetHeight/2+12+Shift);
    ctx.restore();
    getNode("text_border").style.display = "none";
    ctx.closePath();
  } else if (adding == 3) {
    var D = ctx.getImageData(InImg.left, InImg.top, Math.abs(InImg.left)+InImg.width-2, Math.abs(InImg.top)+InImg.height-2);
    updateCanvas(InImg.width-2, InImg.height-2);
    ctx.putImageData(D,0,0);
    getNode("image_border").style.display = "none";
    canvas.style.filter = ""; getNode('bg_canvas').style.filter = "";
    var block = getNode("pasteImg");
    block.classList.remove("visible");
    var checker = getNode("pasteImg").getElementsByTagName("input")[0];
    checker.checked = false;
  }

  instBlock.innerHTML = "";
  if (!correctingBool) {var blocks = document.getElementsByClassName("button");
                        for (var i=0; i<blocks.length; i++) blocks[i].style.color = "";}
  adding = 0;
  ctx.imageSmoothingEnabled = false;
  Selection.cut = false;
});

$("#textButton").click(function(){
    if (!adding) {
      document.getElementsByClassName("imgRotate")[0].style.display = "";
      adding = 2;
      resetInstrument();
    instBlock.innerHTML = '<div class="imgApply flexed"><span></span></div><div class="imgCancel flexed">×</div>   <label class="fontSize"><div>T<span>↕</span></div><input type="number" min="0" id="fontSize" placeholder="px"/></label>   <select id="fontStyle" style="margin:0px 10px;"><option style="font-family:Arial, sans-serif;" value="Arial, sans-serif">Arial</option> <option style="font-family:TimesNewRoman, sans;" value="TimesNewRoman, sans">Times New Roman</option> <option style="font-family:Impact, sans-serif;" value="Impact, sans-serif">Impact</option> <option style="font-family:ComicSans, cursive, sans-serif" value="ComicSans, cursive, sans-serif">Comic Sans</option></select><label class="input-cont flexed"><input id="strokeText" type="checkbox" /><div class="input-style"></div><span>Обводка текста</span></label><label class="input-cont flexed"><input id="boldText" type="checkbox" /><div class="input-style"></div><span>Жирный</span></label><label class="input-cont flexed"><input id="italicText" type="checkbox" /><div class="input-style"></div><span>Курсив</span></label>';
    getNode("fontSize").value = InImg.textSize;
    getNode("fontStyle").selectedIndex = InImg.textFont;
    getNode("strokeText").checked = InImg.textStroke;
    getNode("boldText").checked = InImg.textBold;
    getNode("italicText").checked = InImg.textItalic;
    getNode("textMove").style.transform = '';
    getNode("addedText").style.fontSize = InImg.textSize + 'px';
    updateInputWidth(getNode("addedText"));
    getNode("text_border").style.display = "block";
    InImg.left = (main_x-getNode("text_border").offsetWidth)/2;
    InImg.top = (main_y-getNode("text_border").offsetHeight)/2;
    console.log(getNode("text_border").offsetWidth, getNode("text_border").offsetHeight);
    InImg.angle = 0;
    $("#text_border").css({
      "top":InImg.top+'px',
      "left":InImg.left+'px'
    });
    }
  });

  $("#text_border input").on("keypress", function() {
    updateInputWidth(this);
  });

  $(document).on("change","#fontSize", function() {
    InImg.textSize = getNode("fontSize").value;
    getNode("addedText").style.fontSize = InImg.textSize + 'px';
    updateInputWidth(getNode("addedText"));
  });

  $(document).on("click","#fontStyle", function() {
    InImg.textFont = this.selectedIndex;
    var t = this.options[this.selectedIndex].value;
    getNode("addedText").style.fontFamily = t;
    updateInputWidth(getNode("addedText"));
  });

  $(document).on("change","#boldText", function() {
    InImg.textBold = this.checked;
    this.checked ? getNode("addedText").style.fontWeight = "bold" : getNode("addedText").style.fontWeight = "";
  });

  $(document).on("change","#italicText", function() {
    InImg.textItalic = this.checked;
    this.checked ? getNode("addedText").style.fontStyle = "italic" : getNode("addedText").style.fontStyle = "";
  });

getNode("dim_presetFile").onchange = function(e) {
    var file = this.files[0];
    var reader = new FileReader();
    reader.onload = function() {
      url = reader.result;
      bgImg.src = url;
      bgImg.onload = function() {
        getNode("canvasWidth").value = this.width;
        getNode("canvasHeight").value = this.height;
        updateCanvasPreview();
      }
    }
    reader.readAsDataURL(file);
    var fileName = '';
	  fileName = e.target.value.split( "\\" ).pop();
    if (fileName.length > 25) fileName = fileName.slice(0, 25) + "...";
    this.nextElementSibling.innerText = fileName;
    var block = getNode("pasteImg");
    block.classList.add("visible");
    var checker = getNode("pasteImg").getElementsByTagName("input")[0];
    checker.checked = true;
    this.files = undefined;
};

$('.dim_preset').click(function(){
  var mode = $('.dim_preset').index(this);
  var w = getNode("canvasWidth"), h = getNode("canvasHeight");
  if (mode == 0) {w.value = 1920; h.value = 1080;}
  else if (mode == 1) {w.value = 1280; h.value = 720;}
  else if (mode == 2) {w.value = 1600; h.value = 1600;}
  var block = getNode("pasteImg");
  block.classList.remove("visible");
  var checker = getNode("pasteImg").getElementsByTagName("input")[0];
  checker.checked = false;
  updateCanvasPreview();
});

$('#canvasWidth, #canvasHeight').on('change', function(){
  var block = getNode("pasteImg");
  block.classList.remove("visible");
  var checker = getNode("pasteImg").getElementsByTagName("input")[0];
  checker.checked = false;
  if (getNode("link").checked) {
    if (this == getNode("canvasWidth")) getNode("canvasHeight").value = Math.round(this.value * main_y / main_x);
    else getNode("canvasWidth").value = Math.round(this.value * main_x / main_y);
  }
  updateCanvasPreview();
});

getNode("updateCanvas").addEventListener("click", function(){
  var w = parseInt(getNode("canvasWidth").value), h = parseInt(getNode("canvasHeight").value);
  updateCanvas(w, h);
  var checker = getNode("pasteImg").getElementsByTagName("input")[0];
  if (checker.checked) {
    ctx.drawImage(bgImg,0,0);
  }
  var block = document.getElementsByClassName("overlay_container")[0];
  toggleVisible(block);
});

getNode("newCanvasButton").addEventListener("click", function(){
  if (!adding) {
    var block = document.getElementsByClassName("overlay_container")[0];
    toggleVisible(block);
    for (var i=0; i<overlay.length; i++) overlay[i].style.display = "none";
    getNode("editCanvas_container").style.display = "flex";
    getNode("canvasWidth").value = main_x; getNode("canvasHeight").value = main_y;
    updateCanvasPreview();
  }
});

getNode("openFiltersButton").addEventListener("click", function(){
  var block = document.getElementsByClassName("overlay_container")[0];
  toggleVisible(block);
  for (var i=0; i<overlay.length; i++) overlay[i].style.display = "none";
  getNode("filters_container").style.display = "flex";
  var canv = getNode("filterPreview");
  var canvx = canv.getContext('2d');
  if (canvas.width > canvas.height) {canv.width = 400; canv.height = 400 * (canvas.height/canvas.width);}
    else if (canvas.width < canvas.height) {canv.height = 400; canv.width = 400 * (canvas.width/canvas.height);}
      else {canv.height = 400; canv.width = 400;}
  canvx.drawImage(canvas, 0, 0, canv.width, canv.height);
  canvx.drawImage(un1, 0, 0, canv.width, canv.height);
  tempData = canvx.getImageData(0,0,canv.width,canv.height);
  var blocks = document.getElementsByClassName("filter");
  for (var i=0; i<blocks.length; i++) blocks[i].getElementsByTagName("span")[0].style.background = "";
});

getNode("applyFilter").addEventListener("click", function(){
  applyFilter(canvas, colCorrect[4]);
  var block = document.getElementsByClassName("overlay_container")[0];
  toggleVisible(block);
});

getNode("filterPower").addEventListener("change", function(){
  var canvx = getNode("filterPreview");
  applyFilter(canvx, colCorrect[4]);
});

getNode("applySharpness").addEventListener("click", function(){
  var pow = getNode("sharpInput").value / 100;
  if (pow < 0 || pow > 5) pow = 0.5;
  applySharpness(canvas, 0, pow, 0);
});

getNode("downloadBtn").addEventListener("click", function(){
  var fm;
  if (getNode("jpg").checked) {fm="jpg";}
    else if (getNode("png").checked) {fm="png";}
      else if (getNode("webp").checked) {fm="webp";}
  var link = document.createElement('a');
  var name = getNode("downloadName").value;
  if (!name) name = "mordegaard-paint";
  link.download = name+"."+fm;
  link.href = base64;
  link.click();
  dl.globalAlpha = 1;
});

getNode("cropButton").addEventListener("click", function(){
  if (!adding) {
    document.getElementsByClassName("imgRotate")[0].style.display = "none";
    getNode("grid").style.display = "";
    resetInstrument();
    if (correctingBool) $('#imagePropsButton').click();
    canvas.style.filter = "brightness(0.5)"; getNode('bg_canvas').style.filter = "brightness(0.5)";
    var brd = getNode("image_border");
    instBlock.innerHTML = '<div class="imgApply flexed"><span></span></div><div class="imgCancel flexed">×</div><span style="margin-left:20px;">Оригинал: </span><span id="origRes">'+main_x+'x'+main_y+'</span><span style="margin-left:20px;">Новое разрешение: </span><span id="newRes">'+main_x+'x'+main_y+'</span>';
    $("#image_border").css({
      "display":"block",
      "width":main_x+"px",
      "height":main_y+"px",
      "top":"0",
      "left":"0",
      "backdrop-filter":"brightness(2)"
    });
    InImg.left = 0; InImg.top = 0; InImg.width = main_x; InImg.height = main_y; InImg.prop = main_y/main_x; InImg.angle = 0;
    getNode("full_img_border").style.transform = "";
    adding = 3;
  }
});

getNode("flipV").addEventListener('click',function(){flip(false, true);});
getNode("flipH").addEventListener('click',function(){flip(true, false);});

getNode("blurPower").addEventListener('mouseup',function(){
  var canv = getNode("blurPreview");
  var canvx = canv.getContext('2d');
  canvx.clearRect(0,0,canv.width,canv.height);
  canvx.putImageData(tempData,0,0);
  var pow = Math.floor(this.value / main_x * canv.width)
  if (getNode("gaussian").checked) StackBlur.canvasRGBA(canv, 0, 0, canv.width, canv.height, pow);
});

getNode("openBlurButton").addEventListener('click',function(){
  var block = document.getElementsByClassName("overlay_container")[0];
  toggleVisible(block);
  for (var i=0; i<overlay.length; i++) overlay[i].style.display = "none";
  getNode("blur_container").style.display = "flex";
  getNode("blurPower").value = 0;
  var canv = getNode("blurPreview");
  var canvx = canv.getContext('2d');
  if (canvas.width > canvas.height) {canv.width = 400; canv.height = 400 * (canvas.height/canvas.width);}
    else if (canvas.width < canvas.height) {canv.height = 400; canv.width = 400 * (canvas.width/canvas.height);}
      else {canv.height = 400; canv.width = 400;}
  canvx.drawImage(canvas, 0, 0, canv.width, canv.height);
  canvx.drawImage(un1, 0, 0, canv.width, canv.height);
  tempData = canvx.getImageData(0,0,canv.width,canv.height);
});

getNode("applyBlurBtn").addEventListener('click',function(){
  ctx.globalAlpha = tr1; un2.getContext('2d').clearRect(0,0,main_x,main_y); un2.getContext('2d').drawImage(canvas,0,0);
  var weight = getNode("blurPower").value;
  toggleVisible(document.getElementsByClassName("overlay_container")[0]);
  applyBlur(canvas, 0, weight);
});

getNode("openHistogramButton").addEventListener('click',function() {
  var block = document.getElementsByClassName("overlay_container")[0];
  toggleVisible(block);
  for (var i=0; i<overlay.length; i++) overlay[i].style.display = "none";
  getNode("histogram_container").style.display = "flex";
  generateHistogram();
});

getNode("curves").addEventListener("dblclick",function(e){
  if (getNode('curveWhite').checked) {var X = cx, Y = cy}
  else if (getNode('curveRed').checked) {var X = cxr, Y = cyr}
    else if (getNode('curveGreen').checked) {var X = cxg, Y = cyg}
      else if (getNode('curveBlue').checked) {var X = cxb, Y = cyb}
  var x2 = e.pageX - $(this).offset().left;
  var y2 = e.pageY - $(this).offset().top;
  var block = this.parentElement;
  var circle = document.createElement("div");
  circle.classList.add("circle");
  circle.style.top = y2 + 'px'; circle.style.left = x2 + 'px';
  block.appendChild(circle);
  var index = [].indexOf.call(block.children, circle);
  X[index] = x2;
  Y[index] = y2;
  if (X[X.length-1] != this.width) {X.push(this.width); Y.push(0);}
  updateCurvesVals();
});

$(document).on("mousedown", "#curves_container .circle", function(){
  circle = this;
});

$(document).on("dblclick", "#curves_container .circle", function(){
  if (getNode('curveWhite').checked) {var X = cx, Y = cy}
  else if (getNode('curveRed').checked) {var X = cxr, Y = cyr}
    else if (getNode('curveGreen').checked) {var X = cxg, Y = cyg}
      else if (getNode('curveBlue').checked) {var X = cxb, Y = cyb}
  var canv = getNode("curves");
  var index = [].indexOf.call(this.parentElement.children, this);
  X.splice(index,1); Y.splice(index,1);
  this.parentElement.removeChild(this);
  updateCurvesVals();
});

$(".curve_channels").click(function(){
  var blocks = document.getElementsByClassName("curve_channels");
  var index = [].indexOf.call(blocks, this);
  if (index == 0) {var X = cx, Y = cy}
  else if (index == 1) {var X = cxr, Y = cyr}
    else if (index == 2) {var X = cxg, Y = cyg}
      else if (index == 3) {var X = cxb, Y = cyb}
  if (X[X.length-1] != 256) {X.push(256); Y.push(0);}
  var canv = getNode("curves");
  updateCurvesVals(this);
  var block = getNode("curvesContainer");
  var l = block.children.length;
  if (l > 1) {
    for (var i=1; i<l; i++) {block.removeChild(block.lastChild);}
  }
  for (var i=1; i<X.length-1; i++) {
    var b = document.createElement('div');
    b.classList.add('circle');
    b.style.left = X[i] + 'px';
    b.style.top = Y[i] + 'px';
    block.appendChild(b);
  }
});

getNode("applyCurvesBtn").addEventListener('click',function() {
  ctx.globalAlpha = tr1; un2.getContext('2d').clearRect(0,0,main_x,main_y); un2.getContext('2d').drawImage(canvas,0,0);
  toggleVisible(document.getElementsByClassName("overlay_container")[0]);
  var vals = [];
  for (var i=0; i < 256; i++) {vals[i] = CSPL.evalSpline(i, cx, cy, ck);}
  var data = ctx.getImageData(0,0,main_x,main_y);
  var d = data.data;
  for (var i=0; i<d.length; i+=4) {
    d[i] = (512 - valsCW[d[i]] - valsCR[d[i]])/2;
    d[i+1] = (512 - valsCW[d[i+1]] - valsCG[d[i+1]])/2;
    d[i+2] = (512 - valsCW[d[i+2]] - valsCB[d[i+2]])/2;
  }
  ctx.putImageData(data,0,0);
});

getNode("openCurvesButton").addEventListener('click',function() {
  var block = document.getElementsByClassName("overlay_container")[0];
  toggleVisible(block);
  for (var i=0; i<overlay.length; i++) overlay[i].style.display = "none";
  getNode("curves_container").style.display = "flex";
  getNode("curveWhite").checked = true;
  var canv = getNode("curvesPreview");
  var canvx = canv.getContext('2d');
  if (canvas.width > canvas.height) {canv.width = 320; canv.height = 320 * (canvas.height/canvas.width);}
    else if (canvas.width < canvas.height) {canv.height = 320; canv.width = 320 * (canvas.width/canvas.height);}
      else {canv.height = 320; canv.width = 320;}
  canvx.drawImage(canvas, 0, 0, canv.width, canv.height);
  canvx.drawImage(un1, 0, 0, canv.width, canv.height);
  tempData = canvx.getImageData(0,0,canv.width,canv.height);
  canv = getNode("curves");
  canvx = canv.getContext('2d');
  canvx.clearRect(0,0,canv.width,canv.height);
  canvx.beginPath();
  canvx.moveTo(0, canv.height);
  canvx.lineTo(canv.width, 0);
  canvx.strokeStyle = "white";
  canvx.stroke();
  canvx.closePath();
  cx = [0,256]; cy= [256,0]; ck = []; cxr = [0,256]; cyr = [256,0]; ckr = []; cxg = [0,256]; cyg = [256,0]; ckg = []; cxb = [0,256]; cyb = [256,0]; ckb = [];
  var block = getNode("curvesContainer");
  var l = block.children.length;
  if (l > 1) {
    for (var i=1; i<l; i++) {block.removeChild(block.lastChild);}
  }
});

[].forEach.call(document.getElementsByName("format"), function(el, ind) {
  el.addEventListener('click', function() {
    getNode("fileFormat").innerText = '.' + this.value;
    getDownloadBase64();
  });
});

getNode("downloadQuality").addEventListener("change", function() {
  getDownloadBase64();
});

resetInstrument();

 });
