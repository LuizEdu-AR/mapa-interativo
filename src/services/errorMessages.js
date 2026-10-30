const messages = {
    "auth/invalid-credential": "ID ou senha incorretos. Confira os dados e tente novamente.",
    "auth/wrong-password": "ID ou senha incorretos. Confira os dados e tente novamente.",
    "auth/user-not-found": "ID ou senha incorretos. Confira os dados e tente novamente.",
    "auth/email-already-in-use": "Este ID já possui uma conta cadastrada.",
    "auth/weak-password": "A senha informada é muito fraca. Escolha uma senha mais segura.",
    "auth/too-many-requests": "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.",
    "auth/network-request-failed": "Não foi possível conectar. Verifique sua internet e tente novamente.",
    "auth/user-disabled": "Esta conta está desativada. Entre em contato com a administração.",
    "permission-denied": "Você não tem permissão para realizar esta operação.",
    "resource-exhausted": "O serviço atingiu seu limite de uso. Tente novamente mais tarde.",
    "unavailable": "O serviço está temporariamente indisponível. Tente novamente mais tarde."
};

export function friendlyError(error, fallback = "Não foi possível concluir a operação. Tente novamente.") {
    if (!error) return fallback;
    const code = String(error.code || "").replace(/^firestore\//, "");
    if (messages[code]) return messages[code];
    const message = String(error.message || "");
    // Erros de validação produzidos pelo próprio aplicativo já estão em português.
    if (message && !/firebase|auth\/|firestore|quota exceeded|internal|network error/i.test(message)) return message;
    return fallback;
}
