---
layout: article
title: "2. The British Arrival in Italy"
author: Rachel Midura
session: 4
chapter: 2
abstract: The development of pan-European transportation networks in the late seventeenth and early eighteenth centuries, including roadways, postal inns, and public stagecoaches, paved the way for British tourism in Italy. The <i> Grand Tour Explorer</i> provides valuable quantitative evidence to complement a traditional emphasis on the individual experience of travel. I use travel sequence data to infer the relative numbers of travelers arriving in Italy through different regions from the seventeenth century forward. The results challenge the predominance of the Mont Cenis pass in Savoy as the favored entry route of Grand Tourists, as travelers continued to arrive in large numbers via Lombardy and the Veneto/Tyrol region. Infrastructural reform of the mid-eighteenth century was a turning point for the popularity of Savoy, but profession, gender, social station, and geopolitical events also influenced traveler preferences.
references:
about: Rachel Midura is Assistant Professor of Early Modern European and Digital History at Virginia Polytechnic Institute and State University. Her first book project, tentatively titled <i>Princes of the Post: Power, Publicity, and Europe’s Postal Revolution (1500-1700)</i>, tells a new history of communications in early modern Europe. She finished her PhD in early modern European history in 2020 at Stanford University, where she was also a senior graduate research fellow at the Center for Spatial and Textual Analysis. Her work on mobility, exchange, and state power has most recently appeared in the Journal of Social History (“Itinerating Europe: Early Modern Spatial Networks in Printed Itineraries, 1545–1700”) and the edited volume <i>Print and Power in Early Modern Europe</i> (“Policing in Print: Social Control in Spanish and Borromean Milan (1535–1584)”).
---





<h3>References</h3>

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
