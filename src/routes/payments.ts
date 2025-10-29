import express from "express";
import crypto from "crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";

const router = express.Router();

// it creates payment intention and returns a QR Code so the user can pay with Pix
router.post("/pix", async (req, res) => {
    try {
        const { productId, price, userEmail, description } = req.body;

        if (!productId || !price) {
            return res.status(400).json({
                message: "productId e price são obrigatórios."
            });
        }

        const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string,
            options: {
                timeout: 60 * 60 * 1000,
                idempotencyKey: crypto.randomUUID(),
            },
        });

        const mercadoPagoPayment = new Payment(client);

        const pagamentoPix = {
            transaction_amount: Number(price),
            description: description || "Pagamento de produto",
            payment_method_id: "pix",
            payer: {
                email: userEmail || "cliente@example.com",
            },
        };

        const resultMp = await mercadoPagoPayment
            .create({ body: pagamentoPix })
            .then((response: any) => {
                const tx = response.point_of_interaction.transaction_data;
                return {
                    mercadoPagoId: response.id,
                    qrCode: tx.qr_code_base64,
                    pixCode: tx.qr_code,
                };
            })
            .catch((err: any) => {
                console.error("Erro no MP:", err);
                return { mercadoPagoId: "", qrCode: "", pixCode: "" };
            });

        if (!resultMp.mercadoPagoId) {
            return res.status(500).json({
                message: "Erro ao processar pagamento no Mercado Pago."
            });
        }

        return res.status(200).json({
            message: "Pagamento PIX criado com sucesso.",
            mpPaymentId: resultMp.mercadoPagoId,
            pixCode: resultMp.pixCode,
            qrCode: resultMp.qrCode,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});


// it checks if the payment was approved
router.get("/status/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "O ID do pagamento é obrigatório." });
        }

        const url = `https://api.mercadopago.com/v1/payments/${id}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({
                message: data?.message || "Erro ao consultar pagamento no Mercado Pago."
            });
        }

        return res.status(200).json({
            message: "Consulta realizada com sucesso.",
            status: data.status, // "approved", "pending", "rejected"
            status_detail: data.status_detail,
            transaction_amount: data.transaction_amount,
            payment_type_id: data.payment_type_id,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

export default router;