// 14 décembre 2018
// François-Alexandre Tremblay et Sebastian Dragomirescu
/* Ce programme permet de générer une application web de dans le style du site
doodle qui permet de planifier des réunions et autres activités aux moments qui
conviennent le mieux à tous les participants. Le programme interagit avec les
fichiers suivantes:

|-- index.js  ------------ Code du serveur
|
|-- public/   ------------ Dossier contenant les fichiers accessibles via le web
|   |-- calendar.js ------ Fichier contenant le code javascript du client
|   |-- pickmeup.*  ------ Utilitaire pour sélectionner des dates
|   |-- calendar.css ----- Fichier de style pour la page de choix
|   |-- index.css   ------ Fichier de style pour l’accueil
|   |-- results.css ------ Fichier de style pour la page de résultats
|
|-- template/ ------------ Dossier contenant les fichiers HTML
    |-- index.html ------- Page d’accueil (nouveau sondage)
    |-- calendar.html ---- Page pour la sélection de dates
    |-- results.html ----- Page de visualisation des réponses
    |-- error404.html ---- Page d’erreur
*/

'use strict';

var http = require("http");
var fs = require('fs');
var urlParse = require('url').parse;
var pathParse = require('path').parse;
var querystring = require('querystring');

var port = 1337;
var hostUrl = 'http://localhost:'+port+'/'; //localhost est interface réseau qui appartient à la machine
var defaultPage = '/index.html';

var mimes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
};

// --- Helpers ---
var readFile = function (path) {
    return fs.readFileSync(path).toString('utf8');
};

var writeFile = function (path, texte) {
    fs.writeFileSync(path, texte);
};

// --- Server handler ---
var redirect = function (reponse, path, query) {
    var newLocation = path + (query == null ? '' : '?' + query);
    reponse.writeHeader(302, {'Location' : newLocation });
    reponse.end('302 page déplacé');
};

var getDocument = function (url) {
    var pathname = url.pathname;
    var parsedPath = pathParse(url.pathname);
    var result = { data: null, status: 200, type: null };

    if(parsedPath.ext in mimes) {
        result.type = mimes[parsedPath.ext];
    } else {
        result.type = 'text/plain';
    }

    try {
        result.data = readFile('./public' + pathname);
        console.log('['+new Date().toLocaleString('iso') + "] GET " + url.path);
    } catch (e) {
        // File not found.
        console.log('['+new Date().toLocaleString('iso') + "] GET " +
                    url.path + ' not found');
        result.data = readFile('template/error404.html');
        result.type = 'text/html';
        result.status = 404;
    }

    return result;
};
var sendPage = function (reponse, page) {
    reponse.writeHeader(page.status, {'Content-Type' : page.type});
    reponse.end(page.data);
};

var indexQuery = function (query) {

    var resultat = { exists: false, id: null };

    if (query !== null) {

        query = querystring.parse(query);
        if ('id' in query && 'titre' in query &&
            query.id.length > 0 && query.titre.length > 0) {

            resultat.exists = creerSondage(
                query.titre, query.id,
                query.dateDebut, query.dateFin,
                query.heureDebut, query.heureFin);
        }

        if (resultat.exists) {
            resultat.id = query.id;
        }
    }

    return resultat;
};

var calQuery = function (id, query) {
    if (query !== null) {
        query = querystring.parse(query);
        // query = { nom: ..., disponibilites: ... }
        ajouterParticipant(id, query.nom, query.disponibilites);
        return true;
    }
    return false;
};

var getIndex = function (replacements) {
    return {
        status: 200,
        data: readFile('template/index.html'),
        type: 'text/html'
    };
};


//********** Programme d'interaction -  **************

//|---- Fonctions principales ----
//		|--- creerSondage()
//		|--- getCalendar() 

var tabSondage = []; // tableau qui contient les informations des sondages

var mois = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Dec'
];

var MILLIS_PAR_JOUR = (24 * 60 * 60 * 1000);

// Fonction qui écrit un sondage CSV si le fichier n'existe pas déjà
var ecrireCSV = function (path, matrice) {
	
	var contenu = matrice.join(",") + "\n";
	writeFile(path, contenu);
};



// Fonction qui retourne la position d'un sondage dans le tableau des sondages
//var positionSondage = function(sondageId){
	
