//Ce fichier comprendra les classes de base de données ainsi que le schéma/modèle mongoose.
//
//Cela correspondra donc à notre classe entité représentant la base de données.

const mongoose = require("mongoose");

//La classe CDatabase regroupera la connexion à la base de donnée MongoDB choisie pour le retour des données ainsi que le retour des erreurs
class CDatabase {
//  On récupère le nom de la base ainsi que son IP et le port concernés pour s'y connecter
    constructor(dbName, host = "localhost", port = "27017") {
	this.dbName = dbName;
	this.host = host;
	this.port = port;

	this.uri = `mongodb://${this.host}:${this.port}/${this.dbName}`;
        this._connect();
    }

//  On effectue la connexion à la base et si une erreur est retrouvée on la retourne
//  Ecrit avec un "_" pour éviter de confondre avec le mongoose.connect
    _connect() {
	try {
            mongoose.connect(this.uri);
	    console.log(`Connecté à MongoDB réussie, nom de BDD: ${this.dbName}`);
        } catch(err) {
//	    Possibilité de retourner plusieurs erreurs & améliorer le switch
	    switch (err.name) {
/*
		case 'MongoNetworkError':
		    console.error("Erreur de connexion réseau à MongoDB: ", err.message);
		    break;
*/
		case 'MongoParseError':
		    console.error("URI de connexion MongoDB invalide: ", err.message);
		    break;
		default:
		    console.error("Erreur non repertoriée détectée: ", err.message);
		    break;
	    }
	    throw err;
	}
    }
}


//La classe CModel créera un modèle de la base donnée dans la classe CDatabase, avec un modèle type pris en compte par défaut et un autre qui peut être donné par l'utilisateur
class CModel {
    constructor(modelName = 'dbModel', collectionName = 'Test_Database', schemaCustom = null) {
        const schemaDefault = new mongoose.Schema({
            Capteur: String,           // Nom du capteur (lieu)
            TypeDeDonnee: String,      // Type de mesure (ex : Température)
            Date: String,              // Date sous forme de string
	    Valeur: Number
	}, {
  	    versionKey: false
	});

//	Si aucun modèle est donné alors on utilise le défault, sinon on utilise le custom.
	this.model = mongoose.model(modelName, schemaDefault || schemaCustom, collectionName);
    }

    getModel() {
	return this.model;
    }

//On renvoie les données des routes présentes dans la classe CRequetes
    async getAllMesures() {
	return await this.model.find();
    }

    async getMesuresFiltre(filtre, limite) {
	//console.log("Filtre utilisé :", filtre);
	return await this.model.find(filtre).limit(limite);
    }

//On ajoute une nouvelle données dans la base, à l'aide de notre modèle créé au préalable et de la méthode "save" de mongoose
    async insertMesure(data) {
    	try {
            const nouvelleMesure = new this.model(data);
            await nouvelleMesure.save();
            return { success: true, message: "Mesure enregistrée avec succès." };
    	} catch (error) {
            return { success: false, message: "Erreur lors de l'enregistrement.", error };
    	}
    }
}

module.exports = { CDatabase, CModel };
