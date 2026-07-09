import { paymentMethodsRepository } from "./payment-methods.repository";

export class PaymentMethodsService {
    async findAll() {
        return paymentMethodsRepository.findAll();
    }
}

export const paymentMethodsService = new PaymentMethodsService();
