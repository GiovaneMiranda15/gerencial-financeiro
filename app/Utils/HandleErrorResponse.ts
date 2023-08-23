import { ResponseContract } from "@ioc:Adonis/Core/Response";

interface CustomError {
    column: any;
    detail?: string;
    constraint?: string;
    messages?: {
        [field: string]: string[]; // Updated type for messages property
    };
    code?: number;
    message?: string;
}

export function handleErrorResponse(response: ResponseContract, error: CustomError): void {
    const { messages, code } = error;
    if (messages) {
        const errorMessages: string[] = [];
        for (const field in messages) {
            errorMessages.push(` Campo ${field} é obrigatório`);
        }

        return response.status(400).send({
            status: false,
            mensagem: errorMessages,
        });
    }

    let status = code || 500;
    let message = error.message || "Erro interno do servidor!";

    if (String(code).match("E_INVALID_AUTH_SESSION")) {
        response.redirect().toRoute("login")
    }

    if (String(code).match("E_INVALID_AUTH_PASSWORD")) {
        status = 401;
        message = "Senha inválida!";
    }

    if (String(code).match("E_INVALID_AUTH_UID")) {
        status = 401;
        message = "Usuário não encontrado!";
    }

    if (String(code).match("E_ROW_NOT_FOUND")) {
        status = 404;
        message = "Nenhum registro encontrado!";
    }

    response.status(status).send({
        status: false,
        mensagem: message,
    });
}