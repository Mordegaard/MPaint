$(document).ready(function(){

class InImage {
  constructor() {
    this.Top = 0; this.Left = 0; this.Width = 0; this.Height = 0; this.Prop = 1;
  }
}

var canvas = document.getElementById('main_canvas');
var ctx = canvas.getContext('2d');
var bg = document.getElementById('bg_canvas').getContext('2d');
var dl = document.getElementById('dl_canvas').getContext('2d');
var un2 = document.getElementById('undo_canvas2');
var un1 = document.getElementById('undo_canvas1');
var undo = un1.getContext('2d');
var lastAct = false, text = false, adding = false;
var isMoving = 0;
var instrument = 0;
var x1, x2, y1, y2;
var shift = false;
let InImg = new InImage();
var addImg = new Image(); addImg.setAttribute("crossorigin", "anonymous");
var angle = 0, saved_inst = "";
main_x = document.getElementById('main_canvas').width;
main_y = document.getElementById('main_canvas').height;
size = 2;
red = 255; green = 0; blue = 0; hue = 0; saturation = 100; value = 100; transparency = 1; tr1 = transparency; tr11 = transparency; tr2 = tr1;
bgColor = '#ffffff';
selectedColor = '#ff0000';
selectedColor2 = '#000000';
$('#l1').css('background','#348bee');
bg.fillStyle = bgColor; bg.fillRect(0,0,main_x,main_y);

function changeInst() {
  brush = -1; instrument = 0; $("#inst-setting").html("");
}
  
function sliding() {
var x = event.pageX - $('#size_slider .slider_line').offset().left - 10;
width = $('#size_slider .slider_line').width() - 10;
if (x > width ) x = width;
if (x < -10) x = -10;
$('#size_slider .slider_button').css('left', x);
size = Math.round((x + 13) / 2);
$('.brush_size').text(size + "px" );
$('.slider_line div').css('width', (x + 13) + 'px');
$('#cursor').css({'width':size+'px', 'height':size+'px', 'transform':'translate(-'+size/2+'px, -'+size/2+'px'});
}

function clearCircle(context,x,y,radius) {
  context.save();
  context.beginPath();
  context.arc(x, y, radius, 0, 2*Math.PI, true);
  context.clip();
  context.clearRect(x-radius,y-radius,radius*2,radius*2);
  context.restore();
  context.globalAlpha = tr1;
}

function drawing(event, x, y) {
  var x1 = event.pageX - $('#main_canvas').offset().left;
  var y1 = event.pageY - $('#main_canvas').offset().top;
    undo.beginPath();
    undo.lineWidth = 0;
    undo.fillStyle = selectedColor;
    undo.arc(x, y, Math.trunc(size/2), 0, 2*Math.PI);
    undo.fill();
    undo.arc(x1, y1, Math.trunc(size/2), 0, 2*Math.PI);
    undo.fill();
    undo.closePath();
    
    undo.beginPath();
    undo.strokeStyle = selectedColor;
    undo.lineWidth = size;
    undo.moveTo(x,y);
    undo.lineTo(x1, y1);
    undo.stroke();
    undo.closePath();
}

function pipette(canvas) {
      var x = event.pageX - $('#main_canvas').offset().left; var y = event.pageY - $('#main_canvas').offset().top;
      var p = undo.getImageData(x, y, 1, 1).data;
      if (!p[3]) p = ctx.getImageData(x, y, 1, 1).data;
      if (!p[3]) p = document.getElementById("bg_canvas").getContext("2d").getImageData(0, 0, 1, 1).data;
      var color = 'rgb(' + p[0] + ',' + p[1] + ',' + p[2] + ')';
      selectedColor = color;
  	  tr1 = p[3]/255; //ctx.globalAlpha = p[3];
      document.getElementById("pagemax").style.setProperty("--main-col", color);
      $("#color_selector").css('background', color);
      var hsv = rgb_to_hsv(p[0], p[1], p[2]);
      x = Math.round(-255 + hsv[1]*255); y = Math.round(255 - hsv[2]*255);
      $("#color_selector").css('transform', 'translate(' + x + 'px,' + y + 'px)');
      $("#color_square").css('background', 'hsl(' + hsv[0] + ',100%,50%)');
      if (hsv[2] >= 0.75) {$('#colorButton').css('color', 'black');} else {$('#colorButton').css('color', 'white');}
      return p[3];
}

function drawLine(context) {
  if (shift) {
    if (Math.abs(angle) > 0.707) {
      x2 = event.pageX - $('#main_canvas').offset().left;
      y2 = y1;
    } else {
      x2 = x1;
      y2 = event.pageY - $('#main_canvas').offset().top;
    }
  } else {
  x2 = event.pageX - $('#main_canvas').offset().left;
  y2 = event.pageY - $('#main_canvas').offset().top;
  }
  context.clearRect(0,0,main_x,main_y);
  context.beginPath();
  context.strokeStyle = selectedColor;
  context.lineWidth = size;
  context.moveTo(x1,y1);
  context.lineTo(x2,y2);
  context.stroke();
  context.closePath();
}
  
function drawRect(context) {
  x2 = event.pageX - $('#main_canvas').offset().left;
  y2 = event.pageY - $('#main_canvas').offset().top;
  var xt = x1, yt = y1;
  context.clearRect(0,0,main_x,main_y);
  context.beginPath();
  context.strokeStyle = selectedColor;
  context.lineWidth = size;
  if (shift) {context.rect(xt+size/2,yt+size/2, x2-xt-size, x2-xt-size);} else {
    if (x2 < x1) {xt = x2; x2 = x1;}; if (y2 < y1) {yt = y2; y2 = y1;}
    context.rect(xt+size/2,yt+size/2, x2-xt-size, y2-yt-size);
  }
  context.stroke();
  context.closePath();
}
  
function drawArc(context) {
  x2 = event.pageX - $('#main_canvas').offset().left;
  y2 = event.pageY - $('#main_canvas').offset().top;
  var sqX = (x2 - x1) * (x2 - x1);
  var sqY = (y2 - y1) * (y2 - y1);
  var rad =  Math.sqrt(sqX + sqY) - size / 2;
  context.clearRect(0,0,main_x,main_y);
  context.beginPath();
  context.strokeStyle = selectedColor;
  context.lineWidth = size;
  if (shift) context.arc(x1,y1, rad, 0, Math.PI * 2); else
    context.ellipse(x1, y1, Math.abs(x2-x1), Math.abs(y2-y1), 0, 0, Math.PI * 2);
  context.stroke();
  context.closePath();
}

function moveImg(event) {
  var x2 = event.pageX - $('#main_canvas').offset().left, y2 = event.pageY - $('#main_canvas').offset().top;
  var width = x2 - x1, height = y2 - y1;
  if (!text) {
    document.getElementById("image_border").style.top = (InImg.Top + height) + "px";
    document.getElementById("image_border").style.left = (InImg.Left + width) + "px";
    document.getElementById("addedImage").style.top = (InImg.Top + height) + "px";
    document.getElementById("addedImage").style.left = (InImg.Left + width) + "px";
  } else {
    document.getElementById("text_border").style.top = (InImg.Top + height) + "px";
    document.getElementById("text_border").style.left = (InImg.Left + width) + "px";
  }
}
  
function imgResize(event, wR, hR) {
  var x2 = event.pageX - $('#main_canvas').offset().left, y2 = event.pageY - $('#main_canvas').offset().top;
  if (!shift) {var width = x2 - x1, height = y2 - y1;}
  else {var width = x2 - x1, height = width * InImg.Prop;}
  var W = InImg.Width + width; var H = InImg.Height + height;
  if (wR) W = InImg.Width - width; if (hR) H = InImg.Height - height;
  document.getElementById("image_border").style.width = W + "px";
  document.getElementById("image_border").style.height = H + "px";
  document.getElementById("addedImage").style.width = W + "px";
  document.getElementById("addedImage").style.height = H + "px";
  if (wR) {
    document.getElementById("image_border").style.left = (InImg.Left + width) + "px";
    document.getElementById("addedImage").style.left = (InImg.Left + width) + "px";
  }
  if (hR) {
    document.getElementById("image_border").style.top = (InImg.Top + height) + "px";
    document.getElementById("addedImage").style.top = (InImg.Top + height) + "px";
  }
}

function swapColors() {
  var temp = selectedColor;
  var tempB = getComputedStyle(document.getElementById("pagemax")).getPropertyValue("--main-col");
  var tempC = $("#updateBrush").css('color');
  var tempT = tr1;
  selectedColor = selectedColor2;
  selectedColor2 = temp;
  document.getElementById("pagemax").style.setProperty("--main-col", getComputedStyle(document.getElementById("pagemax")).getPropertyValue("--sec-col"));
  document.getElementById("pagemax").style.setProperty("--sec-col", tempB);
  $("#updateBrush").css('color', $("#updateBrush2").css('color') );
  $("#colorButton").css('color', $("#updateBrush2").css('color') );
  $("#updateBrush2").css('color', tempC);
  tr1 = tr11; tr11 = tempT;
  
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
  
document.addEventListener('keydown', function(event) {
  if (event.code == 'KeyZ' && (event.ctrlKey || event.metaKey)) {
    if (!lastAct) {
      var temp1 = ctx.getImageData(0,0,main_x,main_y);
      var temp2 = un2.getContext('2d').getImageData(0,0,main_x,main_y);
      ctx.clearRect(0,0,main_x,main_y); ctx.putImageData(temp2,0,0);
      un2.getContext('2d').clearRect(0,0,main_x,main_y); un2.getContext('2d').putImageData(temp1,0,0);
    }
  }
  if (event.shiftKey) {
    shift = true;
    if (instrument == 1) {
      var a = [x2-x1, y2-y1]; var b = [10, 0];
      angle = (a[0]*b[0] + a[1]*b[1]) / ( 10 * Math.sqrt(a[0]*a[0] + a[1]*a[1]) );
    }
  }
  if (event.code == 'KeyX' && !$("input").is(":focus")) {swapColors();}
  if (event.code == 'Enter' && adding) {$(".imgApply")[0].click();}
  if (event.code == 'Escape' && adding) {$(".imgCancel")[0].click();}
  if (event.code == 'KeyB' && !$("input").is(":focus")) {$('#brushButton').click();}
  if (event.code == 'KeyE' && !$("input").is(":focus")) {$('#eraserButton').click();}
  //console.log(event.code);
});
  
document.addEventListener('keyup', function(event) {
  if (event.code == 'Backspace' && text) {updateInputWidth(document.getElementById("addedText"));}
});
  
document.addEventListener('keyup', function(event) {
  if (event.key == "Shift") {
    shift = false;
  }
});

var isDrawing = 0; isSliding = 0; brush = 1;

  $('#undo_canvas1').on("mousedown", function() {
    if (instrument != 4 ) {ctx.globalAlpha = tr1; un2.getContext('2d').clearRect(0,0,main_x,main_y); un2.getContext('2d').drawImage(canvas,0,0);
      un1.style.opacity = tr1;  isDrawing = 1; ctxX = event.pageX - $('#main_canvas').offset().left; ctxY = event.pageY - $('#main_canvas').offset().top; tr2 = tr1;
      if (instrument) {
        ctx.drawImage(un1,0,0);
        x1 = event.pageX - $('#main_canvas').offset().left; y1 = event.pageY - $('#main_canvas').offset().top;
      }
    }
  });
  $('#undo_canvas1').click(function(){
    if (instrument == 4) {
      if (pipette(undo) == 0) {pipette(ctx);}
    }
  });
  $('#size_slider').on("mousedown", function() {
    isSliding = 1;
  });
  $('#image_border #full_img_border').on("mousedown", function() {
    x1 = event.pageX - $('#main_canvas').offset().left; y1 = event.pageY - $('#main_canvas').offset().top; isMoving = 1;
  });
  $("#image_border #imgBordRB").on("mousedown", function() {
    x1 = event.pageX - $('#main_canvas').offset().left; y1 = event.pageY - $('#main_canvas').offset().top; isMoving = 2;
  });
  $("#image_border #imgBordLT").on("mousedown", function() {
    x1 = event.pageX - $('#main_canvas').offset().left; y1 = event.pageY - $('#main_canvas').offset().top; isMoving = 3;
  });
  $("#image_border #imgBordRT").on("mousedown", function() {
    x1 = event.pageX - $('#main_canvas').offset().left; y1 = event.pageY - $('#main_canvas').offset().top; isMoving = 4;
  });
  $("#image_border #imgBordLB").on("mousedown", function() {
    x1 = event.pageX - $('#main_canvas').offset().left; y1 = event.pageY - $('#main_canvas').offset().top; isMoving = 5;
  });
  $('#text_border').on("mousedown", function() {
    if (!$('#text_border input').is(":hover")) {x1 = event.pageX - $('#main_canvas').offset().left; y1 = event.pageY - $('#main_canvas').offset().top; isMoving = 1;}
  });
  
  $(document).on("mouseup", function() {
    isDrawing = 0; isSliding = 0; isMoving = 0;
    if (lastAct) {
      un1.style.opacity = 1;
    }
    if (instrument != 4) {
      ctx.globalAlpha = tr1; ctx.drawImage(un1,0,0); undo.clearRect(0,0,main_x,main_y);
    }
    if (!text) {InImg.Top = document.getElementById("image_border").offsetTop; InImg.Left = document.getElementById("image_border").offsetLeft;
    InImg.Height = document.getElementById("image_border").offsetHeight; InImg.Width = document.getElementById("image_border").offsetWidth;}
    else {InImg.Top = document.getElementById("text_border").offsetTop; InImg.Left = document.getElementById("text_border").offsetLeft;}
  });
  
  $(document).on("mousemove", function() {
    if (isDrawing == 1) {if (instrument==1) {drawLine(undo); lastAct = false;}
                         if (instrument==2) {drawRect(undo); lastAct = false;}
                         if (instrument==3) {drawArc(undo); lastAct = false;}
                         if (brush == 1 && !instrument) {lastAct = false; drawing(event, ctxX, ctxY);}
                         if (brush == 0 && !instrument) {lastAct = false; clearCircle(ctx, ctxX, ctxY, size/2); } ctxX = event.pageX - $('#main_canvas').offset().left; ctxY = event.pageY - $('#main_canvas').offset().top; }
    if (isSliding == 1) {sliding(event);}
    if (isMoving == 1) {moveImg(event, text);}
    if (isMoving > 1) {
      if (isMoving == 2) imgResize(event, false, false);
      if (isMoving == 3) imgResize(event, true, true);
      if (isMoving == 4) imgResize(event, false, true);
      if (isMoving == 5) imgResize(event, true, false);
    }
    if ( $('#undo_canvas1').is(':hover') && !(instrument) ) {
      $('#cursor').css({'display': 'block', 'left': event.pageX, 'top': event.pageY}); 
    } if ( !$('#undo_canvas1').is(':hover') ) {$('#cursor').css('display', '');}
  });

$('#clearButton').click(function(){
  ctx.clearRect(0, 0, main_x, main_y);   undo.clearRect(0, 0, main_x, main_y);   un2.getContext('2d').clearRect(0,0,main_x,main_y);
});
  
$(document).on("click","#exchange-colors", swapColors);

$('#brushButton').click(function(){
  changeInst(); brush = 1; $('.button').css({'box-shadow':'','color':''}); $('#brushButton').css({'box-shadow':'0px 0px 0px 2px', 'color':'#348bee'}); $('canvas').css('cursor','');
});

$('#eraserButton').click(function(){
  changeInst(); brush = 0; $('.button').css({'box-shadow':'','color':''}); $('#eraserButton').css({'box-shadow':'0px 0px 0px 2px', 'color':'#348bee'}); 
  $('canvas').css('cursor','');
});


$('#lineButton').click(function(){
  changeInst(); instrument = 1; $('.button').css({'box-shadow':'','color':''}); $('#lineButton').css({'box-shadow':'0px 0px 0px 2px', 'color':'#348bee'}); 
  $('canvas').css('cursor','crosshair');
});
  
$('#rectButton').click(function(){
  changeInst(); instrument = 2; $('.button').css({'box-shadow':'','color':''}); $('#rectButton').css({'box-shadow':'0px 0px 0px 2px', 'color':'#348bee'}); 
  $('canvas').css('cursor','crosshair');
});
  
$('#arcButton').click(function(){
  changeInst(); instrument = 3; $('.button').css({'box-shadow':'','color':''}); $('#arcButton').css({'box-shadow':'0px 0px 0px 2px', 'color':'#348bee'}); 
  $('canvas').css('cursor','crosshair');
});

$('#pipetteButton').click(function(){
if (instrument != 4 ) {changeInst(); instrument = 4; $('.button').css({'box-shadow':'','color':''}); $('#pipetteButton').css({'box-shadow':'0px 0px 0px 2px','color':'#348bee'}); $('canvas').css('cursor','crosshair');}
  else {instrument = 0; $('#pipetteButton').css({'background':'','color':''}); $('canvas').css('cursor','');}
});

$('#colorButton').click(function(){
  if ( $('.color_square_container').css("display") == "none" ) {$('.color_square_container').css("display", "flex");}
  else {$('.color_square_container').css("display", "none");}
});

$('#downloadButton').click(function(){
dl.drawImage(document.getElementById('bg_canvas'),0,0);
dl.drawImage(document.getElementById('main_canvas'),0,0);
dl.globalAlpha = tr2;
dl.drawImage(document.getElementById('undo_canvas1'),0,0);
var dataURL = document.getElementById('dl_canvas').toDataURL("image/png");
    var link = document.createElement('a');
    link.download = "mordegaard-paint.png";
    link.href = dataURL;
    link.click();
dl.globalAlpha = 1;
});

$(".layers_container .show-hide-btn").click(function(){
  if ( $(".layers_container").css('transform') == "none" ) {$(".layers_container").css('transform', ''); $(".layers_container .show-hide-btn svg").css('transform','');}
  else {$(".layers_container").css('transform', 'none'); $(".layers_container .show-hide-btn svg").css('transform','rotate(180deg)');}
});
  
$("#imageButton").click(function(){
  document.getElementsByClassName("overlay_container")[0].style.display = "flex";
  document.getElementById("imageLink").focus(); document.getElementById("imageLink").select();
});
  
$(".overlay_dark").click(function(){
  document.getElementsByClassName("overlay_container")[0].style.display = "none";
});
  
$("#addImage").click(function(){
  text = false;
  var url = document.getElementById("imageLink").value;
  var file = document.getElementById("imageFile").files[0];
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
    $(".overlay .errorText").text("Введите ссылку на изображение");
  } else {
    $(".overlay .errorText").text('');
    addImg.src = url;
  }
  }
  
    addImg.onerror = function() {
      $(".overlay .errorText").text("Невозможно загрузить изображение"); return;
    }
    addImg.onload = function (e) {
      if (!adding) {
      adding = true;
      document.getElementById("full_img_border").innerHTML = "";
      saved_inst = document.getElementById("inst-settings").innerHTML;
      $("#inst-settings").html('<div class="imgApply flexed">✔</div><div class="imgCancel flexed">×</div>');
      InImg.Top = 0;
      InImg.Left = 0;
      document.getElementsByClassName("overlay_container")[0].style.display = "none";
      var w = addImg.width; var h = addImg.height;
      if (h > main_y) {
        w *= main_y / h; h = main_y; 
      }
      if (w > main_x) {
        h *= main_x/w; w  =main_x;
      }
      InImg.Width = w; InImg.Height = h;
      InImg.Prop = h / w;
      $("#image_border").css({
        "display":"block",
        "width":w+"px",
        "height":h+"px",
        "top":"0",
        "left":"0",
        "position":"absolute",
      });
      $("#addedImage").css({
        "background-image":"url("+url+")",
        "width":w+"px",
        "height":h+"px",
        "display":"block",
        "top":"0",
        "left":"0"
      });
      return;
    }
  }
});
  
document.onpaste = function(event){
  if (!$("input").is(":focus")) {
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    var url;
    for (index in items) {
      var item = items[index];
      if (item.kind === 'file') {
        var blob = item.getAsFile();
        var reader = new FileReader();
        reader.onload = function(event){
        var URL = reader.result;
        addImg.src = URL;
        console.log(URL);
      addImg.onload = function (e) {
      if (!adding) {
      adding = true;
      text = false;
      document.getElementById("full_img_border").innerHTML = "";
      saved_inst = document.getElementById("inst-settings").innerHTML;
      $("#inst-settings").html('<div class="imgApply flexed">✔</div><div class="imgCancel flexed">×</div>');
      InImg.Top = 0;
      InImg.Left = 0;
      document.getElementsByClassName("overlay_container")[0].style.display = "none";
      var w = addImg.width; var h = addImg.height;
      if (h > main_y) {
        w *= main_y / h; h = main_y; 
      }
      if (w > main_x) {
        h *= main_x/w; w  =main_x;
      }
      InImg.Width = w; InImg.Height = h;
      InImg.Prop = h / w;
      $("#image_border").css({
        "display":"block",
        "width":w+"px",
        "height":h+"px",
        "top":"0",
        "left":"0",
        "position":"absolute",
      });
      $("#addedImage").css({
        "background-image":"url("+URL+")",
        "width":w+"px",
        "height":h+"px",
        "display":"block",
        "top":"0",
        "left":"0"
      });
      return;
    }
      }
      };
        reader.readAsDataURL(blob);
      }
    }
  }
}
  
$(document).on('click', ".imgCancel", function(){
  adding = false;
  $("#inst-settings").html(saved_inst);
  if (!text) {
    $('#image_border').css('display','none');
    $('#addedImage').css({'display':'none','background-image':'none'});
  } else {
    $('#text_border').css('display','none');
  }
});
  
$(document).on('click', ".imgApply", function(){
  adding = false;
  un2.getContext('2d').clearRect(0,0,main_x,main_y); un2.getContext('2d').drawImage(canvas,0,0);
  ctx.globalAlpha = 1;
  if (!text) {
    ctx.drawImage(addImg, InImg.Left, InImg.Top, InImg.Width, InImg.Height);
    $('#image_border').css('display','none');
    $('#addedImage').css({'display':'none','background-image':'none'});
  } else {
    var i = document.getElementById("addedText")
    var t = i.value;
    var style = getComputedStyle(i).getPropertyValue("font");
    var Shift = 0;
    if (style.includes("ComicSans")) {
      Shift = document.getElementById("fontSize").options[document.getElementById("fontSize").selectedIndex].text;
      Shift = Shift.slice(0, Shift.length-2);
      Shift = parseInt(Shift) / 4;
    }
    console.log(style + "   " + Shift);
    ctx.font = style;
    ctx.textAlign = "start"
    ctx.textBaseline = "top";
    ctx.fillStyle = selectedColor;
    ctx.fillText(t, InImg.Left+13, InImg.Top+15+Shift);
    $('#text_border').css('display','none');
  }
  $("#inst-settings").html(saved_inst);
});
  
  $("#textButton").click(function(){
    if (!adding) {
      adding = true;
    text = true;
    saved_inst = document.getElementById("inst-settings").innerHTML;
    $("#inst-settings").html('<div class="imgApply flexed">✔</div><div class="imgCancel flexed">×</div>   <select id="fontSize" style="margin:0px 10px;"><option>4px</option> <option>8px</option> <option>12px</option> <option>15px</option> <option selected="selected">18px</option> <option>22px</option> <option>28px</option> <option>35px</option> <option>48px</option> <option>60px</option> <option>72px</option> <option>86px</option> <option>100px</option></select>   <select id="fontStyle" style="margin:0px 10px;"><option style="font-family:Arial, sans-serif;" value="Arial, sans-serif">Arial</option> <option style="font-family:TimesNewRoman, sans;" value="TimesNewRoman, sans">Times New Roman</option> <option style="font-family:Impact, sans-serif;" value="Impact, sans-serif">Impact</option> <option style="font-family:ComicSans, cursive, sans-serif" value="ComicSans, cursive, sans-serif">Comic Sans</option></select>');
    $("#text_border").css({
      "display":"block",
      "top":0,
      "left":0
    });
    $("#addedText").css({
      "font":"18px Arial, sans-serif"
    });
    updateInputWidth(document.getElementById("addedText"));
    }
  });
  
  $("#text_border input").on("keypress", function() {
    updateInputWidth(this);
  });
  
  $(document).on("click","#fontSize", function() {
    var t = this.options[this.selectedIndex].text;
    document.getElementById("addedText").style.fontSize = t;
    updateInputWidth(document.getElementById("addedText"));
  });
  
  $(document).on("click","#fontStyle", function() {
    var t = this.options[this.selectedIndex].value;
    document.getElementById("addedText").style.fontFamily = t;
    updateInputWidth(document.getElementById("addedText"));
  });
  
  $('#brushButton').click();
  
 });