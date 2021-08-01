/*
EVERY ANIMATED NODE NEEDS TO HAVE 'MRDGRD-animated' CLASS!!!
Use data-animation-text to add animation to text;
Use data-animation-speed to change animation's speed;
Use data-animation-property to change animation's additional property (second speed, number of repeats, etc)
Use data-animation-trigger to change animation's trigger: onload, onscroll;
Use Node.addAnimationCallback(callback) to add callback which will be fired after animation end;
Available text animations:
random-letters , falling-letters
*/

function randomInt(m1,m2=undefined) {
  if (m2 === undefined) return Math.floor(Math.random()*m1);
  else return Math.floor(Math.random() * (m2 - m1)) + m1;
}
function id(node) {
  return document.getElementById(node);
}
function cl(node) {
  return document.getElementsByClassName(node);
}
function tag(node) {
  return document.getElementsByTagName(node);
}
function name(node) {
  return document.getElementsByName(node);
}
Node.prototype.cl = function(node) {
  return this.getElementsByClassName(node);
}
Node.prototype.tag = function(node) {
  return this.getElementsByTagName(node);
}
Node.prototype.changeVisible = function(sel=undefined) {
  if (sel === undefined) {
    if (this.classList.contains("visible")) {
      sel = false;
      this.classList.remove("visible");
    } else {
      sel = true;
      this.classList.add("visible")
    }
  }
  else {
    sel ? this.classList.add("visible") : this.classList.remove("visible");
  }
  return sel;
};
Node.prototype.isInViewPort = function() {
  const rect = this.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};
Node.prototype.changeCSS = function(obj) {
  for (var i=0; i<Object.keys(obj).length; i++) {
    var n = Object.keys(obj)[i];
    this.style.setProperty(n, obj[n]);
  }
};
Node.prototype.addAnimationCallback = function(callback) {
  this.MRDGRDanimCallback = callback;
};

const Cookies = {
  set: (name, value, exp) => {
    var d = new Date();
    d.setTime(d.getTime() + (exp*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  },
  get: (name) => {
    name += "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }
}

document.addEventListener('DOMContentLoaded', (event) => {
const animations = {
  span: {
    blocks: [...cl("MRDGRD-animated")],
    scrollCheck: true,
    animationList: ["random-letters", "falling-letters"],
    animationFunctions: {
      randomLetters: function(block, max, speed, text) {
        [].forEach.call(block.tag("span"), (element,index)=>{
          var t = text[index];
          element.innerText = "";
          setTimeout(()=>{
            loop(element, 0, max, speed, t);
          }, index*speed+1);
        });
        if (block.MRDGRDanimCallback) setTimeout(()=>{block.MRDGRDanimCallback()}, speed*(text.length+max));
        function loop(bl, iteration, max, speed, letter) {
          var string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
          bl.innerText = string.charAt(randomInt(string.length));
          iteration++;
          if (iteration < max) {setTimeout(()=>{loop(bl, iteration, max, speed, letter)}, speed);}
          else bl.innerText = letter;
        }
      },
      fallingLetters: function(el, speed1, speed2) {
        var a = [...el.tag("span")];
        [].forEach.call(a, letter => {if (letter.innerText == '') letter.style.marginRight = "1ch";});
        function loop(a, speed1, speed2) {
          if (a.length > 0) {
            var i = randomInt(a.length);
            a[i].changeCSS({animation: speed1/1000 + "s MRDGRD-falling-letters forwards"});
            a.splice(i, 1);
            setTimeout(()=>{loop(a, speed1, speed2);}, speed2);
          } else if (el.MRDGRDanimCallback) setTimeout(()=>{el.MRDGRDanimCallback();}, speed1);
        }
        loop(a, speed1, speed2);
      }
    }
  }
};

[].forEach.call(animations.span.blocks, (el)=>{
  const attr = el.getAttribute("data-animation-text");
  const speed = parseInt(el.getAttribute("data-animation-speed"));
  const prop = parseInt(el.getAttribute("data-animation-property"));
  const trig = el.getAttribute("data-animation-trigger");
  if (!trig) trig = "onload"; if (!speed) speed = 1000;
  if (animations.span.animationList.includes(attr)) {
    var text = el.innerText;
    el.innerText = "";
    for (var i=0; i<text.length; i++) {
      var sp = document.createElement("span");
      sp.classList.add("MRDGRD-"+attr);
      sp.innerText = text[i];
      el.append(sp);
    };
    function startAnimation() {
      switch (attr) {
        case "random-letters":
          if (!prop) prop = 10;
          animations.span.animationFunctions.randomLetters(el, prop, speed, text);
          break;
          case "falling-letters":
          if (!prop) prop = 500;
          animations.span.animationFunctions.fallingLetters(el, prop, speed);
          break;
        }
    }
    if (trig == "onload") {
      window.addEventListener("load", startAnimation, false);
    } else if (trig == "onscroll") {
      function evt() {
        if (el.isInViewPort()) {
          startAnimation();
          document.removeEventListener("scroll", evt);
        }
      }
      document.addEventListener("scroll", evt, {passive: true});
    } else if (trig == "oncommand") {
      el.startAnimation = function() {
        startAnimation();
      }
    }
  }
});

const css = `
  @keyframes MRDGRD-falling-letters {
    0% {opacity: 0; transform: translateY(-100px);}
    100% {opacity: 1; transform: none;}
  }
  .MRDGRD-falling-letters {
    display: inline-block;
    opacity: 0;
  }
`;
const head = document.head || tag('head')[0],
      style = document.createElement('style');
head.appendChild(style);
style.appendChild(document.createTextNode(css));
});
