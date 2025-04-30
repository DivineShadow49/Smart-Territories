//Ce fichier et ainsi cette classe regroupera toutes les requêtes utilisées par l'API
//
//Cette classe servira donc de contrôle étant donné que notre point d'entrée est notre frontière.


const express = require("express");
const CModel = require("./database");

//Cette classe regroupera les différentes routes pour acceder aux données de l'API, elle se connectera directement au modèle de CModel pour retourner les données
class CAPI {
    constructor(modeleMesure) {
	this.model = modeleMesure;

        this.router = express.Router();
        this.initialiseRoutes();
    }

//  Validation des paramètres possibles dans les requêtes HTTP
    validationParams(req, res, next) {
        const paramsAutorises = ["Capteur", "TypeDeDonnee", "Date", "DateDebut", "DateFin", "Limite"];
        const paramsRecus = Object.keys(req.query);

        if (paramsRecus.find(param => !paramsAutorises.includes(param))) {
            return res.status(400).json({ message: "Paramètres invalides détectés." });
        }

//	On vérifie qu'il n'existe pas ET une Date simple ainsi qu'une date de début ou fin
	if (req.query.Date && (req.query.DateDebut || req.query.DateFin)) {
	    return res.status(206).json({ message: "La date (simple) sera ignorée car vous avez entrée une date de début et/ou de fin" });
	}


//	On vérifie le format de la date (si fournie)
        if (req.query.Date) {
            const regexDate = new RegExp("^\\d{4}-\\d{2}-\\d{2} ((0\\d)|(1\\d)|(2[0-3]))$");

	    if (Array.isArray(req.query.Date)) {
        	for (const d of req.query.Date) {
            	    if (!regexDate.test(d)) {
               	 	return res.status(400).json({ message: "Format de date invalide. Utiliser YYYY-MM-DD hh." });
            	    }
        	}
   	    } else {
// 		Vérification d'une seule date
        	if (!regexDate.test(req.query.Date)) {
            	    return res.status(400).json({ message: "Format de date invalide. Utiliser YYYY-MM-DD hh." });
        	}
	    }
	}

//	On vérifie le format et le nombre de DateDebut dans la requête
	if (req.query.DateDebut) {
	    const regexDate = new RegExp("^\\d{4}-\\d{2}-\\d{2} ((0\\d)|(1\\d)|(2[0-3]))$");


            if (Array.isArray(req.query.DateDebut)) {
                return res.status(400).json({ message: "Il ne peut pas y avoir plusieurs dates de début." });
            } else {
// 		Vérification d'une seule date
                if (!regexDate.test(req.query.DateDebut)) {
                    return res.status(400).json({ message: "Format de date invalide. Utiliser YYYY-MM-DD hh." });
                }
            }
        }


//	On vérifie le format et le nombre de DateFin dans la requête
        if (req.query.DateFin) {
            const regexDate = new RegExp("^\\d{4}-\\d{2}-\\d{2} ((0\\d)|(1\\d)|(2[0-3]))$");


            if (Array.isArray(req.query.DateFin)) {
                return res.status(400).json({ message: "Il ne peut pas y avoir plusieurs dates de fin." });
            } else {
//		 Vérification d'une seule date
                if (!regexDate.test(req.query.DateFin)) {
                    return res.status(400).json({ message: "Format de date invalide. Utiliser YYYY-MM-DD hh." });
                }
            }
        }


        next();
    }


/**
 * @swagger
 * /SmartTerritories/allData:
 *   get:
 *     summary: Récupère toutes les mesures en base de données
 *     responses:
 *       200:
 *         description: Liste de toutes les mesures.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       444:
 *         description: Aucune donnée trouvée.
 *       500:
 *         description: Erreur interne du serveur.
 */
    async getAllMesures(req, res) {
	try {
	    const retour = await this.model.getAllMesures();

	    if (retour.lenght === 0) {
		return res.status(444).json({ message: "Aucune donnée trouvée." });
	    }

	    res.json(retour).status(200);

	} catch (error) {
	    console.log("Retour d'erreur: ", error);
	    res.status(500).json({ message: "Erreur interne du serveur.", error });
	}
    }




/**
 * @swagger
 * /SmartTerritories/dataFilter:
 *   get:
 *     summary: Récupère les mesures selon des critères de filtrage
 *     description: Permet de filtrer les mesures selon plusieurs critères. Valide aussi les paramètres avant l'envoi de la requête.
 *     parameters:
 *       - in: query
 *         name: Capteur
 *         schema:
 *           type: string
 *         required: false
 *         description: Nom du capteur
 *       - in: query
 *         name: TypeDeDonnee
 *         schema:
 *           type: string
 *         required: false
 *         description: Type de donnée mesurée
 *       - in: query
 *         name: Date
 *         schema:
 *           type: string
 *           example: "2025-04-25 14"
 *         required: false
 *         description: Date précise au format "AAAA-MM-JJ HH"
 *       - in: query
 *         name: DateDebut
 *         schema:
 *           type: string
 *           example: "2025-04-20 08"
 *         required: false
 *         description: Début de la période (format "AAAA-MM-JJ HH")
 *       - in: query
 *         name: DateFin
 *         schema:
 *           type: string
 *           example: "2025-04-25 20"
 *         required: false
 *         description: Fin de la période (format "AAAA-MM-JJ HH")
 *       - in: query
 *         name: Limite
 *         schema:
 *           type: integer
 *           example: 10
 *         required: false
 *         description: Limite de résultats renvoyés
 *     responses:
 *       200:
 *         description: Liste des mesures correspondant aux critères
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Capteur:
 *                     type: string
 *                   TypeDeDonnee:
 *                     type: string
 *                   Date:
 *                     type: string
 *                   Valeur:
 *                     type: number
 *       206:
 *         description: La date simple a été ignorée car DateDebut ou DateFin est fournie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Mauvais paramètre ou mauvais format de date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       444:
 *         description: Aucun résultat trouvé avec les critères spécifiés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
    async getMesuresFiltre(req, res) {
        try {
//          On vérifie que l'élément "req.query" n'est pas vide pour ne pas surcharger le serveur par l'envoi de données
	    if (Object.keys(req.query).length === 0) {
                return res.status(303).json({ message: "ATTENTION : vous êtes sur le point d'afficher toutes les données et la base, utiliser la requête : '/SmartTerritories/allData' si c'est votre demande." });
            }

            const { Capteur, TypeDeDonnee, Date, DateDebut, DateFin, Limite } = req.query;
            const filtre = {};

//          On créé une variable comportant tous les paramètres possibles dans la remarque pour éviter une erreur de syntaxe ou de paramètre inutile
            const params_Requete = ["Capteur", "TypeDeDonnee", "Date", "DateDebut", "DateFin", "Limite"];


//	    On gère le paramètre de limite de données (limite de renvoi maximum)
//	    Cette partie du code est gérée ici et non dans "validationParams" pour avoir la variable "limit" en local et ne pas a devoir la placer en global
	    const limit = Limite || 10;
	    if (isNaN(limit) || limit <= 0) {
      	        return res.status(400).json({ message: "Le paramètre 'Limite' doit être un nombre positif." });
            }

            if (Capteur) {
		console.log("Filtre par capteur: ", Capteur);
		filtre.Capteur = Capteur;
	    }

	    if (TypeDeDonnee) {
		console.log("Filtre par TypeDeDonnee: ", TypeDeDonnee);
		filtre.TypeDeDonnee = TypeDeDonnee;
	    }

	    if (DateDebut || DateFin) {
		filtre.Date = {};

    		if (DateDebut) {
        	    filtre.Date.$gte = DateDebut;
    		}
    		if (DateFin) {
        	    filtre.Date.$lte = DateFin;
    		}

    		console.log("Filtrage par plage de dates : ", filtre.Date);
	    }

            else if (Date){
		console.log("Filtre par Date: ", Date);
		filtre.Date = Date;
	    }

	    const retour = await this.model.getMesuresFiltre(filtre, limit);
	    console.log("Retour des données: ", retour);

            if (retour.length === 0) {
                return res.status(444).json({ message: "Aucune donnée trouvée avec ces critères." });
            }

            res.status(200).json(retour);
        } catch (error) {
	    console.log("Retour d'erreur: ", error);
            res.status(500).json({ message: "Erreur interne du serveur.", error });
        }
    }




/**
 * @swagger
 * /SmartTerritories/addData:
 *   post:
 *     summary: Ajoute une nouvelle mesure en base de données
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Capteur
 *               - TypeDeDonnee
 *               - Date
 *               - Valeur
 *             properties:
 *               Capteur:
 *                 type: string
 *                 example: "Capteur_01"
 *               TypeDeDonnee:
 *                 type: string
 *                 example: "Température"
 *               Date:
 *                 type: string
 *                 example: "2025-04-25 14"
 *               Valeur:
 *                 type: number
 *                 example: 22.5
 *     responses:
 *       201:
 *         description: Donnée insérée avec succès
 *       400:
 *         description: Champs obligatoires manquants
 *       500:
 *         description: Erreur interne lors de l'insertion
 */
    async postNouvelleMesure(req, res) {
    	try {
            const { Capteur, TypeDeDonnee, Date, Valeur } = req.body;

// 	    Vérification des champs obligatoires
            if (!Capteur || !TypeDeDonnee || !Date || Valeur === undefined) {
            	return res.status(400).json({message: "Les champs Capteur, TypeDeDonnee, Date et Valeur sont requis."});
            }

// 	    Insertion dans la base
            const resultat = await this.model.insertMesure({
            	Capteur,
            	TypeDeDonnee,
            	Date,
            	Valeur
       	    });

// 	    Réponse en fonction du résultat
            if (resultat.success) {
            	res.status(201).json({ message: resultat.message });
            } else {
            	res.status(500).json({ message: resultat.message, error: resultat.error });
            }

	} catch (error) {
            res.status(500).json({message: "Erreur lors de la requête POST.", error: error.message});
        }
    }


//  Initialisation des routes et vérification des paramètres de requête
    initialiseRoutes() {
        this.router.get("/dataFilter", this.validationParams, this.getMesuresFiltre.bind(this));
	this.router.get("/allData", this.validationParams, this.getAllMesures.bind(this));
    	this.router.post("/addData", this.postNouvelleMesure.bind(this));
    }
}

// Export de l'instance de la classe avec les routes
module.exports = { CAPI };
