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

/* Fonction qui ajoute un crochet dans une cellule à la suite d'un clic. Si
 un crochet est déjà présent,retire le crochet. */
function onClick(event) {
	
	//La variable t contient l'élément HTML sur lequel le clic a été fait.
	var t = event.target;
	
	// Attribut id de l'élément sur lequel le clic a été fait
	var id = t.id;
	
    var symbole = "&#10003"; // encodage Unicode d'un crochet
    var elem = document.getElementById(id); // retourne l'objet de l'élément id
	
	if(elem.innerHTML == ""){ // si le contenu est vide, ajoute ✓
		elem.innerHTML = symbole; 
	}
	
	else if(elem.innerHTML == "✓"){ // si le contenu est ✓, retirer le ✓
		elem.innerHTML = "";
	}
}

// Fonction qui retourne la position du bouton lorsque le bouton est appuyé
function onMove(event) {
	
	if(event.buttons == 0) {  // si bouton n'est pas appuyé, retourne rien
		return;
	} else {
		onClick(event);
	}
}

/* Fonction qui retourne l'encodage des dispnibilités des participants 
ex. compacterdisponibilites() --> 110011100 */
var compacterDisponibilites = function() {
	
	
    var nom = document.getElementById("nom").value; // champs "nom"
	
    var cal = document.getElementById("calendrier") 
    var nbHr = cal.dataset.nbheures; // attribut du nb d'heures
    var nbJr = cal.dataset.nbjours; // attribut du nb de jours
    
    var disponibilite = "";
    
	/* ajoute un 1 au string lorsqu'un crochet est présent et un 0 lorsqu'aucun 
	crochet n'est présent dans la cellule. */
    for(var i = 0; i < nbHr; i++){
        for(var j = 0; j < nbJr; j++){
			
            var elem = document.getElementById(""+i+"-"+j).innerHTML;
            disponibilite += elem != "" ? 1 : 0;
        }
    }

    return disponibilite;
};
