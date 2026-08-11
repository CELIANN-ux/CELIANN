import { useState, useRef, useEffect, useContext, createContext } from "react";
import {
  Home, Search, MessageCircle, User, Heart, MessageSquare, Star, Plus, Send,
  Link2, Hash, BadgeCheck, Languages, X, ChevronLeft, Sparkles, Music,
  Code2, Palette, Briefcase, Video, PenTool, Camera, LogOut, Check, Mail,
  ShieldCheck, Users, TrendingUp, Pencil, Settings, Globe, Moon, Sun, Bell,
} from "lucide-react";
import {
  onAuthStateChanged, signInWithPopup, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc, getDoc, setDoc, updateDoc, addDoc, collection, query, orderBy,
  onSnapshot, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase.js";

/* Local-only UI preferences (theme, language, notification toggles) — everything
   else (profile, posts, comments, projects, following) now lives in Firebase. */
const prefsStorage = {
  load() {
    try { return JSON.parse(localStorage.getItem("celiann-prefs") || "{}"); }
    catch (e) { return {}; }
  },
  save(prefs) {
    try { localStorage.setItem("celiann-prefs", JSON.stringify(prefs)); }
    catch (e) {}
  },
};

/* ================= i18n + theme context =================
   Chrome (nav, buttons, labels) is translated. Other people's posts and
   reviews stay in whatever language they were written in — same logic as
   the per-message translate button in chat: your own interface adapts,
   other people's content doesn't change unless you ask it to. */

const STRINGS = {
  es: {
    nav_feed: "Feed", nav_search: "Buscar", nav_chat: "Chats", nav_profile: "Perfil", nav_settings: "Ajustes",
    composer_placeholder: "¿En qué estás trabajando? Usa # para etiquetar…",
    composer_post: "Publicar", composer_cancel: "Cancelar", composer_add_link: "Agregar enlace",
    search_placeholder: "Busca por nombre, palabra clave o #hashtag",
    search_all: "Todas", search_trending: "Tendencias",
    search_empty: "Nada por aquí todavía. Prueba con otra palabra o categoría.",
    chat_messages: "Mensajes", chat_input_placeholder: "Escribe un mensaje…",
    chat_translate: "Traducir", chat_translated_from: "Traducido de",
    profile_edit: "Editar", profile_save: "Guardar",
    profile_looking_for: "Busca colaborar con", profile_portfolio: "Portafolio de colaboraciones",
    profile_reviews: "Reseñas de colaboradores",
    profile_verified_note: "Perfil verificado. Puedes reportar cualquier cuenta sospechosa desde su perfil.",
    profile_follow: "Seguir", profile_following_btn: "Siguiendo", profile_message: "Enviar mensaje",
    profile_followers: "seguidores", profile_back: "Volver a tu perfil",
    profile_report: "Reportar cuenta", profile_reported: "Cuenta reportada",
    card_interested: "Me interesa colaborar",
    settings_title: "Ajustes",
    settings_language: "Idioma",
    settings_language_note: "Cambia los menús y botones. El contenido de otras personas se traduce desde el chat.",
    settings_more_soon: "Más idiomas próximamente",
    settings_theme: "Apariencia", settings_theme_light: "Claro", settings_theme_dark: "Oscuro",
    settings_notifications: "Notificaciones",
    settings_notif_collab: "Nuevas colaboraciones afines a tus intereses",
    settings_notif_messages: "Mensajes nuevos",
    settings_notif_mentions: "Menciones y comentarios",
    settings_account: "Cuenta", settings_logout: "Cerrar sesión",
    auth_google: "Continuar con Google", auth_or_email: "O CON TU CORREO",
    auth_email_placeholder: "tucorreo@ejemplo.com", auth_not_robot: "No soy un robot",
    auth_continue: "Continuar", auth_tagline: "Donde las ideas encuentran su frecuencia",
    auth_demo_note: "Prototipo de demostración — sin datos reales",
    onboarding_title: "CREA TU PERFIL",
    onboarding_account: "Cuenta", onboarding_new: "nueva", onboarding_visible: "esto es lo que verán los demás",
    onboarding_upload: "Subir foto", onboarding_upload_note: "Opcional — si no, usamos tus iniciales",
    onboarding_name_label: "Nombre", onboarding_name_ph: "¿Cómo te llamas?",
    onboarding_role_label: "A qué te dedicas", onboarding_role_ph: "Ej. Cantautor, Desarrollador, Cineasta...",
    onboarding_bio_label: "Breve descripción (opcional)", onboarding_bio_ph: "Una línea sobre ti o tu proyecto actual",
    onboarding_looking_label: "Con quién te interesa colaborar",
    onboarding_submit: "Entrar a CELIANN",
    stories_yours: "Tu historia", stories_new: "Nueva historia",
    stories_placeholder: "¿Qué estás creando ahora mismo?",
    stories_publish: "Publicar historia", stories_cancel: "Cancelar",
    cat_musica: "Música", cat_desarrollo: "Desarrollo", cat_diseno: "Diseño",
    cat_negocios: "Negocios", cat_video: "Video y cine", cat_escritura: "Escritura",
    status_buscando: "Buscando colaborador", status_progreso: "En progreso", status_completado: "Completado",
    nav_projects: "Proyectos",
    projects_new: "Nuevo proyecto", projects_title_ph: "Título del proyecto",
    projects_desc_ph: "¿De qué se trata este proyecto?", projects_create: "Crear proyecto",
    projects_members: "Miembros", projects_add_member: "Agregar miembro",
    projects_empty: "Aún no tienes proyectos. Crea uno para empezar a colaborar en grupo.",
    projects_agreement: "Acuerdo de colaboración",
    projects_agreement_note: "Reparte los créditos antes de empezar, así todos saben qué esperar.",
    projects_split: "Reparto", projects_terms: "Términos",
    projects_terms_ph: "Ej. créditos compartidos, quién publica, cómo se reparten las regalías...",
    projects_accept: "Aceptar acuerdo", projects_accepted: "Aceptado", projects_total: "Total",
    projects_group_placeholder: "Escribe algo para el grupo…",
    comments_title: "Comentarios", comments_placeholder: "Escribe un comentario…",
    comments_empty: "Sé el primero en comentar.",
    feed_match: "Coincide con lo que buscas",
    available_now: "Disponible ahora", available_busy: "Ocupado",
    available_toggle_label: "Disponible para colaborar",
    portfolio_add: "Agregar", portfolio_empty_hint: "Agrega tu primer proyecto",
    notif_title: "Notificaciones", notif_empty: "No tienes notificaciones todavía.",
    notif_collab_template: "Nueva publicación de {name} coincide con lo que buscas",
    notif_reply_template: "{name} te respondió",
    notif_project_template: "Nuevo mensaje en \"{title}\"",
    notif_comment_template: "{name} comentó en tu publicación",
    explore_region: "Región", explore_language: "Idioma",
    explore_all_regions: "Todas", explore_all_langs: "Todos",
    suggest_title: "Gente que te podría interesar", suggest_subtitle: "Según con quién quieres colaborar",
    suggest_continue: "Continuar", suggest_skip: "Omitir por ahora",
    share_copy: "Compartir", share_copied: "¡Enlace copiado!",
    auth_password_ph: "Contraseña",
    auth_toggle_to_login: "¿Ya tienes cuenta? Inicia sesión", auth_toggle_to_signup: "¿Cuenta nueva? Regístrate",
    auth_login_button: "Iniciar sesión", auth_signup_button: "Crear cuenta",
    auth_error_generic: "Algo salió mal. Intenta de nuevo.",
    auth_error_wrong_password: "Correo o contraseña incorrectos.",
    auth_error_email_in_use: "Ese correo ya tiene una cuenta. Intenta iniciar sesión.",
    auth_error_weak_password: "La contraseña debe tener al menos 6 caracteres.",
  },
  en: {
    nav_feed: "Feed", nav_search: "Search", nav_chat: "Chats", nav_profile: "Profile", nav_settings: "Settings",
    composer_placeholder: "What are you working on? Use # to tag…",
    composer_post: "Post", composer_cancel: "Cancel", composer_add_link: "Add link",
    search_placeholder: "Search by name, keyword or #hashtag",
    search_all: "All", search_trending: "Trending",
    search_empty: "Nothing here yet. Try another word or category.",
    chat_messages: "Messages", chat_input_placeholder: "Type a message…",
    chat_translate: "Translate", chat_translated_from: "Translated from",
    profile_edit: "Edit", profile_save: "Save",
    profile_looking_for: "Looking to collaborate with", profile_portfolio: "Collaboration portfolio",
    profile_reviews: "Collaborator reviews",
    profile_verified_note: "Verified profile. You can report any suspicious account from their profile.",
    profile_follow: "Follow", profile_following_btn: "Following", profile_message: "Send message",
    profile_followers: "followers", profile_back: "Back to your profile",
    profile_report: "Report account", profile_reported: "Account reported",
    card_interested: "I'm interested",
    settings_title: "Settings",
    settings_language: "Language",
    settings_language_note: "Changes the menus and buttons. Other people's content is translated from the chat.",
    settings_more_soon: "More languages coming soon",
    settings_theme: "Appearance", settings_theme_light: "Light", settings_theme_dark: "Dark",
    settings_notifications: "Notifications",
    settings_notif_collab: "New collaborations matching your interests",
    settings_notif_messages: "New messages",
    settings_notif_mentions: "Mentions and comments",
    settings_account: "Account", settings_logout: "Log out",
    auth_google: "Continue with Google", auth_or_email: "OR WITH YOUR EMAIL",
    auth_email_placeholder: "youremail@example.com", auth_not_robot: "I'm not a robot",
    auth_continue: "Continue", auth_tagline: "Where ideas find their frequency",
    auth_demo_note: "Demo prototype — no real data",
    onboarding_title: "CREATE YOUR PROFILE",
    onboarding_account: "Account", onboarding_new: "new", onboarding_visible: "this is what others will see",
    onboarding_upload: "Upload photo", onboarding_upload_note: "Optional — otherwise we use your initials",
    onboarding_name_label: "Name", onboarding_name_ph: "What's your name?",
    onboarding_role_label: "What you do", onboarding_role_ph: "E.g. Singer-songwriter, Developer, Filmmaker...",
    onboarding_bio_label: "Short bio (optional)", onboarding_bio_ph: "One line about you or your current project",
    onboarding_looking_label: "Who you'd like to collaborate with",
    onboarding_submit: "Enter CELIANN",
    stories_yours: "Your story", stories_new: "New story",
    stories_placeholder: "What are you creating right now?",
    stories_publish: "Post story", stories_cancel: "Cancel",
    cat_musica: "Music", cat_desarrollo: "Development", cat_diseno: "Design",
    cat_negocios: "Business", cat_video: "Video & film", cat_escritura: "Writing",
    status_buscando: "Looking for a collaborator", status_progreso: "In progress", status_completado: "Completed",
    nav_projects: "Projects",
    projects_new: "New project", projects_title_ph: "Project title",
    projects_desc_ph: "What's this project about?", projects_create: "Create project",
    projects_members: "Members", projects_add_member: "Add member",
    projects_empty: "No projects yet. Create one to start collaborating as a group.",
    projects_agreement: "Collaboration agreement",
    projects_agreement_note: "Split credit before you start, so everyone knows what to expect.",
    projects_split: "Split", projects_terms: "Terms",
    projects_terms_ph: "E.g. shared credit, who publishes, how royalties are split...",
    projects_accept: "Accept agreement", projects_accepted: "Accepted", projects_total: "Total",
    projects_group_placeholder: "Write something to the group…",
    comments_title: "Comments", comments_placeholder: "Write a comment…",
    comments_empty: "Be the first to comment.",
    feed_match: "Matches what you're looking for",
    available_now: "Available now", available_busy: "Busy",
    available_toggle_label: "Available to collaborate",
    portfolio_add: "Add", portfolio_empty_hint: "Add your first project",
    notif_title: "Notifications", notif_empty: "No notifications yet.",
    notif_collab_template: "New post from {name} matches what you're looking for",
    notif_reply_template: "{name} replied to you",
    notif_project_template: "New message in \"{title}\"",
    notif_comment_template: "{name} commented on your post",
    explore_region: "Region", explore_language: "Language",
    explore_all_regions: "All", explore_all_langs: "All",
    suggest_title: "People you might like", suggest_subtitle: "Based on who you want to collaborate with",
    suggest_continue: "Continue", suggest_skip: "Skip for now",
    share_copy: "Share", share_copied: "Link copied!",
    auth_password_ph: "Password",
    auth_toggle_to_login: "Already have an account? Log in", auth_toggle_to_signup: "New here? Sign up",
    auth_login_button: "Log in", auth_signup_button: "Create account",
    auth_error_generic: "Something went wrong. Try again.",
    auth_error_wrong_password: "Wrong email or password.",
    auth_error_email_in_use: "That email already has an account. Try logging in.",
    auth_error_weak_password: "Password must be at least 6 characters.",
  },
  fr: {
    nav_feed: "Fil", nav_search: "Rechercher", nav_chat: "Messages", nav_profile: "Profil", nav_settings: "Réglages",
    composer_placeholder: "Sur quoi travailles-tu ? Utilise # pour taguer…",
    composer_post: "Publier", composer_cancel: "Annuler", composer_add_link: "Ajouter un lien",
    search_placeholder: "Cherche par nom, mot-clé ou #hashtag",
    search_all: "Tous", search_trending: "Tendances",
    search_empty: "Rien ici pour l'instant. Essaie un autre mot ou une autre catégorie.",
    chat_messages: "Messages", chat_input_placeholder: "Écris un message…",
    chat_translate: "Traduire", chat_translated_from: "Traduit de",
    profile_edit: "Modifier", profile_save: "Enregistrer",
    profile_looking_for: "Cherche à collaborer avec", profile_portfolio: "Portfolio de collaborations",
    profile_reviews: "Avis des collaborateurs",
    profile_verified_note: "Profil vérifié. Tu peux signaler tout compte suspect depuis son profil.",
    profile_follow: "Suivre", profile_following_btn: "Abonné(e)", profile_message: "Envoyer un message",
    profile_followers: "abonnés", profile_back: "Retour à ton profil",
    profile_report: "Signaler ce compte", profile_reported: "Compte signalé",
    card_interested: "Ça m'intéresse",
    settings_title: "Réglages",
    settings_language: "Langue",
    settings_language_note: "Change les menus et les boutons. Le contenu des autres est traduit depuis le chat.",
    settings_more_soon: "Plus de langues bientôt",
    settings_theme: "Apparence", settings_theme_light: "Clair", settings_theme_dark: "Sombre",
    settings_notifications: "Notifications",
    settings_notif_collab: "Nouvelles collaborations proches de tes intérêts",
    settings_notif_messages: "Nouveaux messages",
    settings_notif_mentions: "Mentions et commentaires",
    settings_account: "Compte", settings_logout: "Se déconnecter",
    auth_google: "Continuer avec Google", auth_or_email: "OU AVEC TON E-MAIL",
    auth_email_placeholder: "tonemail@exemple.com", auth_not_robot: "Je ne suis pas un robot",
    auth_continue: "Continuer", auth_tagline: "Là où les idées trouvent leur fréquence",
    auth_demo_note: "Prototype de démonstration — aucune donnée réelle",
    onboarding_title: "CRÉE TON PROFIL",
    onboarding_account: "Compte", onboarding_new: "nouveau", onboarding_visible: "voici ce que les autres verront",
    onboarding_upload: "Ajouter une photo", onboarding_upload_note: "Facultatif — sinon on utilise tes initiales",
    onboarding_name_label: "Nom", onboarding_name_ph: "Comment t'appelles-tu ?",
    onboarding_role_label: "Ton activité", onboarding_role_ph: "Ex. Auteur-compositeur, Développeur, Cinéaste...",
    onboarding_bio_label: "Courte description (facultatif)", onboarding_bio_ph: "Une ligne sur toi ou ton projet actuel",
    onboarding_looking_label: "Avec qui tu aimerais collaborer",
    onboarding_submit: "Entrer dans CELIANN",
    stories_yours: "Ta story", stories_new: "Nouvelle story",
    stories_placeholder: "Que crées-tu en ce moment ?",
    stories_publish: "Publier la story", stories_cancel: "Annuler",
    cat_musica: "Musique", cat_desarrollo: "Développement", cat_diseno: "Design",
    cat_negocios: "Business", cat_video: "Vidéo et cinéma", cat_escritura: "Écriture",
    status_buscando: "Cherche un collaborateur", status_progreso: "En cours", status_completado: "Terminé",
    nav_projects: "Projets",
    projects_new: "Nouveau projet", projects_title_ph: "Titre du projet",
    projects_desc_ph: "De quoi parle ce projet ?", projects_create: "Créer le projet",
    projects_members: "Membres", projects_add_member: "Ajouter un membre",
    projects_empty: "Pas encore de projet. Crées-en un pour collaborer en groupe.",
    projects_agreement: "Accord de collaboration",
    projects_agreement_note: "Répartissez les crédits avant de commencer, pour que tout le monde sache à quoi s'attendre.",
    projects_split: "Répartition", projects_terms: "Conditions",
    projects_terms_ph: "Ex. crédits partagés, qui publie, comment les droits sont répartis...",
    projects_accept: "Accepter l'accord", projects_accepted: "Accepté", projects_total: "Total",
    projects_group_placeholder: "Écris quelque chose pour le groupe…",
    comments_title: "Commentaires", comments_placeholder: "Écris un commentaire…",
    comments_empty: "Sois le premier à commenter.",
    feed_match: "Correspond à ce que tu cherches",
    available_now: "Disponible maintenant", available_busy: "Occupé",
    available_toggle_label: "Disponible pour collaborer",
    portfolio_add: "Ajouter", portfolio_empty_hint: "Ajoute ton premier projet",
    notif_title: "Notifications", notif_empty: "Pas encore de notifications.",
    notif_collab_template: "Nouvelle publication de {name} qui correspond à ce que tu cherches",
    notif_reply_template: "{name} t'a répondu",
    notif_project_template: "Nouveau message dans « {title} »",
    notif_comment_template: "{name} a commenté ta publication",
    explore_region: "Région", explore_language: "Langue",
    explore_all_regions: "Toutes", explore_all_langs: "Toutes",
    suggest_title: "Des personnes qui pourraient t'intéresser", suggest_subtitle: "Selon avec qui tu veux collaborer",
    suggest_continue: "Continuer", suggest_skip: "Ignorer pour l'instant",
    share_copy: "Partager", share_copied: "Lien copié !",
    auth_password_ph: "Mot de passe",
    auth_toggle_to_login: "Tu as déjà un compte ? Connecte-toi", auth_toggle_to_signup: "Nouveau ici ? Inscris-toi",
    auth_login_button: "Se connecter", auth_signup_button: "Créer un compte",
    auth_error_generic: "Une erreur est survenue. Réessaie.",
    auth_error_wrong_password: "E-mail ou mot de passe incorrect.",
    auth_error_email_in_use: "Ce compte existe déjà. Essaie de te connecter.",
    auth_error_weak_password: "Le mot de passe doit contenir au moins 6 caractères.",
  },
  pt: {
    nav_feed: "Feed", nav_search: "Buscar", nav_chat: "Chats", nav_profile: "Perfil", nav_settings: "Ajustes",
    composer_placeholder: "No que você está trabalhando? Use # para marcar…",
    composer_post: "Publicar", composer_cancel: "Cancelar", composer_add_link: "Adicionar link",
    search_placeholder: "Busque por nome, palavra-chave ou #hashtag",
    search_all: "Todas", search_trending: "Em alta",
    search_empty: "Nada por aqui ainda. Tente outra palavra ou categoria.",
    chat_messages: "Mensagens", chat_input_placeholder: "Escreva uma mensagem…",
    chat_translate: "Traduzir", chat_translated_from: "Traduzido de",
    profile_edit: "Editar", profile_save: "Salvar",
    profile_looking_for: "Busca colaborar com", profile_portfolio: "Portfólio de colaborações",
    profile_reviews: "Avaliações de colaboradores",
    profile_verified_note: "Perfil verificado. Você pode denunciar qualquer conta suspeita pelo perfil dela.",
    profile_follow: "Seguir", profile_following_btn: "Seguindo", profile_message: "Enviar mensagem",
    profile_followers: "seguidores", profile_back: "Voltar ao seu perfil",
    profile_report: "Denunciar conta", profile_reported: "Conta denunciada",
    card_interested: "Tenho interesse",
    settings_title: "Ajustes",
    settings_language: "Idioma",
    settings_language_note: "Muda os menus e botões. O conteúdo de outras pessoas é traduzido pelo chat.",
    settings_more_soon: "Mais idiomas em breve",
    settings_theme: "Aparência", settings_theme_light: "Claro", settings_theme_dark: "Escuro",
    settings_notifications: "Notificações",
    settings_notif_collab: "Novas colaborações ligadas aos seus interesses",
    settings_notif_messages: "Novas mensagens",
    settings_notif_mentions: "Menções e comentários",
    settings_account: "Conta", settings_logout: "Sair",
    auth_google: "Continuar com o Google", auth_or_email: "OU COM SEU E-MAIL",
    auth_email_placeholder: "seuemail@exemplo.com", auth_not_robot: "Não sou um robô",
    auth_continue: "Continuar", auth_tagline: "Onde as ideias encontram sua frequência",
    auth_demo_note: "Protótipo de demonstração — sem dados reais",
    onboarding_title: "CRIE SEU PERFIL",
    onboarding_account: "Conta", onboarding_new: "nova", onboarding_visible: "é isso que os outros vão ver",
    onboarding_upload: "Enviar foto", onboarding_upload_note: "Opcional — senão usamos suas iniciais",
    onboarding_name_label: "Nome", onboarding_name_ph: "Qual é o seu nome?",
    onboarding_role_label: "No que você atua", onboarding_role_ph: "Ex. Cantor(a), Desenvolvedor(a), Cineasta...",
    onboarding_bio_label: "Descrição curta (opcional)", onboarding_bio_ph: "Uma linha sobre você ou seu projeto atual",
    onboarding_looking_label: "Com quem você quer colaborar",
    onboarding_submit: "Entrar no CELIANN",
    stories_yours: "Seu story", stories_new: "Novo story",
    stories_placeholder: "O que você está criando agora?",
    stories_publish: "Publicar story", stories_cancel: "Cancelar",
    cat_musica: "Música", cat_desarrollo: "Desenvolvimento", cat_diseno: "Design",
    cat_negocios: "Negócios", cat_video: "Vídeo e cinema", cat_escritura: "Escrita",
    status_buscando: "Buscando colaborador", status_progreso: "Em andamento", status_completado: "Concluído",
    nav_projects: "Projetos",
    projects_new: "Novo projeto", projects_title_ph: "Título do projeto",
    projects_desc_ph: "Do que se trata este projeto?", projects_create: "Criar projeto",
    projects_members: "Membros", projects_add_member: "Adicionar membro",
    projects_empty: "Você ainda não tem projetos. Crie um para colaborar em grupo.",
    projects_agreement: "Acordo de colaboração",
    projects_agreement_note: "Divida os créditos antes de começar, assim todos sabem o que esperar.",
    projects_split: "Divisão", projects_terms: "Termos",
    projects_terms_ph: "Ex. créditos compartilhados, quem publica, como os royalties são divididos...",
    projects_accept: "Aceitar acordo", projects_accepted: "Aceito", projects_total: "Total",
    projects_group_placeholder: "Escreva algo para o grupo…",
    comments_title: "Comentários", comments_placeholder: "Escreva um comentário…",
    comments_empty: "Seja o primeiro a comentar.",
    feed_match: "Combina com o que você procura",
    available_now: "Disponível agora", available_busy: "Ocupado",
    available_toggle_label: "Disponível para colaborar",
    portfolio_add: "Adicionar", portfolio_empty_hint: "Adicione seu primeiro projeto",
    notif_title: "Notificações", notif_empty: "Você ainda não tem notificações.",
    notif_collab_template: "Nova publicação de {name} combina com o que você procura",
    notif_reply_template: "{name} respondeu você",
    notif_project_template: "Nova mensagem em \"{title}\"",
    notif_comment_template: "{name} comentou na sua publicação",
    explore_region: "Região", explore_language: "Idioma",
    explore_all_regions: "Todas", explore_all_langs: "Todos",
    suggest_title: "Pessoas que podem te interessar", suggest_subtitle: "Com base em quem você quer colaborar",
    suggest_continue: "Continuar", suggest_skip: "Pular por agora",
    share_copy: "Compartilhar", share_copied: "Link copiado!",
    auth_password_ph: "Senha",
    auth_toggle_to_login: "Já tem conta? Entrar", auth_toggle_to_signup: "Novo por aqui? Criar conta",
    auth_login_button: "Entrar", auth_signup_button: "Criar conta",
    auth_error_generic: "Algo deu errado. Tente de novo.",
    auth_error_wrong_password: "E-mail ou senha incorretos.",
    auth_error_email_in_use: "Esse e-mail já tem conta. Tente entrar.",
    auth_error_weak_password: "A senha precisa ter pelo menos 6 caracteres.",
  },
  zh: {
    nav_feed: "动态", nav_search: "搜索", nav_chat: "聊天", nav_profile: "个人主页", nav_settings: "设置",
    composer_placeholder: "你在做什么项目？用 # 添加标签…",
    composer_post: "发布", composer_cancel: "取消", composer_add_link: "添加链接",
    search_placeholder: "按名字、关键词或 #话题标签搜索",
    search_all: "全部", search_trending: "热门话题",
    search_empty: "这里还没有内容，换个词或分类试试。",
    chat_messages: "消息", chat_input_placeholder: "输入消息…",
    chat_translate: "翻译", chat_translated_from: "翻译自",
    profile_edit: "编辑", profile_save: "保存",
    profile_looking_for: "希望与以下领域合作", profile_portfolio: "合作作品集",
    profile_reviews: "合作者评价",
    profile_verified_note: "已认证账号。你可以在对方主页举报可疑账号。",
    profile_follow: "关注", profile_following_btn: "已关注", profile_message: "发消息",
    profile_followers: "粉丝", profile_back: "返回我的主页",
    profile_report: "举报账号", profile_reported: "已举报",
    card_interested: "我感兴趣",
    settings_title: "设置",
    settings_language: "语言",
    settings_language_note: "更改菜单和按钮的语言。其他人发布的内容需在聊天里单独翻译。",
    settings_more_soon: "更多语言即将上线",
    settings_theme: "外观", settings_theme_light: "浅色", settings_theme_dark: "深色",
    settings_notifications: "通知",
    settings_notif_collab: "与你兴趣相关的新合作",
    settings_notif_messages: "新消息",
    settings_notif_mentions: "提及和评论",
    settings_account: "账号", settings_logout: "退出登录",
    auth_google: "使用 Google 继续", auth_or_email: "或使用邮箱",
    auth_email_placeholder: "你的邮箱地址", auth_not_robot: "我不是机器人",
    auth_continue: "继续", auth_tagline: "让创意找到属于它的频率",
    auth_demo_note: "演示原型 — 无真实数据",
    onboarding_title: "创建你的主页",
    onboarding_account: "账号", onboarding_new: "新账号", onboarding_visible: "这是其他人将看到的内容",
    onboarding_upload: "上传照片", onboarding_upload_note: "可选 — 否则使用你的姓名缩写",
    onboarding_name_label: "姓名", onboarding_name_ph: "你叫什么名字？",
    onboarding_role_label: "你的职业", onboarding_role_ph: "例如：创作歌手、开发者、导演……",
    onboarding_bio_label: "简介（可选）", onboarding_bio_ph: "一句话介绍你自己或当前项目",
    onboarding_looking_label: "你希望和谁合作",
    onboarding_submit: "进入 CELIANN",
    stories_yours: "你的动态", stories_new: "发布动态",
    stories_placeholder: "你现在正在创作什么？",
    stories_publish: "发布", stories_cancel: "取消",
    cat_musica: "音乐", cat_desarrollo: "开发", cat_diseno: "设计",
    cat_negocios: "商业", cat_video: "视频与电影", cat_escritura: "写作",
    status_buscando: "寻找合作者", status_progreso: "进行中", status_completado: "已完成",
    nav_projects: "项目",
    projects_new: "新建项目", projects_title_ph: "项目标题",
    projects_desc_ph: "这个项目是关于什么的？", projects_create: "创建项目",
    projects_members: "成员", projects_add_member: "添加成员",
    projects_empty: "还没有项目。创建一个开始团队协作吧。",
    projects_agreement: "合作协议",
    projects_agreement_note: "开始前先分配好署名和权益，大家心里都有数。",
    projects_split: "分成比例", projects_terms: "条款",
    projects_terms_ph: "例如：共同署名、由谁发布、版税如何分配……",
    projects_accept: "接受协议", projects_accepted: "已接受", projects_total: "总计",
    projects_group_placeholder: "给小组发消息…",
    comments_title: "评论", comments_placeholder: "写评论…",
    comments_empty: "抢沙发评论吧。",
    feed_match: "符合你的需求",
    available_now: "现在有空", available_busy: "忙碌中",
    available_toggle_label: "可协作",
    portfolio_add: "添加", portfolio_empty_hint: "添加你的第一个作品",
    notif_title: "通知", notif_empty: "暂时还没有通知。",
    notif_collab_template: "{name} 的新动态符合你的需求",
    notif_reply_template: "{name} 回复了你",
    notif_project_template: "「{title}」有新消息",
    notif_comment_template: "{name} 评论了你的动态",
    explore_region: "地区", explore_language: "语言",
    explore_all_regions: "全部", explore_all_langs: "全部",
    suggest_title: "你可能感兴趣的人", suggest_subtitle: "根据你想合作的领域推荐",
    suggest_continue: "继续", suggest_skip: "暂时跳过",
    share_copy: "分享", share_copied: "链接已复制！",
    auth_password_ph: "密码",
    auth_toggle_to_login: "已有账号？登录", auth_toggle_to_signup: "新用户？注册",
    auth_login_button: "登录", auth_signup_button: "创建账号",
    auth_error_generic: "出了点问题，请重试。",
    auth_error_wrong_password: "邮箱或密码不正确。",
    auth_error_email_in_use: "该邮箱已注册，请尝试登录。",
    auth_error_weak_password: "密码至少需要6个字符。",
  },
  ko: {
    nav_feed: "피드", nav_search: "검색", nav_chat: "채팅", nav_profile: "프로필", nav_settings: "설정",
    composer_placeholder: "지금 무엇을 작업 중인가요? #으로 태그해보세요…",
    composer_post: "게시", composer_cancel: "취소", composer_add_link: "링크 추가",
    search_placeholder: "이름, 키워드 또는 #해시태그로 검색",
    search_all: "전체", search_trending: "인기 태그",
    search_empty: "아직 이곳에 아무것도 없어요. 다른 단어나 카테고리를 시도해보세요.",
    chat_messages: "메시지", chat_input_placeholder: "메시지를 입력하세요…",
    chat_translate: "번역", chat_translated_from: "번역됨:",
    profile_edit: "편집", profile_save: "저장",
    profile_looking_for: "협업하고 싶은 분야", profile_portfolio: "협업 포트폴리오",
    profile_reviews: "협업자 리뷰",
    profile_verified_note: "인증된 프로필입니다. 상대방 프로필에서 의심스러운 계정을 신고할 수 있어요.",
    profile_follow: "팔로우", profile_following_btn: "팔로잉", profile_message: "메시지 보내기",
    profile_followers: "팔로워", profile_back: "내 프로필로 돌아가기",
    profile_report: "계정 신고", profile_reported: "신고 완료",
    card_interested: "관심 있어요",
    settings_title: "설정",
    settings_language: "언어",
    settings_language_note: "메뉴와 버튼의 언어가 바뀝니다. 다른 사람의 콘텐츠는 채팅에서 따로 번역됩니다.",
    settings_more_soon: "더 많은 언어가 곧 추가됩니다",
    settings_theme: "화면 모드", settings_theme_light: "밝게", settings_theme_dark: "어둡게",
    settings_notifications: "알림",
    settings_notif_collab: "관심사에 맞는 새로운 협업",
    settings_notif_messages: "새 메시지",
    settings_notif_mentions: "멘션 및 댓글",
    settings_account: "계정", settings_logout: "로그아웃",
    auth_google: "Google로 계속하기", auth_or_email: "또는 이메일로",
    auth_email_placeholder: "이메일 주소", auth_not_robot: "저는 로봇이 아닙니다",
    auth_continue: "계속하기", auth_tagline: "아이디어가 주파수를 찾는 곳",
    auth_demo_note: "데모 프로토타입 — 실제 데이터 아님",
    onboarding_title: "프로필 만들기",
    onboarding_account: "계정", onboarding_new: "새 계정", onboarding_visible: "다른 사람들에게 이렇게 보여요",
    onboarding_upload: "사진 업로드", onboarding_upload_note: "선택 사항 — 없으면 이니셜을 사용해요",
    onboarding_name_label: "이름", onboarding_name_ph: "이름이 무엇인가요?",
    onboarding_role_label: "하시는 일", onboarding_role_ph: "예: 싱어송라이터, 개발자, 영화감독...",
    onboarding_bio_label: "짧은 소개 (선택 사항)", onboarding_bio_ph: "자신이나 현재 프로젝트에 대한 한 줄 소개",
    onboarding_looking_label: "누구와 협업하고 싶나요",
    onboarding_submit: "CELIANN 시작하기",
    stories_yours: "내 스토리", stories_new: "새 스토리",
    stories_placeholder: "지금 무엇을 만들고 있나요?",
    stories_publish: "스토리 게시", stories_cancel: "취소",
    cat_musica: "음악", cat_desarrollo: "개발", cat_diseno: "디자인",
    cat_negocios: "비즈니스", cat_video: "영상 및 영화", cat_escritura: "글쓰기",
    status_buscando: "협업자 찾는 중", status_progreso: "진행 중", status_completado: "완료",
    nav_projects: "프로젝트",
    projects_new: "새 프로젝트", projects_title_ph: "프로젝트 제목",
    projects_desc_ph: "어떤 프로젝트인가요?", projects_create: "프로젝트 만들기",
    projects_members: "멤버", projects_add_member: "멤버 추가",
    projects_empty: "아직 프로젝트가 없어요. 그룹으로 협업을 시작해보세요.",
    projects_agreement: "협업 계약서",
    projects_agreement_note: "시작하기 전에 지분을 나눠두면 모두가 무엇을 기대할지 알 수 있어요.",
    projects_split: "지분 분배", projects_terms: "조건",
    projects_terms_ph: "예: 공동 크레딧, 발행 주체, 저작권료 분배 방식...",
    projects_accept: "계약 수락", projects_accepted: "수락됨", projects_total: "합계",
    projects_group_placeholder: "그룹에 메시지 보내기…",
    comments_title: "댓글", comments_placeholder: "댓글을 입력하세요…",
    comments_empty: "첫 댓글을 남겨보세요.",
    feed_match: "찾고 있는 것과 일치해요",
    available_now: "지금 가능", available_busy: "바쁨",
    available_toggle_label: "협업 가능",
    portfolio_add: "추가", portfolio_empty_hint: "첫 번째 작업물을 추가해보세요",
    notif_title: "알림", notif_empty: "아직 알림이 없어요.",
    notif_collab_template: "{name}님의 새 게시물이 찾고 있는 것과 일치해요",
    notif_reply_template: "{name}님이 답장했어요",
    notif_project_template: "\"{title}\"에 새 메시지가 있어요",
    notif_comment_template: "{name}님이 게시물에 댓글을 남겼어요",
    explore_region: "지역", explore_language: "언어",
    explore_all_regions: "전체", explore_all_langs: "전체",
    suggest_title: "관심 있을 만한 사람들", suggest_subtitle: "협업하고 싶은 분야를 기준으로 추천해요",
    suggest_continue: "계속하기", suggest_skip: "나중에 하기",
    share_copy: "공유", share_copied: "링크가 복사되었어요!",
    auth_password_ph: "비밀번호",
    auth_toggle_to_login: "이미 계정이 있나요? 로그인", auth_toggle_to_signup: "처음이신가요? 가입하기",
    auth_login_button: "로그인", auth_signup_button: "계정 만들기",
    auth_error_generic: "문제가 발생했어요. 다시 시도해주세요.",
    auth_error_wrong_password: "이메일 또는 비밀번호가 올바르지 않아요.",
    auth_error_email_in_use: "이미 가입된 이메일이에요. 로그인해보세요.",
    auth_error_weak_password: "비밀번호는 최소 6자 이상이어야 해요.",
  },
};

const LANGS = [
  { code: "es", label: "Español" }, { code: "en", label: "English" },
  { code: "fr", label: "Français" }, { code: "pt", label: "Português" },
  { code: "zh", label: "中文" }, { code: "ko", label: "한국어" },
];

const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }

