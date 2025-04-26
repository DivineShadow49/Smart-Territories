//Fichier servant de point d'entrée à l'API
//
//Il incluera les fichiers des autres classes et servira ainsi de main.


const express = require("express");
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


//On importe les deux autres classes pour avoir accès à leurs méthodes (et constructeurs)
const { CAPI } = require("./requetes");
const { CDatabase, CModel } = require("./database");
const { CAnalyse } = require("./analyse");
const { CClientMQTT } = require("./clientmqtt");

class CServer {
    constructor() {
        this.app = express();


//	On instancie des objets des classes CDatabase, CModel et CRequetes pour pouvoir utiliser les requêtes et recevoir les données
	new CDatabase("Test_Database");

	this.modele = new CModel();
	this.controleur = new CAPI(this.modele);
	this.analyseur = new CAnalyse("http://localhost:8080", "/SmartTerritories/addData");
	this.clientMQTT = new CClientMQTT("SmartTerritories/#", this.analyseur, "test.mosquitto.org");

        this.config();
        this.routes();
	this.mqttStart();
        this.start();
    }

    config() {
        this.app.use(express.json());

//      On met en place les options de Swagger (pour la documentation)
        const swaggerOptions = {
            swaggerDefinition: {
                openapi: '3.0.0', // Utiliser OpenAPI 3
                info: {
                    title: 'SmartTerritories API',
                    version: '1.0.0',
                    description: 'API du projet BTS CIEL Saint Aubin (Smart Territories) pour recevoir, stocker et analyser les données des capteurs.',
                },
                servers: [
                    {
                        url: 'http://localhost:8080', // l'URL du serveur
                    },
                ],
            },
            apis: ['./requetes.js'], // <--- Emplacement des routes documentées
        };

//      Génération de la spec
        const swaggerDocs = swaggerJsDoc(swaggerOptions);

//      Route pour afficher Swagger UI
        this.app.use('/SmartTerritories/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
    }

//  On récupère les routes de la classe CRequetes
    routes() {
        this.app.use("/SmartTerritories", this.controleur.router);
    }

//  Démarrage du client mqtt
    mqttStart() {
	this.clientMQTT._connect();
	this.clientMQTT.ecouterMessages();
}

//  Démarrage du serveur sur le port 8080
    start() {
        const PORT = process.env.PORT || 8080;
        this.app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
    }
}


// Lancement du serveur
new CServer();