//	for(var i = 0; i < tabSondage.length; i++){
//		if(tabSondage[i][1] == sondageId){ // si le sondage est dans le tableau
//			return i;
//		}
//	}
//};

// Fonction qui retourne les balises d'un élément en HTML.
var tag = function(nom, attr, contenu) {
    return "<"+ nom +" " + attr + ">" + contenu + "</" + nom + ">";
};

/* Fonction qui modifie des mots dans un texte en les remplaçants par d'autres 
mots. */ 
var modifierTxt = function (texte, mot, autre){
	return texte.split(mot).join(autre);
};

/* Fonction qui construit des tableaux de jours/mois entre deux dates. 
 ex. tabJourMois(2018-11-12, 2018-11-14) retourne [12 nov, 13 nov, 14 nov] */ 
var tabJourMois = function (dateDebut, dateFin){
	
	var debut = +dateDebut.split("-")[2];
	var moisDebut = dateDebut.split("-")[1];
	
	var fin = +dateFin.split("-")[2];
	var moisFin = dateFin.split("-")[1];
	
	var ecart = jourEntreDate(dateDebut, dateFin);
	
	var resultat = [];
	
	for(var i = 0; i <= ecart; i++){ // loop à travers les jours jusqu'à écart
		
		if (fin - i > 0){ // si le jour de la date de fin est supérieur à 0...
			resultat.unshift(fin - i + " " + mois[moisFin - 1]);
			
		} else { // sinon, ajoute les jours à partir de la date de début 
			resultat.unshift(debut + ecart - i + " " + mois[moisDebut- 1]);
		}
	}
	
	return [resultat];
};

var tabHeure = function (heureDebut, heureFin){
	
	var resultat= [];
	
	for(var i = heureDebut; i <= heureFin; i++){
		resultat.push(i + "h");
	}
	return resultat;
};

// Fonction qui initialise la table de la fonction getCalendar().
var initTable = function(){
	
	var nbJours = tabSondage[6]; // nb jours du sondage
	var nbHeures = tabSondage[7]; // nb heures du sondage
	
	// tableau des jours entre les deux dates du sondage ex: [17 nov,18 nov,..] 
	var tabJours = tabJourMois(tabSondage[2], tabSondage[3]); 
	
	// tableau des heures entre heureDébut et heureFin ex: [7h,8h,9h...] 
	var tabHeures = tabHeure(tabSondage[4], tabSondage[5]);
	
	// initialise les cellules du tableau
	var mat = Array(nbHeures).fill(Array(nbJours).fill(""));
	
	// Ajoute les heures glitch 
	mat.map(function(ligne, i) { 
		return ligne.unshift(tabHeures[i]); 
	});
	
	tabJours.concat(mat);
	
	// première rangée correspond à des jours
	
	
	// première colonne correspond à des heures
	
	
	// première cellule en haut à gauche est vide
	mat[0][0] = 3; 
	
	
};

/* Retourne le texte HTML à afficher à l'utilisateur pour répondre au
sondage demandé. Retourne false si le calendrier demandé n'existe pas. */
var getCalendar = function (sondageId) {
	
	var texte = readFile("template/calendar.html");
	
	var titre = readFile("template/CSV/" + sondageId + ".csv").split(",")[0];
	var table = iniTable(); 
	var url = "http://localhost:1337/" + sondageId;
	
	var ancienItem = ["{{titre}}", "{{table}}", "{{url}}"]; 
	var nouvelItem = [titre, table, url];
	
	//remplacer les anciens items du fichier par les nouveaux items
	for(var i = 0; i < nouvelItem.length; i++){
		texte = modifierTxt(texte, ancienItem[i], nouvelItem[i]);
	}
	
	// return false si le calendrier n'existe pas
	
    return contenu;
};

/* Retourne le texte HTML à afficher à l'utilisateur pour voir les résultats de 
sondage demandé. Retourne false si le calendrier demandé n'existe pas. */
var getResults = function (sondageId) {
    
	
    return 'Resultats du sondage <b>' + SondageId + '</b> (TODO)';
};


