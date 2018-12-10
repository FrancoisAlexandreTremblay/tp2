/* Fonction qui vérifie si le sondage (id) a déjà été enregistré par un 
utilisateur dans le document CSV. Retourne false si le sondage n'existe pas et 
true s'il existe. */
var sondageExiste = function (id){
	
	// liste les sondages dans le document
	var sondage = fs.readdirSync("template/CSV"); 
	console.log(sondage);
	
	if(sondage == []) return false; // si le tableau de sondage est vide
	
	for(var i = 0; i < sondage.length; i++){
		if(sondage[i] == (id + ".csv")){ // si le sondage est dans le dossier
			return true;
		}
	}
	
	return false; 
};

var fs = require("fs");

var writeFile = function (path, texte) {
    fs.writeFileSync(path, texte);
};

// Fonction qui écrit un fichier CSV
var ecrireCSV = function (path, matrice) {
	
	if(!sondageExiste(id)){
		
		var contenu = matrice. + "\n";
		writeFile(path, contenu);
		
	} else {
		console.log("sondage existe mon asti");
	}
};

var id = "Hi";
var matrice = ["hello", "fuck", "you", "Participants"];
var path = "template/CSV/" + id + ".csv";

console.log(matrice);
console.log(path);

ecrireCSV(path, matrice);