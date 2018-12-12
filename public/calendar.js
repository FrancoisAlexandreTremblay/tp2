// 14 décembre 2018
// François-Alexandre Tremblay et Sebastian Dragomirescu

'use strict';

/* Cette fonction permet d'intéragir avec l'utilisateur quand il clique sur un 
bouton */ 
document.addEventListener('DOMContentLoaded', function() {
	
	var cal = document.getElementById("calendrier");
	
	if(cal == null) return;
	
	var nbHeures = cal.dataset.nbheures;
	var nbJours = cal.dataset.nbjours;
	
	cal.addEventListener("onmousedown", onClick);
	cal.addEventListener("onmouseover", onMove);

});

	var mat = Array(nbHeures + 1).fill(Array(nbJours).fill(0));

<table id = "calendrier" 
	onmousedown = "onClick(event)"
	onmouseover = "onMove(event)" 
	data-nbjours = nbJours
	data-nbheures = nbHeures>
	
	// initialise la première ligne
	<tr>
		<<th></th>
	mat[0].map(function(ligne) { return tag("th", "", ligne + "Nov"); });
	</tr> 
	
	// initialise les lignes subséquentes
    return tag("table", style(bordure), mat.map(function(ligne, i) { // table
        return tag("tr", "", ligne.map(function(cell, j) { // ligne

            if((i + j) % 2 == 1) { // si cellule est un nombre impair

                // cellule verte
                return tag("td", style(vert), unicodePiece(cell));

            } else {

                // cellule blanche
                return tag("td", style(blanc), unicodePiece(cell));
            }

        }).join(""));
    }).join(""));
	
	
	for(var i = 1; i <= nbJours; i++){
		tag("th", )
	}

    <tr>
		<th></th>
		<th>18 Nov</th> 
		<th>19 Nov</th> 
		<th>20 Nov</th> ...
	</tr> 
	<tr>
		<th>7h</th>
		<td id="0-0"></td> 
		<td id="1-0"></td> 
		<td id="2-0"></td>
	</tr>
	
	</table>
	

	var cadreDuJeu = function (mat) {

	    return tag("table", style(bordure), mat.map(function(ligne, i) { // table
	        return tag("tr", "", ligne.map(function(cell, j) { // ligne

	            if((i + j) % 2 == 1) { // si cellule est un nombre impair

	                // cellule verte
	                return tag("td", style(vert), unicodePiece(cell));

	            } else {

	                // cellule blanche
	                return tag("td", style(blanc), unicodePiece(cell));
	            }

	        }).join(""));
	    }).join(""));

	};
});

function onClick(event) {
    // TODO

    /* La variable t contient l'élément HTML sur lequel le clic a été
       fait. Notez qu'il ne s'agit pas forcément d'une case <td> du
       tableau */
    var t = event.target;

    // Attribut id de l'élément sur lequel le clic a été fait
    var id = t.id;
    
    // vérifier si t.id se trouve dans la matrice "mat"
    // &#10003 unicode pour ✓
    var symbole = "&#10003";
    var elem = document.getElementById(id)
    
    // vérifier si le contenu est vide ou s'il contient déjà un ✓
    if(elem.innerHTML == "")
        elem.innerHTML = symbole; // si vide, remplir avec ✓
    else if(elem.innerHTML == symbole)
        elem.innerHTML == ""; // s'il contient ✓, vider
}

function onMove(event) {
    // TODO

    var t = event.target;
    var id = t.id;
}

// Fonction qui retourne l'encodage des dispnibilités des participants
var compacterDisponibilites = function() {
    
	//for(var i = 0)
	//for(var j = 0)

    return '0000000';
};