/* Fonction qui évalue si un tableau de caractères respecte les conditions
(lettres, chiffres et tirets). */
var caracValide = function(tabCar){
    
    if(tabCar == "") return false;
    
    for(var i = 0; i < tabCar.length; i++){
        
        var car = tabCar[i];
        
        if((car >= "a" && car <= "z") || (car >= "A" && car <= "Z") ||
           (car >= "1" && car <= "9") || (car == "-") || 
           (car >= "À" && car <= "Ö") || (car >= "Ù" && car <= "ö") || 
           (car >= "ù" && car <= "ü")){
            continue;
        } else {
            return false;
        }
    }
    
    return true;
};


/* Fonction qui converti une date en nombre de jour. glitch (prendre la 
fonction du premier exercice). */
var convDateEnJour = function (date){
    
    var date = date.split("-"); 
    date = {annee: +date[0], mois: +date[1], jour: +date[2]};
    
    var nbCycle = Math.floor((date.annee - 1)/4); // 4 années par cycle complet
    var nbAnnee = date.annee - (nbCycle * 4); // nb d'années complètes 
    var nbMois = (date.mois + 9)%12; // nb mois complets
    
    var nbJourCycle = 1461 * nbCycle; // 1461 jours par cycle
    var nbJourAnnee = 365 * nbAnnee;
    var nbJourAnneePresente = Math.ceil((306 * nbMois - 5)/10) + date.jour;

    return nbJourCycle + nbJourAnnee + nbJourAnneePresente;
};

// Fonction qui calcule le nombre de jour entre deux dates.
var jourEntreDate = function(dateDebut, dateFin){
    return convDateEnJour(dateFin) - convDateEnJour(dateDebut);
};

/* Fonction qui vérifie si le sondage (id) a déjà été enregistré par un 
utilisateur dans le document CSV. Retourne false si le sondage n'existe pas et 
true s'il existe. */
var sondageExiste = function (id){
	
	// liste les sondages dans le document
	var sondage = fs.readdirSync("template/CSV"); 
	
	if(sondage == []) return false; // si le dossier de sondage est vide
	
	for(var i = 0; i < sondage.length; i++){
		if(sondage[i] == (id + ".csv")){ // si le sondage est dans le dossier
			return true;
		}
	}
	
	return false; 
};

/* Fonction qui crée un sondage à partir des informations entrées. Retourne false 
si les informations ne sont pas valides et true si elles sont valides. Vérifie diverses
conditions (ex. Id contient uniquement des lettres, chiffres ou tirets, dateDebut est 
inférieur à dateFin, heureDebut est inférieur à heureFin, le nombre de jour du sondage
n'excède pas 30 jours. */
var creerSondage = function(titre, id, dateDebut, dateFin, heureDebut, heureFin) {
    
	
	// nombre de jour entre dateDebut et dateFin
    var ecartJour = jourEntreDate(dateDebut, dateFin);
    var ecartHeure = heureFin - heureDebut;
	
	var texte = readFile("template/index.html");
	var txtAModifier = ["Erreur : assurez-vous d'entrer des données valides."];
	var msgErreur = [];
	
	// Si le id ne contient pas des caractères valides, retourne false. 
    if(!caracValide(id.split("")) || id == "") {
		msgErreur = msgErreur.concat("Erreur: l\'identifiant doit contenir des" + 
		" lettres, chiffres ou tirets.");
    }
    
    // Si dateDébut est supérieure à dateFin, retourne msg d'erreur et false. 
    if(ecartJour < 0) {
		msgErreur = msgErreur.concat("Erreur: La date de fin doit être après" +
		" la date de début.");
    }
	
	// Si nombre de jours est supérieur à 30, retourne msg d'erreur et false.
    if(ecartJour > 30) {
		msgErreur = msgErreur.concat("Erreur: La durée maximale du sondage" + 
		" est de 30 jours.");
    }
    
    // Si heureDebut est supérieur à heureFin, retourne msg d'erreur et false.
    if(ecartHeure < 0 && ecartJour == 0) {
		msgErreur = msgErreur.concat("Erreur: L\’heure de fin doit être après" +
		" l\’heure de début.");	
  	}
	
	// Si sondage existe, retourne msg d'erreur et false.
	if(sondageExiste(id)){
		msgErreur = msgErreur.concat("Erreur: L\’identifiant de sondage " +
		"correspond à un sondage existant.");
	};
	
	// Cela ne fonctionne pas encore... Il doit y avoir une problème avec le serveur... On devrait appeller la fonction à partir du html !!!  glitch
	if(msgErreur != ""){ // si une des erreur survient...
		
		console.log(msgErreur);
		texte = texte.split(txtAModifier).join(msgErreur);
		console.log(texte);
		return texte;
	}
	
	// Peut-être que la meilleur façon de stocker les participants serait dans 
	// un tableau plutôt que dans un fichier. Chaque sondage est un élément d'un tableau. Chaque élément contient Dans chaque sondage, il y a les éléments ci-dessous. Dans participant, il pourrait y avoir un autre tableau qui liste les disponibilités des participants. glitch
	var matrice = [titre, id, dateDebut, dateFin, heureDebut, heureFin, 
		ecartJour, ecartHeure, "Participants"];
	var path = "template/CSV/" + id + ".csv";
	
	tabSondage = matrice; 
	
	ecrireCSV(path, matrice);
	
    return true;
};

