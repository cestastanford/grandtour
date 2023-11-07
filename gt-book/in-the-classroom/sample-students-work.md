---
layout: article
title: "Sample Students’ Work"
author: 
session: 5
chapter: 4
---

<figure>

<a name="figure-1" class="fig"> <img src="megregian-figure-1.png" id="fig1"  onclick="zoom(this, null, getElementById(&apos;cap1&apos;))"/> </a>

<figcaption id="cap1">

<b>“Classical Scholars” on the Grand Tour</b> Brennan Megregian investigated the tours of travelers labeled as “classical scholars” to see whether they revealed anything unexpected about their collective interests. After using the <i>Grand Tour Explorer</i> to extract the travel data for those tourists identified in the “Employers and Identifiers” field as “classical scholars,” she then used Palladio to map their trips.

</figcaption>

</figure>

<div class="overlay" id="popup" style="display:flex; flex-direction:column; flex-wrap: wrap; background: #f7f6f3">
    <div id="imgs" style="height:80%">
        <div class="overlay-close">
            <a><i class="material-icons">close</i></a>
        </div>
        <img id="img">
        <img id="img2">
    </div>
    <div id="capWrapper" style="height:20%">
        <p id="cap" style="float:left; max-width:80%; position:relative; left:120px; display:inline-block"></p>
        <div style="display:inline-block; float: right">
            <div style="display:flex; flex-direction:column; position:relative; right:100px; top:20px">
                <i class="material-icons link-cite" aria-label="Cite this image" data-balloon-pos="left">format_quote</i>
                <i class="material-icons link-copy" aria-label="Copy link to this image" data-balloon-pos="left">link</i>
                <i class="material-icons" aria-label="Download" data-balloon-pos="left">arrow_downward</i>
            </div>
        </div>
    </div>
</div>

<script>
function zoom(obj, obj2, caption) {
    var popup = document.getElementById("popup");
    popup.style.maxHeight = "90%";
    popup.style.height = "90%"
    var image = document.getElementById("img");
    var image2 = document.getElementById("img2");
        
    image.src = obj.src;
    image.style.display = "block";
    image.style.marginLeft = "auto";
    image.style.marginRight = "auto";
    image.style.left = "0";
    image.style.right = "0";
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = "contain";

    image2.style.display = "none"; // hide in case Fig 1 or 2 were clicked
    document.getElementById("capWrapper").style.width = image.offsetWidth;

    if (obj2 != undefined && obj2 != null) { // Figure 1 & 2 are paired
        image.style.float = "left";
        image.style.width = "50%";

        image2.src = obj2.src;
        
        image2.style.display = "block";
        image2.style.marginLeft = "auto";
        image2.style.marginRight = "auto";
        image2.style.left = "0";
        image2.style.right = "0";
        image2.style.float = "left";
        image2.style.width = "50%";
        image2.style.height = "100%";
        image2.style.objectFit = "contain";

        document.getElementById("capWrapper").style.width = image.offsetWidth + image2.offsetWidth; 
    }
    var cap = document.getElementById("cap");
    if (caption != undefined && caption != null) {
        cap.innerHTML = caption.innerHTML;
        cap.style.display = "block";
        cap.style.marginTop = "20px";
    } else {
        cap.style.display = "none";
    }
    var overlays = document.getElementsByClassName("overlay");
      for (overlay of overlays) {
        overlay.classList.remove("visible");
      }
    popup.classList.add("visible"); 
}    
</script>