/* fills {placeholders} in a translated string, e.g. tf(t, "notif_reply_template", { name: "Hana" }) */
function tf(t, key, vars) {
  let s = t(key);
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
  return s;
}

/* theme helper — swaps between two static, valid core-utility strings */
const cx = {
  page: (d) => (d ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"),
  surface: (d) => (d ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"),
  surfaceAlt: (d) => (d ? "bg-slate-800" : "bg-slate-100"),
  border: (d) => (d ? "border-slate-800" : "border-slate-200"),
  muted: (d) => (d ? "text-slate-400" : "text-slate-500"),
  faint: (d) => (d ? "text-slate-600" : "text-slate-400"),
  input: (d) => (d ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"),
  hover: (d) => (d ? "hover:bg-slate-800" : "hover:bg-slate-50"),
  ringViewed: (d) => (d ? "border-slate-700" : "border-slate-300"),
};

/* ---------------------------- constants ---------------------------- */

const CATEGORIES = [
  { id: "musica", icon: Music }, { id: "desarrollo", icon: Code2 }, { id: "diseno", icon: Palette },
  { id: "negocios", icon: Briefcase }, { id: "video", icon: Video }, { id: "escritura", icon: PenTool },
];

const STATUS_COLORS = {
  buscando: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200" },
  progreso: { dot: "bg-indigo-500", text: "text-indigo-700", bg: "bg-indigo-50", ring: "ring-indigo-200" },
  completado: { dot: "bg-teal-500", text: "text-teal-700", bg: "bg-teal-50", ring: "ring-teal-200" },
};

const AVATAR_COLORS = ["bg-indigo-500", "bg-amber-500", "bg-teal-500", "bg-rose-500", "bg-sky-500", "bg-violet-500"];

function colorFor(name) {
  const sum = [...(name || "?")].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}
function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}
function catIcon(id) {
  return (CATEGORIES.find((c) => c.id === id) || CATEGORIES[0]).icon;
}

/* ---------------------------- mock data ---------------------------- */

const INITIAL_POSTS = [
  { id: "p1", author: { name: "Renata Ibarra", role: "Cantautora", place: "CDMX, México", verified: true },
    category: "musica", status: "buscando",
    text: "Estoy armando un álbum de 6 canciones y busco un productor y alguien que filme el proceso. La idea: grabar todo, desde la primera nota hasta el lanzamiento, como una serie corta.",
    hashtags: ["Música", "Colaboración", "Pop"], link: null, likes: 34, createdAgo: "hace 2 h",
    comments: [
      { id: "c1", author: "Antoine Mercer", text: "Me encanta la idea de documentar todo el proceso, cuenta conmigo para la mezcla." },
      { id: "c2", author: "Marco Bellini", text: "Yo te ayudo con la parte de video si buscas a alguien con ojo narrativo." },
    ] },
  { id: "p2", author: { name: "Antoine Mercer", role: "Productor musical", place: "Auckland, Nueva Zelanda", verified: true },
    category: "musica", status: "progreso",
    text: "Ya son 4 de las 15 personas confirmadas para la colaboración global. Cada quien graba su parte en su idioma y país, yo armo la mezcla final.",
    hashtags: ["ColaboraciónGlobal", "Producción", "Mezcla"], link: { title: "Escuchar avance en YouTube" }, likes: 121, createdAgo: "hace 5 h",
    comments: [
      { id: "c1", author: "Renata Ibarra", text: "¡Esto es justo lo que quería armar! Me apunto con gusto." },
      { id: "c2", author: "Hana Woo", text: "Qué proyecto tan bonito, ojalá hagan un detrás de cámaras." },
      { id: "c3", author: "Aiko Tanaka", text: "¿Sigue habiendo lugar? Me encantaría escribir la letra de un verso." },
    ] },
  { id: "p3", author: { name: "Diego Salas", role: "Desarrollador full-stack", place: "Guadalajara, México", verified: false },
    category: "desarrollo", status: "buscando",
    text: "Estoy construyendo una app para que negocios locales lleguen a más clientes sin ir puerta por puerta. Necesito una persona de diseño UX para la primera versión.",
    hashtags: ["Startup", "UX", "Emprendimiento"], link: null, likes: 18, createdAgo: "hace 1 día",
    comments: [
      { id: "c1", author: "Hana Woo", text: "Me late mucho la idea, mándame más contexto por chat." },
    ] },
  { id: "p4", author: { name: "Hana Woo", role: "Diseñadora UX/UI", place: "Seúl, Corea del Sur", verified: true },
    category: "diseno", status: "completado",
    text: "Terminé el sistema de diseño para una app de finanzas personales. Fue mi tercera colaboración encontrada aquí. Abierta a nuevos proyectos.",
    hashtags: ["Diseño", "SistemaDeDiseño", "Producto"], link: null, likes: 56, createdAgo: "hace 1 día",
    comments: [
      { id: "c1", author: "Diego Salas", text: "Se ve increíble, ¿compartes algún preview público?" },
      { id: "c2", author: "Marco Bellini", text: "Tu trabajo siempre tan limpio, felicidades." },
    ] },
  { id: "p5", author: { name: "Marco Bellini", role: "Cineasta", place: "Milán, Italia", verified: false },
    category: "video", status: "buscando",
    text: "Cortometraje de 12 minutos ya filmado, en edición. Busco compositor para el score, algo minimalista con cuerdas.",
    hashtags: ["Cortometraje", "Música", "Cine"], link: null, likes: 41, createdAgo: "hace 2 días",
    comments: [
      { id: "c1", author: "Renata Ibarra", text: "Yo compongo con cuerdas, te mando un par de referencias." },
    ] },
  { id: "p6", author: { name: "Aiko Tanaka", role: "Escritora", place: "Tokio, Japón", verified: true },
    category: "escritura", status: "buscando",
    text: "Tengo el guion completo de un webcómic, 40 páginas. Busco ilustrador con estilo minimalista para el primer capítulo.",
    hashtags: ["Escritura", "Ilustración", "Webcómic"], link: null, likes: 29, createdAgo: "hace 3 días",
    comments: [] },
];

const TRENDING = ["Colaboración", "Música", "UX", "Startup", "Cortometraje", "ColaboraciónGlobal", "Ilustración", "Producción"];

const CONVERSATIONS = [
  { id: "c1", person: { name: "Antoine Mercer", role: "Productor musical", place: "Auckland, Nueva Zelanda" }, lang: "inglés", unread: true,
    messages: [
      { id: 1, from: "them", text: "Hey! I loved the idea of the 15-person collab track. I can produce and mix if you're still looking.", translated: "¡Oye! Me encantó la idea de la colaboración de 15 personas. Puedo producir y mezclar si sigues buscando." },
      { id: 2, from: "me", text: "¡Me encantaría! ¿Tienes experiencia mezclando voces grabadas en distintos países?" },
      { id: 3, from: "them", text: "Yes, done it three times before. Send me the first two vocal takes whenever you're ready.", translated: "Sí, lo he hecho tres veces antes. Mándame las primeras dos tomas de voz cuando quieras." },
    ] },
  { id: "c2", person: { name: "Hana Woo", role: "Diseñadora UX/UI", place: "Seúl, Corea del Sur" }, lang: "coreano", unread: false,
    messages: [
      { id: 1, from: "them", text: "안녕하세요! 포트폴리오 잘 봤어요. 함께 작업할 수 있을까요?", translated: "¡Hola! Vi tu portafolio, me encantó. ¿Podríamos trabajar juntos?" },
      { id: 2, from: "me", text: "¡Hola Hana! Sí, cuéntame más de tu disponibilidad esta semana." },
    ] },
];

const REVIEWS = [
  { id: "r1", name: "Antoine Mercer", stars: 5, text: "Cumplió con cada entrega a tiempo, comunicación clarísima incluso con la barrera del idioma." },
  { id: "r2", name: "Marco Bellini", stars: 5, text: "Excelente para tomar retroalimentación y ajustar rápido. Repetiría colaboración sin dudar." },
  { id: "r3", name: "Aiko Tanaka", stars: 4, text: "Buena colaboración, solo tardamos un poco en coordinar horarios por la diferencia de zona." },
];

const AUTHOR_PROFILES = {
  "Renata Ibarra": { role: "Cantautora", place: "CDMX, México", verified: true, bio: "Escribiendo mi segundo álbum, buscando gente con quien crear.", looking: ["musica", "video"], followers: 842, available: true, spokenLang: "es" },
  "Antoine Mercer": { role: "Productor musical", place: "Auckland, Nueva Zelanda", verified: true, bio: "Produzco y mezclo colaboraciones internacionales.", looking: ["musica"], followers: 1290, available: true, spokenLang: "en" },
  "Diego Salas": { role: "Desarrollador full-stack", place: "Guadalajara, México", verified: false, bio: "Construyendo herramientas para que negocios locales lleguen a más clientes.", looking: ["diseno", "negocios"], followers: 156, available: false, spokenLang: "es" },
  "Hana Woo": { role: "Diseñadora UX/UI", place: "Seúl, Corea del Sur", verified: true, bio: "Sistemas de diseño y producto digital. Tercera colaboración encontrada aquí.", looking: ["desarrollo", "negocios"], followers: 2310, available: true, spokenLang: "ko" },
  "Marco Bellini": { role: "Cineasta", place: "Milán, Italia", verified: false, bio: "Cortometrajes con enfoque narrativo minimalista.", looking: ["musica", "escritura"], followers: 430, available: false, spokenLang: "it" },
  "Aiko Tanaka": { role: "Escritora", place: "Tokio, Japón", verified: true, bio: "Guiones y webcómics, buscando ilustradores con estilo propio.", looking: ["diseno"], followers: 675, available: true, spokenLang: "ja" },
};

const SPOKEN_LANG_LABELS = { es: "Español", en: "English", it: "Italiano", ko: "한국어", ja: "日本語" };
function regionOf(place) {
  const parts = (place || "").split(",");
  return parts[parts.length - 1].trim();
}

const INITIAL_PROJECTS = [
  {
    id: "proj1",
    title: "Track colaborativo — 15 voces",
    description: "Cada persona graba su parte en su idioma y país; Antoine arma la mezcla final.",
    category: "musica",
    status: "progreso",
    members: ["Renata Ibarra", "Antoine Mercer"],
    messages: [
      { id: 1, from: "Renata Ibarra", text: "¡Ya llevamos 4 de 15! Subí mi parte a la carpeta compartida." },
      { id: 2, from: "Antoine Mercer", text: "Recibido, la mezclo este fin de semana." },
      { id: 3, from: "me", text: "Yo grabo la mía mañana 🎤" },
    ],
    agreement: {
      splits: { "Renata Ibarra": 40, "Antoine Mercer": 30, "Tú": 30 },
      terms: "Créditos compartidos como colaboración. Renata publica en su canal, regalías repartidas según el porcentaje de cada quien.",
      accepted: ["Renata Ibarra"],
    },
  },
];

const AUTO_REPLIES = [
  { text: "Sounds great, let's set up a call this week.", translated: "Suena genial, armemos una llamada esta semana." },
  { text: "I just sent over the file, let me know what you think!", translated: "Acabo de mandar el archivo, dime qué te parece." },
];

const STORY_GRADIENTS = [
  "bg-gradient-to-br from-rose-400 via-fuchsia-400 to-indigo-500",
  "bg-gradient-to-br from-amber-400 via-orange-400 to-rose-500",
  "bg-gradient-to-br from-teal-400 via-cyan-400 to-indigo-500",
  "bg-gradient-to-br from-indigo-400 via-violet-400 to-fuchsia-500",
  "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900",
];

const INITIAL_STORIES = [
  { id: "s1", name: "Renata Ibarra", gradient: STORY_GRADIENTS[0], text: "Grabando la voz principal 🎤", viewed: false },
  { id: "s2", name: "Antoine Mercer", gradient: STORY_GRADIENTS[1], text: "Mezclando la primera toma 🎧", viewed: false },
  { id: "s3", name: "Hana Woo", gradient: STORY_GRADIENTS[2], text: "Nueva paleta de colores 🎨", viewed: false },
  { id: "s4", name: "Diego Salas", gradient: STORY_GRADIENTS[3], text: "Wireframes listos ✅", viewed: false },
  { id: "s5", name: "Marco Bellini", gradient: STORY_GRADIENTS[4], text: "Últimos ajustes de color 🎬", viewed: false },
];

/* ---------------------------- small UI bits ---------------------------- */

function SignalPulse({ color = "bg-indigo-500", size = "sm" }) {
  const heights = size === "sm" ? ["h-2", "h-3", "h-1.5", "h-3.5"] : ["h-3", "h-5", "h-2.5", "h-6"];
  const delays = [0, 0.15, 0.3, 0.45];
  return (
    <span className="inline-flex items-end gap-0.5 h-4">
      {heights.map((h, i) => (
        <span key={i} className={`eq-bar ${h} ${color} rounded-full`} style={{ width: 3, animationDelay: `${delays[i]}s` }} />
      ))}
    </span>
  );
}

function Avatar({ name, size = "md", imageUrl, ring = false, available }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-lg", xl: "h-24 w-24 text-2xl" };
  const dotSizes = { sm: "h-2 w-2", md: "h-2.5 w-2.5", lg: "h-3 w-3", xl: "h-4 w-4" };
  const base = `${sizes[size]} rounded-full flex items-center justify-center font-mono font-bold text-white shrink-0 ${ring ? "ring-2 ring-white" : ""}`;
  const inner = imageUrl
    ? <img src={imageUrl} alt={name} className={`${sizes[size]} rounded-full object-cover shrink-0 ${ring ? "ring-2 ring-white" : ""}`} />
    : <div className={`${base} ${colorFor(name)}`}>{initials(name)}</div>;
  if (available === undefined) return inner;
  return (
    <span className="relative inline-block shrink-0">
      {inner}
      <span className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full ring-2 ring-white ${available ? "bg-teal-500" : "bg-slate-400"}`} />
    </span>
  );
}
function availabilityFor(name, user) {
  if (!user) return undefined;
  if (name === user.name) return user.available !== false;
  return AUTHOR_PROFILES[name]?.available;
}

function StatusChip({ status }) {
  const { t } = useApp();
  const s = STATUS_COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${s.bg} ${s.text} px-2 py-0.5 text-xs font-mono ring-1 ${s.ring}`}>
      <SignalPulse color={s.dot} /> {t(`status_${status}`)}
    </span>
  );
}

function Logo({ dark = true }) {
  return (
    <div className="flex items-center gap-2">
      <SignalPulse color={dark ? "bg-amber-400" : "bg-indigo-500"} size="md" />
      <span className={`font-mono font-black tracking-widest text-lg ${dark ? "text-white" : "text-slate-900"}`}>CELIANN</span>
    </div>
  );
}

/* ---------------------------- auth + onboarding ---------------------------- */

function AuthScreen() {
  const { t } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checked, setChecked] = useState(false);
  const [mode, setMode] = useState("signup"); // "signup" | "login"
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function friendlyError(code) {
    if (code === "auth/wrong-password" || code === "auth/invalid-credential" || code === "auth/user-not-found") return t("auth_error_wrong_password");
    if (code === "auth/email-already-in-use") return t("auth_error_email_in_use");
    if (code === "auth/weak-password") return t("auth_error_weak_password");
    return t("auth_error_generic");
  }

  async function withGoogle() {
    setError(""); setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setBusy(false);
    }
  }
  async function withEmail() {
    setError(""); setBusy(true);
    try {
      if (mode === "signup") await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <Logo />
          <p className="mt-3 text-slate-400 font-mono text-sm tracking-wide">{t("auth_tagline")}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <button disabled={busy} onClick={withGoogle} className="w-full flex items-center justify-center gap-2 border border-slate-300 rounded-xl py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60">
            <Sparkles className="h-4 w-4 text-indigo-500" /> {t("auth_google")}
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs text-slate-400 font-mono">{t("auth_or_email")}</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="relative mb-2.5">
            <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth_email_placeholder")}
              className="w-full border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth_password_ph")}
            className="w-full border border-slate-300 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />

          {mode === "signup" && (
            <label className="flex items-center gap-2 mt-4 text-sm text-slate-600 cursor-pointer select-none">
              <span onClick={() => setChecked((c) => !c)} className={`h-5 w-5 rounded border flex items-center justify-center transition ${checked ? "bg-indigo-600 border-indigo-600" : "border-slate-300"}`}>
                {checked && <Check className="h-3.5 w-3.5 text-white" />}
              </span>
              {t("auth_not_robot")}
            </label>
          )}

          {error && <p className="text-xs text-rose-500 mt-3">{error}</p>}

          <button disabled={busy || !email || !password || (mode === "signup" && !checked)} onClick={withEmail}
            className="w-full mt-4 bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl py-2.5 font-medium hover:bg-indigo-700 transition">
            {mode === "signup" ? t("auth_signup_button") : t("auth_login_button")}
          </button>

          <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }} className="w-full mt-3 text-sm text-indigo-600 py-1">
            {mode === "signup" ? t("auth_toggle_to_login") : t("auth_toggle_to_signup")}
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">{t("auth_demo_note")}</p>
      </div>
    </div>
  );
}