// Ajoute un participant et ses disponibilités aux résultats d'un
// sondage. Les disponibilités sont envoyées au format textuel
// fourni par la fonction compacterDisponibilites() de public/calendar.js
//
// Cette fonction ne retourne rien
var ajouterParticipant = function(sondageId, nom, disponibilites) {
    // TODO
};

// Génère la `i`ème couleur parmi un nombre total `total` au format
// hexadécimal HTML
//
// Notez que pour un grand nombre de couleurs (ex.: 250), générer
// toutes les couleurs et les afficher devrait donner un joli dégradé qui
// commence en rouge, qui passe par toutes les autres couleurs et qui
// revient à rouge.
var genColor = function(i, nbTotal) {
    // TODO
    return '#000000';
};


/*
 * Création du serveur HTTP
 * Note : pas besoin de toucher au code ici (sauf peut-être si vous
 * faites les bonus)
 */
http.createServer(function (requete, reponse) {
    var url = urlParse(requete.url);

    // Redirect to index.html
    if (url.pathname == '/') {
        redirect(reponse, defaultPage, url.query);
        return;
    }

    var doc;

    if (url.pathname == defaultPage) {
        var res = indexQuery(url.query);

        if (res.exists) {
            redirect(reponse, res.id);
            return;
        } else {
            doc = getIndex(res.data);
        }
    } else {
        var parsedPath = pathParse(url.pathname);

        if (parsedPath.ext.length == 0) {
            var id;

            if (parsedPath.dir == '/') {
                id = parsedPath.base;

                if (calQuery(id, url.query)) {
                    redirect(reponse, '/'+ id + '/results')
                    return ;
                }

                var data = getCalendar(id);

                if(data === false) { // si get calendar est faux
                    redirect(reponse, '/error404.html');
                    return;
                }

                doc = {status: 200, data: data, type: 'text/html'};
            } else {
                if (parsedPath.base == 'results') {
                    id = parsedPath.dir.slice(1);
                    var data = getResults(id);

                    if(data === false) {
                        redirect(reponse, '/error404.html');
                        return;
                    }

                    doc = {status: 200, data: data, type: 'text/html'};
                } else {
                    redirect(reponse, '/error404.html');
                    return;
                }
            }
        } else {
            doc = getDocument(url);
        }
    }

    sendPage(reponse, doc); // fonction qui va être appellé

}).listen(port);

// Fonction qui teste la fonction creerSondage.
var testcreerSondage = function(){
	
    // id différent d'une lettre, un chiffre ou un tiret.
	assert(creerSondage("test","1e-Àé","2018-11-18","2018-11-23","2h","17h") == true);
    assert(creerSondage("test","1e-Àé.","2018-11-18","2018-11-23","2h","17h") == false);
    assert(creerSondage("test","","2018-11-18","2018-11-23","2h","17h") == false);
    assert(creerSondage("test"," ","2018-11-18","2018-11-23","2h","17h") == false);
    
	// date de début plus grande
	assert(creerSondage("test","1e-","2018-11-24","2018-11-23","2h","17h") == false); 
    // nb jours de sondage supérieurs à 30.
	assert(creerSondage("test","1e-","2018-11-18","2018-12-30","2h","17h") == false);
	// heure de début plus grande
	assert(creerSondage("test","1e-","2018-11-18","2018-11-23","2h","1h") == false); 
 
	
};
