const axios = require('axios');

const webhookPayload = {
  "id": "evt_subscription_updated_test_123",
  "event": "SUBSCRIPTION_UPDATED",
  "dateCreated": "2025-06-23 20:00:00",
  "subscription": {
    "object": "subscription",
    "id": "sub_uxbd112j3gkl3spu",
    "dateCreated": "2025-06-23",
    "customer": "cus_000006796775",
    "paymentLink": null,
    "value": 15,
    "nextDueDate": "2025-07-01",
    "cycle": "MONTHLY",
    "description": "Assinatura Plano Premium",
    "billingType": "BOLETO",
    "deleted": false,
    "status": "ACTIVE",
    "externalReference": "company_19_subscription",
    "checkoutSession": null,
    "sendPaymentByPostalService": false,
    "fine": {
      "value": 0,
      "type": "FIXED"
    },
    "interest": {
      "value": 0,
      "type": "PERCENTAGE"
    },
    "split": null
  }
};

async function testSubscriptionWebhook() {
  try {
    console.log('Enviando webhook SUBSCRIPTION_UPDATED...');
    console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
    
    const response = await axios.post('http://localhost:8080/asaas/webhook', webhookPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Resposta do webhook:', response.data);
    console.log('Status:', response.status);
    
  } catch (error) {
    console.error('Erro ao enviar webhook:', error.response?.data || error.message);
  }
}

testSubscriptionWebhook();