function OnboardingScreen({ email, onDone }) {
  const { t } = useApp();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [looking, setLooking] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileRef = useRef(null);

  function toggleLooking(id) { setLooking((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])); }
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result);
    reader.readAsDataURL(file);
  }
  const canSubmit = name.trim() && role.trim() && looking.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-7">
        <h1 className="font-mono font-black tracking-wide text-xl text-slate-900">{t("onboarding_title")}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {t("onboarding_account")} {email ? <span className="font-medium text-slate-700">{email}</span> : t("onboarding_new")} · {t("onboarding_visible")}
        </p>

        <div className="flex items-center gap-4 mt-6">
          <Avatar name={name || "?"} size="xl" imageUrl={avatarUrl} />
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition">
              <Camera className="h-4 w-4" /> {t("onboarding_upload")}
            </button>
            <p className="text-xs text-slate-400 mt-1">{t("onboarding_upload_note")}</p>
          </div>
        </div>

        <div className="mt-5">
          <label className="text-xs font-mono text-slate-500 uppercase tracking-wide">{t("onboarding_name_label")}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("onboarding_name_ph")}
            className="w-full border border-slate-300 rounded-lg py-2 px-3 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="mt-4">
          <label className="text-xs font-mono text-slate-500 uppercase tracking-wide">{t("onboarding_role_label")}</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder={t("onboarding_role_ph")}
            className="w-full border border-slate-300 rounded-lg py-2 px-3 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="mt-4">
          <label className="text-xs font-mono text-slate-500 uppercase tracking-wide">{t("onboarding_bio_label")}</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder={t("onboarding_bio_ph")}
            className="w-full border border-slate-300 rounded-lg py-2 px-3 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>

        <div className="mt-4">
          <label className="text-xs font-mono text-slate-500 uppercase tracking-wide">{t("onboarding_looking_label")}</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = looking.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggleLooking(c.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition ${active ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 text-slate-600 hover:border-indigo-300"}`}>
                  <Icon className="h-3.5 w-3.5" /> {t(`cat_${c.id}`)}
                </button>
              );
            })}
          </div>
        </div>

        <button disabled={!canSubmit} onClick={() => onDone({ name, role, bio, looking, avatarUrl })}
          className="w-full mt-6 bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl py-2.5 font-medium hover:bg-indigo-700 transition">
          {t("onboarding_submit")}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- suggestions ---------------------------- */

