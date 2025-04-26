//Cette classe servira de client MQTT connecté à notre classe CAnalyse. Elle récupère les donnés et les envoie dans cette classe


const mqtt = require('mqtt');


//Cette classe servira de client MQTT opérationnel avec un topic général ainsi qu'une adresse IP et un port de broker qui peuvent être donnés par l'utilisateur. Il contient les méthodes basiques >
class CClientMQTT {
    constructor(topicName, analyseur, addrIPBroker = "127.0.0.1", port = "1883") {
        this.topicName = topicName;
	this.objCAnalyse = analyseur
        this.addrBroker = addrIPBroker
        this.port = port;

//      Préparation du client pour la connexion (méthode connect)
        this.client = null;
    }


//  Méthode de connexion au broker MQTT associé au client
    _connect() {
        const URLbroker = `mqtt://${this.addrBroker}:${this.port}`;
        this.client = mqtt.connect(URLbroker);

        this.client.on('connect', () => {
            console.log("Connecté au broker MQTT");

//          On se connecte au topic donné dans le constructeur
            this.client.subscribe(this.topicName, (err) => {

                if (err) {
                    console.error('Erreur d’abonnement au topic:', err.message);
                } else {
                    console.log(`Abonné au topic : ${this.topicName}`);
                }
            });
        });
    }

//  Méthode d'écoute aux messages venant du broker MQTT (fonctionnement asynchrone)
    ecouterMessages() {
        if (!this.client) {
            console.error("Client MQTT non connecté.");
            return;
        }


        this.client.on('message', async (topic, message) => {
            try {
                const payload = JSON.parse(message.toString());
                console.log('Message reçu :', payload);

                await this.objCAnalyse.envoiMQTT(payload);
            } catch (err) {
                console.error('Erreur de traitement du message :', err.message);
            }
        });
    }
}



module.exports = { CClientMQTT };
