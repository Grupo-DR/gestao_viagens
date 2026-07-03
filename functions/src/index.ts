import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

/**
 * Registra uma ação administrativa na coleção audit_logs.
 */
async function logAudit(action: string, adminUid: string, adminEmail: string, targetUid: string, targetEmail: string) {
  try {
    await db.collection("audit_logs").add({
      action,
      adminUid,
      adminEmail,
      targetUid,
      targetEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao registrar log de auditoria:", error);
  }
}

/**
 * Verifica se o usuário logado pode executar ações administrativas.
 * Regra: UserRole.MASTER no DR TravelHub.
 */
async function verifyAdmin(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "O usuário deve estar logado."
    );
  }

  const uid = context.auth.uid;
  
  const userSnap = await db.collection("users").doc(uid).get();
  const userData = userSnap.data();

  if (!userData) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Perfil de usuário não encontrado."
    );
  }

  if (userData.role !== "MASTER") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Usuário não tem permissão de administrador (MASTER) para realizar esta ação."
    );
  }

  return {
    uid,
    email: context.auth.token.email || userData.email || "unknown",
  };
}

/**
 * Gera um link de redefinição de senha para um usuário.
 */
export const adminGeneratePasswordResetLink = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    const adminUser = await verifyAdmin(context);
    const { email } = data;

    if (!email) {
      throw new functions.https.HttpsError("invalid-argument", "Email é obrigatório.");
    }

    try {
        const targetUser = await auth.getUserByEmail(email);
        
        // Passando actionCodeSettings para que o link de redefinição retorne ao sistema
        const actionCodeSettings = {
            url: "http://localhost:3000/login", // O ideal seria pegar isso das variáveis de ambiente no futuro
            handleCodeInApp: false,
        };

        const link = await auth.generatePasswordResetLink(email, actionCodeSettings);

        await logAudit("PASSWORD_RESET_LINK_CREATED", adminUser.uid, adminUser.email, targetUser.uid, email);
        return { link };
    } catch (error: any) {
        console.error("Erro ao gerar link de redefinição:", error);
        throw new functions.https.HttpsError(
            "internal",
            "Erro ao gerar link de redefinição. Verifique se o e-mail está correto."
        );
    }
});