function SuggestionsScreen({ user, following, setFollowing, onContinue }) {
  const { t, dark } = useApp();
  let candidates = Object.entries(AUTHOR_PROFILES)
    .filter(([, p]) => p.looking.some((cat) => (user.looking || []).includes(cat)))
    .map(([name, p]) => ({ name, ...p }));
  if (candidates.length === 0) candidates = Object.entries(AUTHOR_PROFILES).map(([name, p]) => ({ name, ...p }));
  candidates = candidates.slice(0, 4);

  function toggle(name) {
    setFollowing((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-7">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-5 w-5 text-indigo-600" />
          <h1 className="font-mono font-black tracking-wide text-lg text-slate-900">{t("suggest_title")}</h1>
        </div>
        <p className="text-slate-500 text-sm mb-5">{t("suggest_subtitle")}</p>

        <div className="space-y-2.5 mb-6">
          {candidates.map((c) => {
            const isFollowing = following.includes(c.name);
            return (
              <div key={c.name} className="flex items-center gap-3">
                <Avatar name={c.name} available={c.available} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                  <p className="text-xs text-slate-500 truncate">{c.role} · {c.place}</p>
                </div>
                <button onClick={() => toggle(c.name)}
                  className={`flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1.5 shrink-0 transition ${isFollowing ? "border border-slate-300 text-slate-500" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                  {isFollowing ? <><Check className="h-3.5 w-3.5" /> {t("profile_following_btn")}</> : <><Plus className="h-3.5 w-3.5" /> {t("profile_follow")}</>}
                </button>
              </div>
            );
          })}
        </div>

        <button onClick={onContinue} className="w-full bg-indigo-600 text-white rounded-xl py-2.5 font-medium hover:bg-indigo-700 transition">
          {t("suggest_continue")}
        </button>
        <button onClick={onContinue} className="w-full mt-2 text-sm text-slate-500 py-1.5">
          {t("suggest_skip")}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- stories ---------------------------- */

function StoryRing({ children, viewed, dark }) {
  if (viewed) {
    return <div className={`p-0.5 rounded-full border-2 ${cx.ringViewed(dark)}`}>{children}</div>;
  }
  return (
    <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500">
      <div className={`p-0.5 rounded-full ${dark ? "bg-slate-950" : "bg-slate-50"}`}>{children}</div>
    </div>
  );
}

function StoryCreateModal({ onClose, onPublish }) {
  const { t, dark } = useApp();
  const [text, setText] = useState("");
  const [grad, setGrad] = useState(STORY_GRADIENTS[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-dim">
      <div className={`w-full max-w-sm rounded-2xl p-5 ${cx.surface(dark)} border`}>
        <div className={`h-24 rounded-xl ${grad} flex items-center justify-center p-3 text-center`}>
          <p className="text-white text-sm font-medium">{text || t("stories_placeholder")}</p>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={t("stories_placeholder")}
          className={`w-full mt-3 rounded-lg py-2 px-3 text-sm border resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${cx.input(dark)}`} />
        <div className="flex gap-2 mt-3">
          {STORY_GRADIENTS.map((g) => (
            <button key={g} onClick={() => setGrad(g)} className={`h-7 w-7 rounded-full ${g} ${grad === g ? "ring-2 ring-offset-2 ring-indigo-500" : ""}`} />
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className={`text-sm px-3 py-1.5 ${cx.muted(dark)}`}>{t("stories_cancel")}</button>
          <button onClick={() => text.trim() && onPublish({ text, gradient: grad })}
            className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-indigo-700">
            {t("stories_publish")}
          </button>
        </div>
      </div>
    </div>
  );
}

function StoryViewer({ stories, index, setIndex, onClose }) {
  const story = stories[index];
  useEffect(() => {
    if (!story) onClose();
  }, [story]);
  if (!story) return null;

  function next() { if (index + 1 < stories.length) setIndex(index + 1); else onClose(); }
  function prev() { if (index > 0) setIndex(index - 1); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-strong">
      <div className={`relative w-full max-w-sm rounded-2xl overflow-hidden ${story.gradient}`} style={{ height: "78vh" }}>
        <div className="absolute inset-0 flex">
          <button className="flex-1" onClick={prev} aria-label="Anterior" />
          <button className="flex-1" onClick={next} aria-label="Siguiente" />
        </div>

        <div className="relative flex flex-col justify-between h-full p-5 text-white pointer-events-none">
          <div className="flex gap-1">
            {stories.map((s, i) => (
              <div key={s.id} className="story-track h-1 flex-1 rounded-full overflow-hidden">
                {i < index && <div className="story-fill h-full" style={{ width: "100%", animation: "none" }} />}
                {i === index && <div key={story.id} className="story-fill h-full" style={{ animationDuration: "4500ms" }} onAnimationEnd={next} />}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-3 pointer-events-auto">
            <Avatar name={story.mine ? "Tú" : story.name} size="sm" ring />
            <span className="text-sm font-medium">{story.mine ? "Tú" : story.name}</span>
            <button onClick={onClose} className="ml-auto pointer-events-auto"><X className="h-5 w-5" /></button>
          </div>

          <p className="text-lg font-medium leading-snug">{story.text}</p>
        </div>
      </div>
    </div>
  );
}

function StoryBar({ stories, setStories, viewerIndex, setViewerIndex }) {
  const { t, dark } = useApp();
  const [creating, setCreating] = useState(false);
  const mine = stories.find((s) => s.mine);

  function open(id) {
    const i = stories.findIndex((s) => s.id === id);
    setStories((prev) => prev.map((s) => (s.id === id ? { ...s, viewed: true } : s)));
    setViewerIndex(i);
  }
  function publish({ text, gradient }) {
    const story = { id: `mine-${Date.now()}`, name: "Tú", gradient, text, viewed: false, mine: true };
    setStories((prev) => [story, ...prev]);
    setCreating(false);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-1 mb-4">
      {!mine ? (
        <button onClick={() => setCreating(true)} className="flex flex-col items-center gap-1.5 shrink-0">
          <div className={`h-14 w-14 rounded-full border-2 border-dashed flex items-center justify-center ${cx.ringViewed(dark)}`}>
            <Plus className={`h-5 w-5 ${cx.muted(dark)}`} />
          </div>
          <span className={`text-xs ${cx.muted(dark)}`}>{t("stories_yours")}</span>
        </button>
      ) : null}

      {stories.map((s) => (
        <button key={s.id} onClick={() => open(s.id)} className="flex flex-col items-center gap-1.5 shrink-0">
          <StoryRing viewed={s.viewed} dark={dark}>
            <div className="h-14 w-14 rounded-full flex items-center justify-center">
              <Avatar name={s.mine ? "Tú" : s.name} size="lg" />
            </div>
          </StoryRing>
          <span className={`text-xs max-w-16 truncate ${cx.muted(dark)}`}>{s.mine ? t("stories_yours") : s.name.split(" ")[0]}</span>
        </button>
      ))}

      {creating && <StoryCreateModal onClose={() => setCreating(false)} onPublish={publish} />}
      {viewerIndex !== null && (
        <StoryViewer stories={stories} index={viewerIndex} setIndex={setViewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </div>
  );
}

/* ---------------------------- feed ---------------------------- */

function Composer({ user, onPost }) {
  const { t, dark } = useApp();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [status, setStatus] = useState("buscando");
  const [link, setLink] = useState("");
  const [showLink, setShowLink] = useState(false);

  function submit() {
    if (!text.trim()) return;
    const hashtags = [...text.matchAll(/#(\w+)/g)].map((m) => m[1]);
    onPost({
      id: `p${Date.now()}`, author: { name: user.name, role: user.role, place: "Tu ubicación", verified: true },
      category, status, text, hashtags, link: link ? { title: link } : null,
      likes: 0, comments: [], createdAgo: "ahora",
    });
    setText(""); setLink(""); setShowLink(false); setOpen(false);
  }

  return (
    <div className={`border rounded-xl p-4 mb-4 ${cx.surface(dark)}`}>
      <div className="flex gap-3">
        <Avatar name={user.name} imageUrl={user.avatarUrl} />
        <textarea value={text} onFocus={() => setOpen(true)} onChange={(e) => setText(e.target.value)}
          placeholder={t("composer_placeholder")} rows={open ? 3 : 1}
          className={`flex-1 resize-none text-sm bg-transparent focus:outline-none ${dark ? "placeholder:text-slate-500" : "placeholder:text-slate-400"}`} />
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={`text-xs font-mono px-2.5 py-1 rounded-full border transition ${category === c.id ? "bg-slate-900 text-white border-slate-900" : `${cx.border(dark)} ${cx.muted(dark)}`}`}>
                {t(`cat_${c.id}`)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_COLORS).map(([key, s]) => (
              <button key={key} onClick={() => setStatus(key)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ring-1 transition ${status === key ? `${s.bg} ${s.text} ${s.ring}` : `${cx.faint(dark)} ${cx.border(dark)}`}`}>
                <SignalPulse color={s.dot} /> {t(`status_${key}`)}
              </button>
            ))}
          </div>

          {showLink ? (
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="youtube.com/..."
              className={`w-full rounded-lg py-1.5 px-3 text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${cx.input(dark)}`} />
          ) : (
            <button onClick={() => setShowLink(true)} className={`flex items-center gap-1.5 text-sm hover:text-indigo-600 ${cx.muted(dark)}`}>
              <Link2 className="h-4 w-4" /> {t("composer_add_link")}
            </button>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setOpen(false)} className={`text-sm px-3 py-1.5 ${cx.muted(dark)}`}>{t("composer_cancel")}</button>
            <button onClick={submit} className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-indigo-700">{t("composer_post")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onOpenChat, onOpenProfile, onAddComment, user, matches }) {
  const { t, dark } = useApp();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState("");
  const shareRef = useRef(null);
  const Icon = catIcon(post.category);
  const shareText = `${post.text}\n\n— ${post.author.name} en CELIANN\nceliann.app/p/${post.id}`;

  function submitComment() {
    if (!draft.trim()) return;
    onAddComment(post.id, draft);
    setDraft("");
  }
  function copyShare() {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareText).then(done).catch(() => {
        shareRef.current?.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
      });
    } else {
      shareRef.current?.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
    }
  }

  return (
    <div className={`border rounded-xl p-4 mb-4 ${cx.surface(dark)}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onOpenProfile(post.author.name)} className="shrink-0">
          <Avatar name={post.author.name} available={availabilityFor(post.author.name, user)} />
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => onOpenProfile(post.author.name)} className="flex items-center gap-1.5 flex-wrap hover:underline">
            <span className="font-semibold text-sm">{post.author.name}</span>
            {post.author.verified && <BadgeCheck className="h-4 w-4 text-teal-500" />}
            <span className={`text-xs no-underline ${cx.faint(dark)}`}>· {post.createdAgo}</span>
          </button>
          <p className={`text-xs ${cx.muted(dark)}`}>{post.author.role} · {post.author.place}</p>
        </div>
        <StatusChip status={post.status} />
      </div>

      {matches && (
        <span className="inline-flex items-center gap-1 text-xs font-mono text-teal-600 bg-teal-50 rounded-full px-2 py-0.5 mt-2">
          <SignalPulse color="bg-teal-500" /> {t("feed_match")}
        </span>
      )}

      <p className="text-sm mt-3 leading-relaxed">{post.text}</p>

      {post.link && (
        <a href="#" onClick={(e) => e.preventDefault()} className={`flex items-center gap-2 mt-3 border rounded-lg p-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition ${cx.border(dark)}`}>
          <Link2 className="h-4 w-4 shrink-0" /> <span className="truncate">{post.link.title}</span>
        </a>
      )}

      <div className="flex items-center flex-wrap gap-2 mt-3">
        <span className={`flex items-center gap-1 text-xs font-mono mr-1 ${cx.faint(dark)}`}>
          <Icon className="h-3.5 w-3.5" /> {t(`cat_${post.category}`)}
        </span>
        {post.hashtags.map((h) => (
          <span key={h} className="flex items-center gap-0.5 text-xs font-mono text-indigo-500"><Hash className="h-3 w-3" />{h}</span>
        ))}
      </div>

      <div className={`flex items-center gap-4 mt-3 pt-3 border-t ${cx.border(dark)}`}>
        <button onClick={() => { setLiked(!liked); setLikes(likes + (liked ? -1 : 1)); }}
          className={`flex items-center gap-1.5 text-sm ${liked ? "text-rose-500" : cx.faint(dark)} hover:text-rose-500 transition`}>
          <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} /> {likes}
        </button>
        <button onClick={() => setShowComments((s) => !s)} className={`flex items-center gap-1.5 text-sm ${showComments ? "text-indigo-600" : cx.faint(dark)} hover:text-indigo-600 transition`}>
          <MessageSquare className="h-4 w-4" /> {post.comments.length}
        </button>
        <button onClick={() => setShowShare((s) => !s)} className={`flex items-center gap-1.5 text-sm ${showShare ? "text-indigo-600" : cx.faint(dark)} hover:text-indigo-600 transition`}>
          <Link2 className="h-4 w-4" />
        </button>
        <button onClick={() => onOpenChat(post.author.name)} className="ml-auto flex items-center gap-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition">
          <MessageCircle className="h-4 w-4" /> {t("card_interested")}
        </button>
      </div>

      {showShare && (
        <div className={`mt-3 pt-3 border-t ${cx.border(dark)}`}>
          <textarea ref={shareRef} readOnly value={shareText} rows={3}
            className={`w-full rounded-lg p-2.5 text-xs border resize-none focus:outline-none ${cx.input(dark)}`}
            onClick={(e) => e.target.select()} />
          <button onClick={copyShare} className="w-full mt-2 flex items-center justify-center gap-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700">
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {copied ? t("share_copied") : t("share_copy")}
          </button>
        </div>
      )}

      {showComments && (
        <div className={`mt-3 pt-3 border-t space-y-2.5 ${cx.border(dark)}`}>
          {post.comments.length === 0 ? (
            <p className={`text-xs ${cx.faint(dark)}`}>{t("comments_empty")}</p>
          ) : (
            post.comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <Avatar name={c.author} size="sm" />
                <div className={`flex-1 min-w-0 rounded-lg px-2.5 py-1.5 ${cx.surfaceAlt(dark)}`}>
                  <p className="text-xs font-semibold">{c.author}</p>
                  <p className="text-sm">{c.text}</p>
                </div>
              </div>
            ))
          )}
          <div className="flex items-center gap-2 pt-1">
            <Avatar name={user.name} imageUrl={user.avatarUrl} size="sm" />
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder={t("comments_placeholder")}
              className={`flex-1 rounded-full py-1.5 px-3 text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${cx.input(dark)}`} />
            <button onClick={submitComment} className="text-indigo-600 shrink-0"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedView({ user, posts, onCreatePost, onOpenChat, onOpenProfile, onAddComment, stories, setStories, viewerIndex, setViewerIndex }) {
  const sorted = [...posts].sort((a, b) => {
    const aMatch = user.looking?.includes(a.category) ? 0 : 1;
    const bMatch = user.looking?.includes(b.category) ? 0 : 1;
    return aMatch - bMatch;
  });
  return (
    <div className="max-w-xl mx-auto px-4 py-5">
      <StoryBar stories={stories} setStories={setStories} viewerIndex={viewerIndex} setViewerIndex={setViewerIndex} />
      <Composer user={user} onPost={onCreatePost} />
      {sorted.map((p) => (
        <PostCard key={p.id} post={p} onOpenChat={onOpenChat} onOpenProfile={onOpenProfile} onAddComment={onAddComment} user={user}
          matches={user.looking?.includes(p.category)} />
      ))}
    </div>
  );
}

/* ---------------------------- search ---------------------------- */

function SearchView({ posts, onOpenChat, onOpenProfile, onAddComment, user }) {
  const { t, dark } = useApp();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState(null);
  const [region, setRegion] = useState(null);
  const [spokenLang, setSpokenLang] = useState(null);

  const regions = [...new Set(posts.map((p) => regionOf(p.author.place)))];
  const langsPresent = [...new Set(posts.map((p) => AUTHOR_PROFILES[p.author.name]?.spokenLang).filter(Boolean))];

  const filtered = posts.filter((p) => {
    const q = query.toLowerCase();
    const matchesQuery = !q || p.text.toLowerCase().includes(q) || p.author.name.toLowerCase().includes(q) || p.hashtags.some((h) => h.toLowerCase().includes(q));
    const matchesRegion = !region || regionOf(p.author.place) === region;
    const matchesLang = !spokenLang || AUTHOR_PROFILES[p.author.name]?.spokenLang === spokenLang;
    return matchesQuery && (!cat || p.category === cat) && matchesRegion && matchesLang;
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-5">
      <div className="relative mb-4">
        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search_placeholder")}
          className={`w-full rounded-xl py-2.5 pl-9 pr-3 text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${cx.input(dark)}`} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setCat(null)} className={`text-xs font-mono px-3 py-1.5 rounded-full border ${!cat ? "bg-slate-900 text-white border-slate-900" : `${cx.border(dark)} ${cx.muted(dark)}`}`}>
          {t("search_all")}
        </button>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button key={c.id} onClick={() => setCat(c.id)} className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border ${cat === c.id ? "bg-slate-900 text-white border-slate-900" : `${cx.border(dark)} ${cx.muted(dark)}`}`}>
              <Icon className="h-3.5 w-3.5" /> {t(`cat_${c.id}`)}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 mb-1.5">
        <Globe className={`h-3.5 w-3.5 ${cx.faint(dark)}`} />
        <span className={`text-xs font-mono uppercase tracking-wide ${cx.faint(dark)}`}>{t("explore_region")}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={() => setRegion(null)} className={`text-xs px-2.5 py-1 rounded-full border ${!region ? "bg-slate-900 text-white border-slate-900" : `${cx.border(dark)} ${cx.muted(dark)}`}`}>
          {t("explore_all_regions")}
        </button>
        {regions.map((r) => (
          <button key={r} onClick={() => setRegion(r)} className={`text-xs px-2.5 py-1 rounded-full border ${region === r ? "bg-slate-900 text-white border-slate-900" : `${cx.border(dark)} ${cx.muted(dark)}`}`}>
            {r}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mb-1.5">
        <Languages className={`h-3.5 w-3.5 ${cx.faint(dark)}`} />
        <span className={`text-xs font-mono uppercase tracking-wide ${cx.faint(dark)}`}>{t("explore_language")}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setSpokenLang(null)} className={`text-xs px-2.5 py-1 rounded-full border ${!spokenLang ? "bg-slate-900 text-white border-slate-900" : `${cx.border(dark)} ${cx.muted(dark)}`}`}>
          {t("explore_all_langs")}
        </button>
        {langsPresent.map((l) => (
          <button key={l} onClick={() => setSpokenLang(l)} className={`text-xs px-2.5 py-1 rounded-full border ${spokenLang === l ? "bg-slate-900 text-white border-slate-900" : `${cx.border(dark)} ${cx.muted(dark)}`}`}>
            {SPOKEN_LANG_LABELS[l] || l}
          </button>
        ))}
      </div>

      <div className={`flex items-center gap-1.5 text-xs font-mono mb-2 uppercase tracking-wide ${cx.faint(dark)}`}>
        <TrendingUp className="h-3.5 w-3.5" /> {t("search_trending")}
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        {TRENDING.map((tag) => (
          <button key={tag} onClick={() => setQuery(tag)} className="flex items-center gap-0.5 text-xs font-mono text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full hover:bg-indigo-100">
            <Hash className="h-3 w-3" />{tag}
          </button>
        ))}
      </div>

      <div className={`h-px mb-4 ${cx.border(dark)} border-t`} />

      {filtered.length === 0 ? (
        <p className={`text-sm text-center py-8 ${cx.faint(dark)}`}>{t("search_empty")}</p>
      ) : (
        filtered.map((p) => (
          <PostCard key={p.id} post={p} onOpenChat={onOpenChat} onOpenProfile={onOpenProfile} onAddComment={onAddComment} user={user}
            matches={user.looking?.includes(p.category)} />
        ))
      )}
    </div>
  );
}

/* ---------------------------- chat ---------------------------- */

function ChatView({ conversations, setConversations, activeId, setActiveId, onOpenProfile, onNotify }) {
  const { t, dark } = useApp();
  const active = conversations.find((c) => c.id === activeId) || conversations[0];
  const [draft, setDraft] = useState("");
  const [translated, setTranslated] = useState({});
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active?.messages?.length, activeId]);

  function updateConv(id, fn) { setConversations((prev) => prev.map((c) => (c.id === id ? fn(c) : c))); }
  function send() {
    if (!draft.trim() || !active) return;
    const personName = active.person.name;
    updateConv(active.id, (c) => ({ ...c, messages: [...c.messages, { id: Date.now(), from: "me", text: draft }] }));
    setDraft("");
    setTimeout(() => {
      const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      updateConv(active.id, (c) => ({ ...c, messages: [...c.messages, { id: Date.now() + 1, from: "them", ...reply }] }));
      onNotify?.(tf(t, "notif_reply_template", { name: personName }));
    }, 1300);
  }
  function toggleTranslate(msgId) { setTranslated((prev) => ({ ...prev, [msgId]: !prev[msgId] })); }

  if (!active) return null;

  return (
    <div className="max-w-4xl mx-auto flex chat-shell">
      <div className={`w-full md:w-72 shrink-0 border-r ${cx.surface(dark)} ${activeId ? "hidden md:block" : "block"}`}>
        <div className={`p-4 font-mono font-bold text-xs uppercase tracking-wide ${cx.faint(dark)}`}>{t("chat_messages")}</div>
        {conversations.map((c) => (
          <button key={c.id} onClick={() => setActiveId(c.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${cx.hover(dark)} ${active.id === c.id ? (dark ? "bg-slate-800" : "bg-indigo-50") : ""}`}>
            <Avatar name={c.person.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold truncate">{c.person.name}</span>
                {c.unread && <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />}
              </div>
              <p className={`text-xs truncate ${cx.faint(dark)}`}>{c.messages[c.messages.length - 1]?.text}</p>
            </div>
          </button>
        ))}
      </div>

      <div className={`flex-1 flex flex-col ${dark ? "bg-slate-950" : "bg-slate-50"} ${activeId ? "flex" : "hidden md:flex"}`}>
        <div className={`flex items-center gap-3 p-4 border-b ${cx.surface(dark)}`}>
          <button onClick={() => setActiveId(null)} className={`md:hidden ${cx.muted(dark)}`}><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => onOpenProfile(active.person.name)} className="flex items-center gap-3 hover:opacity-80">
            <Avatar name={active.person.name} />
            <div className="text-left">
              <p className="text-sm font-semibold">{active.person.name}</p>
              <p className={`text-xs ${cx.faint(dark)}`}>{active.person.role} · {active.person.place}</p>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {active.messages.map((m) => {
            const isMe = m.from === "me";
            const showT = translated[m.id];
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs rounded-2xl px-3.5 py-2 text-sm ${isMe ? "bg-indigo-600 text-white" : `border ${cx.surface(dark)}`}`}>
                  <p>{showT && m.translated ? m.translated : m.text}</p>
                  {!isMe && m.translated && (
                    <button onClick={() => toggleTranslate(m.id)} className="flex items-center gap-1 text-xs text-indigo-500 mt-1.5 font-mono">
                      <Languages className="h-3 w-3" /> {showT ? `${t("chat_translated_from")} ${active.lang}` : t("chat_translate")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className={`p-3 border-t flex items-center gap-2 mb-16 md:mb-0 ${cx.surface(dark)}`}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t("chat_input_placeholder")}
            className={`flex-1 rounded-full py-2 px-4 text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${cx.input(dark)}`} />
          <button onClick={send} className="bg-indigo-600 text-white rounded-full h-9 w-9 flex items-center justify-center hover:bg-indigo-700 transition shrink-0">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- projects ---------------------------- */

function ProjectComposer({ onCreate }) {
  const { t, dark } = useApp();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].id);

  function submit() {
    if (!title.trim()) return;
    onCreate({ title, description, category });
    setTitle(""); setDescription(""); setCategory(CATEGORIES[0].id); setOpen(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg py-2.5 mb-3 hover:bg-indigo-100">
        <Plus className="h-4 w-4" /> {t("projects_new")}
      </button>
    );
  }
  return (
    <div className={`border rounded-xl p-3 mb-3 ${cx.surface(dark)}`}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("projects_title_ph")}
        className={`w-full rounded-lg py-2 px-3 text-sm border mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${cx.input(dark)}`} />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder={t("projects_desc_ph")}
        className={`w-full rounded-lg py-2 px-3 text-sm border mb-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${cx.input(dark)}`} />
      <div className="flex flex-wrap gap-2 mb-3">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`text-xs font-mono px-2.5 py-1 rounded-full border ${category === c.id ? "bg-slate-900 text-white border-slate-900" : `${cx.border(dark)} ${cx.muted(dark)}`}`}>
            {t(`cat_${c.id}`)}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className={`text-sm px-3 py-1.5 ${cx.muted(dark)}`}>{t("composer_cancel")}</button>
        <button onClick={submit} className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-indigo-700">{t("projects_create")}</button>
      </div>
    </div>
  );
}

function ProjectAgreement({ project, onUpdateProject }) {
  const { t, dark } = useApp();
  const participants = ["Tú", ...project.members];
  const splits = project.agreement.splits;
  const total = participants.reduce((sum, p) => sum + (splits[p] ?? 0), 0);
  const accepted = project.agreement.accepted;
  const iAccepted = accepted.includes("Tú");

  function setSplit(name, value) {
    onUpdateProject(project, (pr) => ({ ...pr, agreement: { ...pr.agreement, splits: { ...pr.agreement.splits, [name]: value } } }));
  }
  function setTerms(value) {
    onUpdateProject(project, (pr) => ({ ...pr, agreement: { ...pr.agreement, terms: value } }));
  }
  function accept() {
    onUpdateProject(project, (pr) => ({ ...pr, agreement: { ...pr.agreement, accepted: [...new Set([...pr.agreement.accepted, "Tú"])] } }));
  }

  return (
    <div className={`mt-3 border rounded-xl p-3.5 ${cx.surfaceAlt(dark)}`}>
      <p className="text-xs font-mono uppercase tracking-wide mb-1">{t("projects_agreement")}</p>
      <p className={`text-xs mb-3 ${cx.muted(dark)}`}>{t("projects_agreement_note")}</p>

      <p className={`text-xs font-mono uppercase tracking-wide mb-1.5 ${cx.faint(dark)}`}>{t("projects_split")}</p>
      <div className="space-y-1.5 mb-2">
        {participants.map((p) => (
          <div key={p} className="flex items-center gap-2">
            <Avatar name={p} size="sm" />
            <span className="text-sm flex-1 min-w-0 truncate">{p}</span>
            <input type="number" min={0} max={100} value={splits[p] ?? 0}
              onChange={(e) => setSplit(p, Math.max(0, Math.min(100, Number(e.target.value))))}
              className={`w-16 text-sm rounded-lg py-1 px-2 border text-right ${cx.input(dark)}`} />
            <span className={`text-xs ${cx.faint(dark)}`}>%</span>
          </div>
        ))}
      </div>
      <p className={`text-xs mb-3 ${total === 100 ? "text-teal-600" : "text-amber-600"}`}>{t("projects_total")}: {total}%</p>

      <p className={`text-xs font-mono uppercase tracking-wide mb-1.5 ${cx.faint(dark)}`}>{t("projects_terms")}</p>
      <textarea value={project.agreement.terms} onChange={(e) => setTerms(e.target.value)} rows={2} placeholder={t("projects_terms_ph")}
        className={`w-full rounded-lg py-2 px-3 text-sm border mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${cx.input(dark)}`} />

      <div className="flex flex-wrap gap-2 mb-2">
        {participants.map((p) => (
          <span key={p} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${accepted.includes(p) ? "bg-teal-50 text-teal-700" : `border ${cx.border(dark)} ${cx.faint(dark)}`}`}>
            {accepted.includes(p) && <Check className="h-3 w-3" />} {p}
          </span>
        ))}
      </div>
      {!iAccepted ? (
        <button onClick={accept} className="w-full flex items-center justify-center gap-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700">
          <Check className="h-4 w-4" /> {t("projects_accept")}
        </button>
      ) : (
        <p className="flex items-center gap-1.5 text-sm text-teal-600 font-medium">
          <Check className="h-4 w-4" /> {t("projects_accepted")}
        </p>
      )}
    </div>
  );
}

function ProjectDetail({ project, onUpdateProject, onBack, onOpenProfile, onNotify }) {
  const { t, dark } = useApp();
  const [draft, setDraft] = useState("");
  const [showAgreement, setShowAgreement] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [project.messages.length]);

  const candidates = Object.keys(AUTHOR_PROFILES).filter((n) => !project.members.includes(n));
  const Icon = catIcon(project.category);

  function send() {
    if (!draft.trim()) return;
    onUpdateProject(project, (p) => ({ ...p, messages: [...p.messages, { id: Date.now(), from: "me", text: draft }] }));
    setDraft("");
    if (project.members.length > 0) {
      setTimeout(() => {
        const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
        const from = project.members[Math.floor(Math.random() * project.members.length)];
        onUpdateProject(project, (p) => ({ ...p, messages: [...p.messages, { id: Date.now() + 1, from, text: reply.translated }] }));
        onNotify?.(tf(t, "notif_project_template", { title: project.title }));
      }, 1300);
    }
  }
  function addMember(name) {
    onUpdateProject(project, (p) => ({ ...p, members: [...p.members, name] }));
    setShowAddMember(false);
  }

  return (
    <div className={`flex-1 flex flex-col ${dark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className={`p-4 border-b ${cx.surface(dark)}`}>
        <div className="flex items-start gap-2">
          <button onClick={onBack} className={`md:hidden ${cx.muted(dark)} shrink-0 mt-0.5`}><ChevronLeft className="h-5 w-5" /></button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold">{project.title}</h2>
              <StatusChip status={project.status} />
            </div>
            <p className={`text-xs mt-0.5 flex items-center gap-1 ${cx.muted(dark)}`}><Icon className="h-3 w-3" /> {t(`cat_${project.category}`)}</p>
            {project.description && <p className={`text-sm mt-1.5 ${cx.muted(dark)}`}>{project.description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          <span className={`text-xs font-mono uppercase tracking-wide mr-1 ${cx.faint(dark)}`}>{t("projects_members")}</span>
          {["Tú", ...project.members].map((m) => (
            <button key={m} onClick={() => m !== "Tú" && onOpenProfile(m)} className="shrink-0">
              <Avatar name={m} size="sm" />
            </button>
          ))}
          <button onClick={() => setShowAddMember((s) => !s)} className={`h-8 w-8 rounded-full border border-dashed flex items-center justify-center ${cx.ringViewed(dark)}`}>
            <Plus className={`h-4 w-4 ${cx.muted(dark)}`} />
          </button>
        </div>
        {showAddMember && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {candidates.length === 0 ? (
              <span className={`text-xs ${cx.faint(dark)}`}>—</span>
            ) : (
              candidates.map((name) => (
                <button key={name} onClick={() => addMember(name)} className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 rounded-full pl-1 pr-2 py-1">
                  <Avatar name={name} size="sm" /> {name}
                </button>
              ))
            )}
          </div>
        )}

        <button onClick={() => setShowAgreement((s) => !s)} className={`flex items-center gap-1.5 text-sm font-medium mt-3 ${showAgreement ? "text-indigo-600" : cx.muted(dark)}`}>
          <ShieldCheck className="h-4 w-4" /> {t("projects_agreement")}
        </button>
        {showAgreement && <ProjectAgreement project={project} onUpdateProject={onUpdateProject} />}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {project.messages.map((m) => {
          const isMe = m.from === "me";
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="max-w-xs">
                {!isMe && <p className={`text-xs mb-0.5 ml-1 ${cx.faint(dark)}`}>{m.from}</p>}
                <div className={`rounded-2xl px-3.5 py-2 text-sm ${isMe ? "bg-indigo-600 text-white" : `border ${cx.surface(dark)}`}`}>{m.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className={`p-3 border-t flex items-center gap-2 mb-16 md:mb-0 ${cx.surface(dark)}`}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("projects_group_placeholder")}
          className={`flex-1 rounded-full py-2 px-4 text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${cx.input(dark)}`} />
        <button onClick={send} className="bg-indigo-600 text-white rounded-full h-9 w-9 flex items-center justify-center hover:bg-indigo-700 transition shrink-0">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ProjectsView({ projects, onUpdateProject, activeId, setActiveId, onOpenProfile, onNotify }) {
  const { t, dark } = useApp();
  const active = projects.find((p) => p.id === activeId);

  async function createProject({ title, description, category }) {
    const proj = {
      title, description, category, status: "buscando",
      members: [], messages: [],
      agreement: { splits: { "Tú": 100 }, terms: "", accepted: [] },
      createdAt: new Date().toISOString(),
    };
    try {
      const ref = await addDoc(collection(db, "projects"), proj);
      setActiveId(ref.id);
    } catch (e) {
      // fall back to a local-only project if the write fails, so the UI still responds
      const localId = `proj${Date.now()}`;
      setActiveId(localId);
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex chat-shell">
      <div className={`w-full md:w-72 shrink-0 border-r overflow-y-auto ${cx.surface(dark)} ${activeId ? "hidden md:block" : "block"}`}>
        <div className="p-4 pb-0">
          <p className={`font-mono font-bold text-xs uppercase tracking-wide mb-3 ${cx.faint(dark)}`}>{t("nav_projects")}</p>
          <ProjectComposer onCreate={createProject} />
        </div>
        {projects.length === 0 ? (
          <p className={`text-sm text-center px-4 ${cx.faint(dark)}`}>{t("projects_empty")}</p>
        ) : (
          projects.map((p) => {
            const Icon = catIcon(p.category);
            return (
              <button key={p.id} onClick={() => setActiveId(p.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition ${cx.hover(dark)} ${active?.id === p.id ? (dark ? "bg-slate-800" : "bg-indigo-50") : ""}`}>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${cx.surfaceAlt(dark)}`}><Icon className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{p.title}</p>
                  <p className={`text-xs truncate ${cx.faint(dark)}`}>{p.members.length + 1} · {t(`status_${p.status}`)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {active ? (
        <ProjectDetail project={active} onUpdateProject={onUpdateProject} onBack={() => setActiveId(null)} onOpenProfile={onOpenProfile} onNotify={onNotify} />
      ) : (
        <div className={`hidden md:flex flex-1 items-center justify-center ${cx.faint(dark)}`}>
          <Users className="h-8 w-8" />
        </div>
      )}
    </div>
  );
}

/* ---------------------------- profile ---------------------------- */

function ProfileView({ subjectName, user, setUser, following, setFollowing, onOpenChat, onBackToMe }) {
  const { t, dark } = useApp();
  const isSelf = !subjectName || subjectName === user.name;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user);
  const [reported, setReported] = useState(false);
  const fileRef = useRef(null);
  const portfolioFileRef = useRef(null);
  const avg = (REVIEWS.reduce((a, r) => a + r.stars, 0) / REVIEWS.length).toFixed(1);

  const other = !isSelf ? (AUTHOR_PROFILES[subjectName] || { role: "", place: "", verified: false, bio: "", looking: [], followers: 0 }) : null;
  const shown = isSelf ? user : { name: subjectName, ...other };
  const isFollowing = !isSelf && following.includes(subjectName);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, avatarUrl: reader.result }));
    reader.readAsDataURL(file);
  }
  function handlePortfolioFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUser((u) => ({ ...u, portfolio: [...(u.portfolio || []), { id: `pf${Date.now()}`, dataUrl: reader.result }] }));
    reader.readAsDataURL(file);
    e.target.value = "";
  }
  function removePortfolioItem(id) {
    setUser((u) => ({ ...u, portfolio: (u.portfolio || []).filter((item) => item.id !== id) }));
  }
  function toggleFollow() {
    setFollowing((prev) => (prev.includes(subjectName) ? prev.filter((n) => n !== subjectName) : [...prev, subjectName]));
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-5">
      {!isSelf && (
        <button onClick={onBackToMe} className={`flex items-center gap-1.5 text-sm mb-3 ${cx.muted(dark)} hover:text-indigo-600`}>
          <ChevronLeft className="h-4 w-4" /> {t("profile_back")}
        </button>
      )}

      <div className={`border rounded-xl p-5 ${cx.surface(dark)}`}>
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar name={editing ? draft.name : shown.name} imageUrl={editing ? draft.avatarUrl : shown.avatarUrl} size="xl"
              available={isSelf ? user.available !== false : other.available} />
            {isSelf && editing && (
              <>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full h-7 w-7 flex items-center justify-center">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {isSelf && editing ? (
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className={`font-semibold text-lg border-b bg-transparent focus:outline-none focus:border-indigo-500 w-full ${cx.border(dark)}`} />
            ) : (
              <div className="flex items-center gap-1.5">
                <h2 className="font-semibold text-lg">{shown.name}</h2>
                {(isSelf || other.verified) && <BadgeCheck className="h-5 w-5 text-teal-500" />}
              </div>
            )}
            {isSelf && editing ? (
              <input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                className={`text-sm border-b bg-transparent focus:outline-none focus:border-indigo-500 w-full mt-1 ${cx.border(dark)} ${cx.muted(dark)}`} />
            ) : (
              <p className={`text-sm mt-0.5 ${cx.muted(dark)}`}>{shown.role}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">{avg}</span>
                <span className={`text-xs ${cx.faint(dark)}`}>({REVIEWS.length})</span>
              </span>
              {!isSelf && (
                <span className={`text-xs ${cx.faint(dark)}`}>· {other.followers.toLocaleString()} {t("profile_followers")}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {isSelf ? (
                <>
                  <Switch checked={user.available !== false} onChange={() => setUser({ ...user, available: !(user.available !== false) })} />
                  <span className="text-xs">{t("available_toggle_label")}</span>
                </>
              ) : (
                <span className="flex items-center gap-1.5 text-xs">
                  <span className={`h-2 w-2 rounded-full ${other.available ? "bg-teal-500" : "bg-slate-400"}`} />
                  {other.available ? t("available_now") : t("available_busy")}
                </span>
              )}
            </div>
          </div>

          {isSelf ? (
            <button onClick={() => { if (editing) setUser(draft); else setDraft(user); setEditing(!editing); }}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 shrink-0">
              {editing ? <><Check className="h-4 w-4" /> {t("profile_save")}</> : <><Pencil className="h-4 w-4" /> {t("profile_edit")}</>}
            </button>
          ) : (
            <button onClick={toggleFollow}
              className={`flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-1.5 shrink-0 transition ${isFollowing ? `border ${cx.border(dark)} ${cx.muted(dark)}` : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
              {isFollowing ? <><Check className="h-4 w-4" /> {t("profile_following_btn")}</> : <><Plus className="h-4 w-4" /> {t("profile_follow")}</>}
            </button>
          )}
        </div>

        {isSelf && editing ? (
          <textarea value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} rows={2}
            className={`w-full mt-4 text-sm rounded-lg p-2 border focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${cx.input(dark)}`} />
        ) : (
          shown.bio && <p className={`text-sm mt-4 ${cx.muted(dark)}`}>{shown.bio}</p>
        )}

        {!isSelf && (
          <button onClick={() => onOpenChat(subjectName)} className="w-full mt-4 flex items-center justify-center gap-1.5 text-sm font-medium bg-indigo-50 text-indigo-600 rounded-lg py-2 hover:bg-indigo-100">
            <MessageCircle className="h-4 w-4" /> {t("profile_message")}
          </button>
        )}

        <div className="mt-4">
          <p className={`text-xs font-mono uppercase tracking-wide mb-2 ${cx.faint(dark)}`}>{t("profile_looking_for")}</p>
          <div className="flex flex-wrap gap-2">
            {shown.looking.map((id) => {
              const Icon = catIcon(id);
              return (
                <span key={id} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cx.surfaceAlt(dark)}`}>
                  <Icon className="h-3.5 w-3.5" /> {t(`cat_${id}`)}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <p className={`text-xs font-mono uppercase tracking-wide mb-2 flex items-center gap-1.5 ${cx.faint(dark)}`}>
          <Users className="h-3.5 w-3.5" /> {t("profile_portfolio")}
        </p>
        {isSelf ? (
          <div className="grid grid-cols-3 gap-2">
            {(user.portfolio || []).map((item) => (
              <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden">
                <img src={item.dataUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removePortfolioItem(item.id)} className="absolute top-1 right-1 bg-black/60 rounded-full h-5 w-5 flex items-center justify-center">
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
            <button onClick={() => portfolioFileRef.current?.click()}
              className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 p-1 ${cx.ringViewed(dark)} ${cx.faint(dark)}`}>
              <Plus className="h-5 w-5" />
              {(user.portfolio || []).length === 0 && <span className="text-xs text-center leading-tight">{t("portfolio_empty_hint")}</span>}
            </button>
            <input ref={portfolioFileRef} type="file" accept="image/*" onChange={handlePortfolioFile} className="hidden" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => {
              const Icon = CATEGORIES[i].icon;
              return (
                <div key={i} className={`aspect-square rounded-lg flex items-center justify-center ${["bg-indigo-100", "bg-amber-100", "bg-teal-100"][i]}`}>
                  <Icon className={`h-6 w-6 ${["text-indigo-500", "text-amber-500", "text-teal-500"][i]}`} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className={`text-xs font-mono uppercase tracking-wide mb-2 ${cx.faint(dark)}`}>{t("profile_reviews")}</p>
        <div className="space-y-2">
          {REVIEWS.map((r) => (
            <div key={r.id} className={`border rounded-xl p-3.5 ${cx.surface(dark)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{r.name}</span>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.stars ? "fill-amber-400 text-amber-400" : cx.border(dark)}`} />
                  ))}
                </span>
              </div>
              <p className={`text-sm mt-1 ${cx.muted(dark)}`}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      {isSelf ? (
        <div className={`mt-5 flex items-center gap-2 text-xs rounded-lg p-3 ${cx.surfaceAlt(dark)} ${cx.muted(dark)}`}>
          <ShieldCheck className="h-4 w-4 text-teal-500 shrink-0" /> {t("profile_verified_note")}
        </div>
      ) : (
        <button onClick={() => setReported(true)} disabled={reported}
          className={`mt-5 text-xs underline ${reported ? "text-teal-500" : `${cx.faint(dark)} hover:text-rose-500`}`}>
          {reported ? t("profile_reported") : t("profile_report")}
        </button>
      )}
    </div>
  );
}

/* ---------------------------- settings ---------------------------- */

function Switch({ checked, onChange }) {
  return (
    <button onClick={onChange} className={`w-10 h-6 rounded-full flex items-center px-0.5 transition shrink-0 ${checked ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"}`}>
      <span className="h-5 w-5 bg-white rounded-full shadow" />
    </button>
  );
}

function SettingsView({ onLogout }) {
  const { t, dark, setDark, lang, setLang, notifs, setNotifs } = useApp();

  return (
    <div className="max-w-xl mx-auto px-4 py-5 space-y-4">
      <h1 className="font-mono font-black tracking-wide text-xl">{t("settings_title")}</h1>

      <div className={`border rounded-xl p-4 ${cx.surface(dark)}`}>
        <p className="flex items-center gap-2 text-sm font-semibold mb-1"><Globe className="h-4 w-4" /> {t("settings_language")}</p>
        <p className={`text-xs mb-3 ${cx.muted(dark)}`}>{t("settings_language_note")}</p>
        <div className="flex flex-wrap gap-2">
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code)}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${lang === l.code ? "bg-indigo-600 text-white border-indigo-600" : `${cx.border(dark)} ${cx.muted(dark)}`}`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`border rounded-xl p-4 ${cx.surface(dark)}`}>
        <p className="flex items-center gap-2 text-sm font-semibold mb-3">{dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} {t("settings_theme")}</p>
        <div className="flex gap-2">
          <button onClick={() => setDark(false)} className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg border ${!dark ? "bg-indigo-600 text-white border-indigo-600" : `${cx.border(dark)} ${cx.muted(dark)}`}`}>
            <Sun className="h-4 w-4" /> {t("settings_theme_light")}
          </button>
          <button onClick={() => setDark(true)} className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg border ${dark ? "bg-indigo-600 text-white border-indigo-600" : `${cx.border(dark)} ${cx.muted(dark)}`}`}>
            <Moon className="h-4 w-4" /> {t("settings_theme_dark")}
          </button>
        </div>
      </div>

      <div className={`border rounded-xl p-4 ${cx.surface(dark)}`}>
        <p className="flex items-center gap-2 text-sm font-semibold mb-3"><Bell className="h-4 w-4" /> {t("settings_notifications")}</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">{t("settings_notif_collab")}</span>
            <Switch checked={notifs.collab} onChange={() => setNotifs((n) => ({ ...n, collab: !n.collab }))} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">{t("settings_notif_messages")}</span>
            <Switch checked={notifs.messages} onChange={() => setNotifs((n) => ({ ...n, messages: !n.messages }))} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">{t("settings_notif_mentions")}</span>
            <Switch checked={notifs.mentions} onChange={() => setNotifs((n) => ({ ...n, mentions: !n.mentions }))} />
          </div>
        </div>
      </div>

      <div className={`border rounded-xl p-4 ${cx.surface(dark)}`}>
        <p className="text-sm font-semibold mb-3">{t("settings_account")}</p>
        <button onClick={onLogout} className="flex items-center gap-2 text-sm text-rose-500 font-medium">
          <LogOut className="h-4 w-4" /> {t("settings_logout")}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- shell / nav ---------------------------- */

function useNav() {
  const { t } = useApp();
  return [
    { id: "feed", label: t("nav_feed"), icon: Home },
    { id: "search", label: t("nav_search"), icon: Search },
    { id: "chat", label: t("nav_chat"), icon: MessageCircle },
    { id: "projects", label: t("nav_projects"), icon: Users },
    { id: "profile", label: t("nav_profile"), icon: User },
    { id: "settings", label: t("nav_settings"), icon: Settings },
  ];
}

function NotificationsPanel({ notifications, onClose, onClickItem }) {
  const { t, dark } = useApp();
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 overlay-dim">
      <div className={`w-full max-w-sm rounded-2xl border overflow-y-auto ${cx.surface(dark)}`} style={{ maxHeight: "70vh" }}>
        <div className={`flex items-center justify-between p-4 border-b ${cx.border(dark)}`}>
          <p className="text-sm font-semibold">{t("notif_title")}</p>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        {notifications.length === 0 ? (
          <p className={`text-sm text-center py-8 ${cx.faint(dark)}`}>{t("notif_empty")}</p>
        ) : (
          notifications.map((n) => (
            <button key={n.id} onClick={() => onClickItem(n)}
              className={`w-full text-left flex items-start gap-2.5 p-3.5 border-b last:border-0 ${cx.border(dark)} ${cx.hover(dark)} ${!n.read ? (dark ? "bg-slate-800" : "bg-indigo-50") : ""}`}>
              <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-indigo-500" : "bg-transparent"}`} />
              <span className="text-sm">{n.text}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function NotifBadge({ count }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center leading-none">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function MobileTopBar({ notifications, onOpenNotifs }) {
  const { dark } = useApp();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className={`md:hidden sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 border-b ${cx.surface(dark)}`}>
      <Logo dark={dark} />
      <button onClick={onOpenNotifs} className={`relative ${cx.muted(dark)}`}>
        <Bell className="h-5 w-5" />
        <NotifBadge count={unread} />
      </button>
    </div>
  );
}

function Sidebar({ tab, setTab, user, onLogout, notifications, onOpenNotifs }) {
  const nav = useNav();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-slate-900 p-4">
      <div className="flex items-center justify-between px-2 pb-6">
        <Logo />
        <button onClick={onOpenNotifs} className="relative text-slate-400 hover:text-white">
          <Bell className="h-5 w-5" />
          <NotifBadge count={unread} />
        </button>
      </div>
      <div className="space-y-1">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
              <Icon className="h-5 w-5" /> {n.label}
            </button>
          );
        })}
      </div>
      <div className="mt-auto flex items-center gap-2.5 border-t border-slate-800 pt-4">
        <Avatar name={user.name} imageUrl={user.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-slate-500 truncate">{user.role}</p>
        </div>
        <button onClick={onLogout} className="text-slate-500 hover:text-white shrink-0"><LogOut className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function MobileNav({ tab, setTab }) {
  const nav = useNav();
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900 flex items-center justify-around py-2 z-10">
      {nav.map((n) => {
        const Icon = n.icon;
        const active = tab === n.id;
        return (
          <button key={n.id} onClick={() => setTab(n.id)} className="flex flex-col items-center gap-0.5 px-2 py-1">
            <Icon className={`h-5 w-5 ${active ? "text-indigo-400" : "text-slate-500"}`} />
            <span className={`text-xs ${active ? "text-indigo-400" : "text-slate-500"}`}>{n.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function RightRail({ posts, onOpenProfile }) {
  const { t, dark } = useApp();
  const topAuthors = [...new Map(posts.map((p) => [p.author.name, p.author])).values()].slice(0, 4);
  return (
    <aside className="hidden lg:block w-72 shrink-0 p-4 pt-5">
      <div className={`border rounded-xl p-4 ${cx.surface(dark)}`}>
        <p className={`text-xs font-mono uppercase tracking-wide mb-3 flex items-center gap-1.5 ${cx.faint(dark)}`}>
          <TrendingUp className="h-3.5 w-3.5" /> {t("search_trending")}
        </p>
        <div className="flex flex-wrap gap-2">
          {TRENDING.slice(0, 6).map((tag) => (
            <span key={tag} className="flex items-center gap-0.5 text-xs font-mono text-indigo-500"><Hash className="h-3 w-3" />{tag}</span>
          ))}
        </div>
      </div>

      <div className={`border rounded-xl p-4 mt-4 ${cx.surface(dark)}`}>
        <p className={`text-xs font-mono uppercase tracking-wide mb-3 flex items-center gap-1.5 ${cx.faint(dark)}`}>
          <Users className="h-3.5 w-3.5" /> {t("nav_profile")}
        </p>
        <div className="space-y-3">
          {topAuthors.map((a) => (
            <button key={a.name} onClick={() => onOpenProfile(a.name)} className={`flex items-center gap-2.5 w-full text-left rounded-lg p-1 -m-1 ${cx.hover(dark)}`}>
              <Avatar name={a.name} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{a.name}</p>
                <p className={`text-xs truncate ${cx.faint(dark)}`}>{a.place}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ---------------------------- app ---------------------------- */

const SESSION_KEY = "celiann-session";

export default function App() {
  const [checking, setChecking] = useState(true);
  const [stage, setStage] = useState("auth");
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("feed");
  const [profileSubject, setProfileSubject] = useState(null);
  const [following, setFollowing] = useState([]);
  const [posts, setPosts] = useState(INITIAL_POSTS.map((p) => ({ ...p, seed: true })));
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [activeConv, setActiveConv] = useState(null);
  const [projects, setProjects] = useState(INITIAL_PROJECTS.map((p) => ({ ...p, seed: true })));
  const [activeProject, setActiveProject] = useState(null);
  const [stories, setStories] = useState(INITIAL_STORIES);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const seededCollabNotif = useRef(false);

  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("es");
  const [notifs, setNotifs] = useState({ collab: true, messages: true, mentions: false });

  // Local UI preferences only (theme, language, notification toggles) — loaded once.
  useEffect(() => {
    const p = prefsStorage.load();
    if (typeof p.dark === "boolean") setDark(p.dark);
    if (p.lang) setLang(p.lang);
    if (p.notifs) setNotifs(p.notifs);
  }, []);
  useEffect(() => {
    prefsStorage.save({ dark, lang, notifs });
  }, [dark, lang, notifs]);

  // Real Firebase session: fires immediately with the restored user on reload, or null if logged out.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, "users", fbUser.uid));
          if (snap.exists()) {
            setUser({ uid: fbUser.uid, ...snap.data() });
            setStage("app");
          } else {
            setUser({ uid: fbUser.uid, email: fbUser.email || "" });
            setStage("onboarding");
          }
        } catch (e) {
          setUser({ uid: fbUser.uid, email: fbUser.email || "" });
          setStage("onboarding");
        }
      } else {
        setUser(null);
        setStage("auth");
        setTab("feed");
        setProfileSubject(null);
        setNotifications([]);
      }
      setChecking(false);
    });
    return unsub;
  }, []);

  // Live shared posts, blended with local demo content.
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => setPosts([...snap.docs.map((d) => ({ id: d.id, ...d.data(), seed: false })), ...INITIAL_POSTS.map((p) => ({ ...p, seed: true }))]),
      () => setPosts(INITIAL_POSTS.map((p) => ({ ...p, seed: true })))
    );
    return unsub;
  }, [user?.uid]);

  // Live shared group projects, blended with the local demo project.
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      collection(db, "projects"),
      (snap) => setProjects([...snap.docs.map((d) => ({ id: d.id, ...d.data(), seed: false })), ...INITIAL_PROJECTS.map((p) => ({ ...p, seed: true }))]),
      () => setProjects(INITIAL_PROJECTS.map((p) => ({ ...p, seed: true })))
    );
    return unsub;
  }, [user?.uid]);

  // Live "who I follow", shared across devices.
  useEffect(() => {
    if (!user?.uid) { setFollowing([]); return; }
    const unsub = onSnapshot(
      doc(db, "following", user.uid),
      (snap) => setFollowing(snap.exists() ? (snap.data().names || []) : []),
      () => setFollowing([])
    );
    return unsub;
  }, [user?.uid]);

  // One sample "new collaboration" notification, once per session, so the feature is visible even for a fresh account.
  useEffect(() => {
    if (stage !== "app" || !user || seededCollabNotif.current) return;
    seededCollabNotif.current = true;
    setTimeout(() => {
      const others = Object.keys(AUTHOR_PROFILES).filter((n) => n !== user.name);
      const name = others[Math.floor(Math.random() * others.length)];
      pushNotification("collab", tf(t, "notif_collab_template", { name }));
    }, 3000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, user]);

  function t(key) {
    return (STRINGS[lang] || STRINGS.es)[key] || (STRINGS.es[key] ?? key);
  }
  function pushNotification(type, text, action) {
    if (notifs[type] === false) return;
    setNotifications((prev) => [{ id: `n${Date.now()}${Math.random()}`, text, read: false, action }, ...prev]);
  }
  function handleOpenChat(name) {
    const conv = conversations.find((c) => c.person.name === name);
    setTab("chat");
    setActiveConv(conv ? conv.id : conversations[0].id);
  }
  function handleOpenProfile(name) {
    setProfileSubject(name === user?.name ? null : name);
    setTab("profile");
  }

  // Writes user profile changes to Firestore too — pass this in place of the raw setUser everywhere in the tree.
  function updateUser(updaterOrValue) {
    setUser((prev) => {
      const next = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
      if (next?.uid) setDoc(doc(db, "users", next.uid), next, { merge: true }).catch(() => {});
      return next;
    });
  }
  // Writes the following list to Firestore too — pass this in place of the raw setFollowing everywhere in the tree.
  function updateFollowing(updaterOrValue) {
    setFollowing((prev) => {
      const next = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
      if (user?.uid) setDoc(doc(db, "following", user.uid), { names: next }, { merge: true }).catch(() => {});
      return next;
    });
  }
  // Local-only edits for demo/seed projects; real Firestore writes (shared with everyone) for real ones.
  function updateProjectDoc(project, fn) {
    const updated = fn(project);
    setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
    if (!project.seed) setDoc(doc(db, "projects", project.id), updated).catch(() => {});
  }
  async function handleAddComment(postId, text) {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const comment = { id: `c${Date.now()}`, author: user.name, text };
    if (post.seed) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)));
    } else {
      try { await updateDoc(doc(db, "posts", postId), { comments: arrayUnion(comment) }); }
      catch (e) { setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p))); }
    }
  }
  async function handleCreatePost(post) {
    const { id, ...rest } = post;
    try {
      const ref = await addDoc(collection(db, "posts"), { ...rest, authorUid: user.uid, createdAt: new Date().toISOString() });
      setTimeout(async () => {
        const others = Object.keys(AUTHOR_PROFILES).filter((n) => n !== user.name);
        const name = others[Math.floor(Math.random() * others.length)];
        const commentTexts = ["¡Me encanta esta idea!", "Cuenta conmigo si necesitas ayuda.", "Justo lo que estaba buscando, te escribo."];
        const text = commentTexts[Math.floor(Math.random() * commentTexts.length)];
        try { await updateDoc(ref, { comments: arrayUnion({ id: `c${Date.now()}`, author: name, text }) }); } catch (e) {}
        pushNotification("mentions", tf(t, "notif_comment_template", { name }));
      }, 5000);
    } catch (e) {
      setPosts((prev) => [{ ...post, seed: false }, ...prev]);
    }
  }
  function handleOpenNotif(n) {
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setShowNotifs(false);
    n.action?.();
  }
  function handleNav(id) {
    setTab(id);
    if (id === "profile") setProfileSubject(null);
  }
  function handleLogout() {
    signOut(auth).catch(() => {});
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Logo />
      </div>
    );
  }

  return (
    <AppCtx.Provider value={{ dark, setDark, lang, setLang, t, notifs, setNotifs }}>
      <div className={`min-h-screen font-sans ${cx.page(dark)}`}>
        <style>{`
          @keyframes eq { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
          .eq-bar { animation: eq 1s ease-in-out infinite; transform-origin: bottom; }
          .chat-shell { height: calc(100vh - 4rem); }
          @media (min-width: 768px) { .chat-shell { height: 100vh; } }
          .story-track { background-color: rgba(148,163,184,0.4); }
          .story-fill { background-color: #fff; animation-name: storyfill; animation-timing-function: linear; animation-fill-mode: forwards; }
          @keyframes storyfill { from { width: 0%; } to { width: 100%; } }
          .overlay-dim { background-color: rgba(15,23,42,0.6); }
          .overlay-strong { background-color: rgba(0,0,0,0.9); }
        `}</style>

        {stage === "auth" && <AuthScreen />}
        {stage === "onboarding" && (
          <OnboardingScreen email={user?.email || ""} onDone={(u) => {
            const profile = { ...u, uid: user.uid, email: user.email || "" };
            setDoc(doc(db, "users", user.uid), profile).catch(() => {});
            setUser(profile);
            setStage("suggestions");
          }} />
        )}
        {stage === "suggestions" && (
          <SuggestionsScreen user={user} following={following} setFollowing={updateFollowing} onContinue={() => setStage("app")} />
        )}

        {stage === "app" && user && (
          <>
            <Sidebar tab={tab} setTab={handleNav} user={user} onLogout={handleLogout} notifications={notifications} onOpenNotifs={() => setShowNotifs(true)} />
            <MobileNav tab={tab} setTab={handleNav} />
            <div className="md:pl-60 pb-16 md:pb-0">
              <MobileTopBar notifications={notifications} onOpenNotifs={() => setShowNotifs(true)} />
              <div className="flex max-w-6xl mx-auto">
                <main className="flex-1 min-w-0">
                  {tab === "feed" && (
                    <FeedView user={user} posts={posts} onCreatePost={handleCreatePost} onOpenChat={handleOpenChat} onOpenProfile={handleOpenProfile} onAddComment={handleAddComment}
                      stories={stories} setStories={setStories} viewerIndex={viewerIndex} setViewerIndex={setViewerIndex} />
                  )}
                  {tab === "search" && <SearchView posts={posts} onOpenChat={handleOpenChat} onOpenProfile={handleOpenProfile} onAddComment={handleAddComment} user={user} />}
                  {tab === "chat" && (
                    <ChatView conversations={conversations} setConversations={setConversations} activeId={activeConv} setActiveId={setActiveConv} onOpenProfile={handleOpenProfile}
                      onNotify={(text) => pushNotification("messages", text, () => { setTab("chat"); })} />
                  )}
                  {tab === "projects" && (
                    <ProjectsView projects={projects} onUpdateProject={updateProjectDoc} activeId={activeProject} setActiveId={setActiveProject} onOpenProfile={handleOpenProfile}
                      onNotify={(text) => pushNotification("messages", text, () => { setTab("projects"); })} />
                  )}
                  {tab === "profile" && (
                    <ProfileView subjectName={profileSubject} user={user} setUser={updateUser} following={following} setFollowing={updateFollowing}
                      onOpenChat={handleOpenChat} onBackToMe={() => setProfileSubject(null)} />
                  )}
                  {tab === "settings" && <SettingsView onLogout={handleLogout} />}
                </main>
                {(tab === "feed" || tab === "search") && <RightRail posts={posts} onOpenProfile={handleOpenProfile} />}
              </div>
            </div>
            {showNotifs && <NotificationsPanel notifications={notifications} onClose={() => setShowNotifs(false)} onClickItem={handleOpenNotif} />}
          </>
        )}
      </div>
    </AppCtx.Provider>
  );
}
