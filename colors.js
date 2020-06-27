function rgb_to_hsv(r,g,b){
var r1 = r / 255;
var g1 = g / 255;
var b1 = b / 255;
RGBmax = Math.max(r1, g1, b1);
RGBmin = Math.min(r1, g1, b1);
d = RGBmax - RGBmin;
value = RGBmax;
if (d != 0) {
  saturation = d / value;
  if (RGBmax == r1) {hue = 60 * ((g1-b1) / d % 6);}
  if (RGBmax == g1) {hue = 60 * ((b1-r1) / d + 2);}
  if (RGBmax == b1) {hue = 60 * ((r1-g1) / d + 4);}
  } else {saturation = 0; hue = 0;}

if (hue < 0) hue = 360 + hue;
return [hue, saturation, value];
}

function hsv_to_rgb(h,s,v) {
s = s / 100; v = v / 100;
c = v*s;
x = c * (1 - Math.abs((h/60) % 2 - 1));
m = v-c;
r1 = 0; g1 = 0; b1 = 0;
if (h >= 0 && hue < 60) {r1 = c; g1 = x; b1 = 0;} else
if (h >= 60 && hue < 120) {r1 = x; g1 = c; b1 = 0;} else
if (h >= 120 && hue < 180) {r1 = 0; g1 = c; b1 = x;} else
if (h >= 180 && hue < 240) {r1 = 0; g1 = x; b1 = c;} else
if (h >= 240 && hue < 300) {r1 = x; g1 = 0; b1 = c;} else
if (h >= 300 && hue <= 360) {r1 = c; g1 = 0; b1 = x;}
red = Math.round((r1 + m) * 255); green = Math.round((g1 + m) * 255); blue = Math.round((b1 + m) * 255);
return [red, green, blue];
}

function color_line(event) {
  var y = event.pageY - $('.color_line').offset().top;
  if (y < 0) y=0; if (y > 255) y=255;
  $(".color_line div").css('transform', 'translateY(' + y + 'px)');
  hue = y*360/255;
  var result = hsv_to_rgb(hue, 100, 100);
  var red=result[0]; var green=result[1]; var blue=result[2];
  document.getElementsByTagName('html')[0].style.setProperty('--hue-col', 'rgb('+red+','+green+','+blue+')');
  var result = hsv_to_rgb(hue,saturation,value);
  var red=result[0]; var green=result[1]; var blue=result[2];
  document.getElementsByTagName('html')[0].style.setProperty('--sel-col', 'rgb('+red+','+green+','+blue+')');
  return;
}
  
function transparent_line(event) {
  var y = event.pageY - $('.color_line').offset().top;
  if (y < 0) y=0; if (y > 255) y=255;
  $(".transparent_line .bump").css('transform', 'translateY(' + y + 'px)');
  transparency = 1 - y/255;
  return;
}

function color_sqr(event) {
  var x = -255 + event.pageX - $('.color_sqr').offset().left;
  if (x > 0) x = 0; if (x < -255) x = -255;
  var y = event.pageY - $('.color_sqr').offset().top;
  if (y > 255) y = 255; if (y < 0) y = 0;
  $("#color_selector").css('transform', 'translate(' + x + 'px,' + y + 'px)');
  saturation = 100 + x/255*100; value = 100 - y/255*100;
  var result = hsv_to_rgb(hue,saturation,value);
  var red=result[0]; var green=result[1]; var blue=result[2];
  document.getElementsByTagName('html')[0].style.setProperty('--sel-col', 'rgb('+red+','+green+','+blue+')');
  return;
}

$(document).ready(function() {
  var bg = document.getElementById('bg_canvas').getContext('2d');
  square_drop = 0; line_drop = 0; transparency_drop = 0;
  $('#color_square').on("mousedown", function() {
    square_drop = 1;
  });
  $('.color_line').on("mousedown", function() {
    line_drop = 1;
  });
  $('.transparent_line').on("mousedown", function() {
    transparency_drop = 1;
  });
  $(document).on("mouseup", function() {
    square_drop = 0; line_drop = 0; transparency_drop = 0;
  });
  $(document).on("mousemove", function() {
    if (square_drop) {color_sqr(event);}
    if (line_drop) {color_line(event);}
    if (transparency_drop) {transparent_line(event);}
  });

  $('#updateBrush').click(function() {
    if (value >= 75) {$('#updateBrush').css('color', 'black'); $('#colorButton').css('color', 'black');} else {$('#updateBrush').css('color', 'white'); $('#colorButton').css('color', 'white');}
    var color = hsv_to_rgb(hue, saturation, value);
    var ready_color = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
    var tr_color = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + transparency + ')';
    tr1 = transparency;
    document.getElementById("pagemax").style.setProperty("--main-col", tr_color);
    selectedColor = ready_color;
  });
  
  $('#updateBrush2').click(function() {
    if (value >= 75) {$('#updateBrush2').css('color', 'black');} else {$('#updateBrush2').css('color', 'white');}
    var color = hsv_to_rgb(hue, saturation, value);
    var ready_color = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
    var tr_color = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + transparency + ')';
    tr11 = transparency;
    document.getElementById("pagemax").style.setProperty("--sec-col", tr_color);
    selectedColor2 = ready_color;
  });

  $('#updateBackground').click(function() {
    if (value >= 75) {$('#updateBackground').css('color', 'black');} else {$('#updateBackground').css('color', 'white');}
    var color = hsv_to_rgb(hue, saturation, value);
    var ready_color = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + transparency + ')';
    document.getElementById("pagemax").style.setProperty("--bg-col", tr_color);
    bgColor = ready_color;
    bg.fillStyle = ready_color; bg.clearRect(0,0,main_x,main_y);
    bg.rect(0,0,main_x,main_y); bg.fill();
  });
});