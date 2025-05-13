//Cette classe servira de controle, elle analysera les données venant d'un paquet MQTT : elle vérifiera l'intégralité des données (champs) et leur forme.

const axios = require('axios');


class CAnalyse {

    constructor(apiUrl, cheminEnvoi) {
        this.apiUrl = apiUrl;
	this.cheminEnvoi = cheminEnvoi;
    }

    // Vérifie si les données sont valides
    verif_dataMQTT(dataMQTT) {
        const champsObligatoires = ["Capteur", "TypeDeDonnee", "Date", "Valeur"];

        // Vérifie la présence des champs obligatoires
        for (const champ of champsObligatoires) {
            if (!(champ in dataMQTT)) {
                //console.error(`Champ manquant : ${champ}`);
		logger.warn(`Champ manquant dans le paquet MQTT : ${champ}`);
                return false;
            }
        }

        // Vérifie le format de la date : "AAAA-MM-JJ HH"
	const regexDate = new RegExp("^\\d{4}-\\d{2}-\\d{2} ((0\\d)|(1\\d)|(2[0-3]))$");
        if (!regexDate.test(dataMQTT.Date)) {
            //console.error("Format de date invalide. Format attendu : 'AAAA-MM-JJ HH'");
	    logger.warn("Format de date invalide reçu dans le paquet MQTT. Format attendu : 'AAAA/MM/JJ HH'");
            return false;
        }

        // Vérifie que la valeur est un nombre
        if (isNaN(parseFloat(dataMQTT.Valeur))) {
            //console.error("Valeur non numérique");
	    logger.warn("Champ 'Valeur' non numérique dans le paquet MQTT.");
            return false;
        }

        return true;
    }

    // Traite et envoie les données à l'API si elles sont valides
    async envoiMQTT(dataMQTT) {
        if (this.verif_dataMQTT(dataMQTT)) {
            try {
                const res = await axios.post(`${this.apiUrl}${this.cheminEnvoi}`, dataMQTT);
                //console.log("Donnée envoyée à l’API :", res.data);
		logger.info(`Donnée MQTT envoyée à l’API avec succès : ${JSON.stringify(res.data)}`);
            } catch (error) {
                //console.error("Erreur lors de l’envoi à l’API :", error.message);
		logger.warn(`Erreur lors de l’envoi du paquet MQTT à l’API : ${error.message
            }
	}
    }
}

module.exports = { CAnalyse };
