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
  var y = event.pageY - $('#colorLine').offset().top;
  if (y < 0) y=0; if (y > 255) y=255;
  document.getElementById("lineSelector").style.top = `${y}px`;
  hue = y/255*360;
  document.getElementsByTagName('html')[0].style.setProperty('--hue-col', 'hsl('+hue+'deg,100%,50%)');
  var result = hsv_to_rgb(hue,saturation,value);
  var red=result[0]; var green=result[1]; var blue=result[2];
  document.getElementsByTagName('html')[0].style.setProperty('--sel-col', 'rgb('+red+','+green+','+blue+')');
  return;
}

function transparent_line(event) {
  var y = event.pageY - $('#colorLine').offset().top;
  if (y < 0) y=0; if (y > 255) y=255;
  document.getElementById("transparencySelector").style.top = `${y}px`;
  transparency = 1 - y/255;
  return;
}

function color_sqr(event) {
  var x = event.pageX - $('#colorSquare').offset().left;
  if (x > 255) x = 255; if (x < 0) x = 0;
  var y = event.pageY - $('#colorSquare').offset().top;
  if (y > 255) y = 255; if (y < 0) y = 0;
  document.getElementById("squareSelector").style.top = `${y}px`;
  document.getElementById("squareSelector").style.left = `${x}px`;
  saturation = x/255*100; value = (255 - y)/255*100;
  var result = hsv_to_rgb(hue,saturation,value);
  var red=result[0]; var green=result[1]; var blue=result[2];
  document.getElementsByTagName('html')[0].style.setProperty('--sel-col', 'rgb('+red+','+green+','+blue+')');
  return;
}

function updateSelector() {
  document.getElementById("squareSelector").style.top = 255 - value/100*255 + 'px';
  document.getElementById("squareSelector").style.left = saturation/100*255 + 'px';
  document.getElementById("lineSelector").style.top = hue/360*255 + 'px';
  document.getElementById("transparencySelector").style.top = 255 - transparency*255 + 'px';
  var res = hsv_to_rgb(hue, saturation, value);
  document.getElementsByTagName('html')[0].style.setProperty('--sel-col', 'rgb('+res[0]+','+res[1]+','+res[2]+')');
  document.getElementsByTagName('html')[0].style.setProperty('--hue-col', 'hsl('+hue+'deg,100%,50%)');
}

$(document).ready(function() {
  var bg = document.getElementById('bg_canvas').getContext('2d');
  document.getElementById("colorSquare").addEventListener("mousedown", function(){
    document.addEventListener("mousemove", color_sqr, false);
  });
  document.getElementById("colorLine").addEventListener("mousedown", function(){
    document.addEventListener("mousemove", color_line, false);
  });
  document.getElementById("transparentLine").addEventListener("mousedown", function(){
    document.addEventListener("mousemove", transparent_line, false);
  });
  document.addEventListener("mouseup", function(){
    document.removeEventListener("mousemove", color_sqr);
    document.removeEventListener("mousemove", color_line);
    document.removeEventListener("mousemove", transparent_line);
  });

  $('#updateBrush').click(function() {
    if (value >= 75) $('#updateBrush').css('color', 'black')
    else $('#updateBrush').css('color', 'white');
    var color = hsv_to_rgb(hue, saturation, value);
    var ready_color = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
    var tr_color = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + transparency + ')';
    tr1 = transparency;
    document.getElementById("pagemax").style.setProperty("--main-col", tr_color);
    selectedColor = ready_color;
    red1 = color[0]; green1 = color[1]; blue1 = color[2];
  });

  $('#updateBrush2').click(function() {
    if (value >= 75) $('#updateBrush2').css('color', 'black')
    else $('#updateBrush2').css('color', 'white');
    var color = hsv_to_rgb(hue, saturation, value);
    var ready_color = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
    var tr_color = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + transparency + ')';
    tr11 = transparency;
    document.getElementById("pagemax").style.setProperty("--sec-col", tr_color);
    selectedColor2 = ready_color;
    red2 = color[0]; green2 = color[1]; blue2 = color[2];
  });

  $('#updateBackground').click(function() {
    if (value >= 75) $('#updateBackground').css('color', 'black')
    else $('#updateBackground').css('color', 'white');
    var color = hsv_to_rgb(hue, saturation, value);
    var ready_color = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + transparency + ')';
    document.getElementById("pagemax").style.setProperty("--bg-col", ready_color);
    bgColor = ready_color;
    bg.fillStyle = ready_color; bg.clearRect(0,0,main_x,main_y);
    bg.rect(0,0,main_x,main_y); bg.fill();
  });
});
