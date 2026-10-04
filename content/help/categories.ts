import type { HelpCategory } from './types';

/** Order here is the order of the category cards. */
export const HELP_CATEGORIES: HelpCategory[] = [
    { id: 'comecar', title: 'Começar', description: 'Primeiro acesso, palavra-passe e uma volta pelo painel.', icon: 'rocket', audience: 'direcao' },
    { id: 'eventos', title: 'Eventos e inscrições', description: 'Publicar a agenda, receber inscrições e levar a lista para a porta.', icon: 'calendar', audience: 'direcao' },
    { id: 'noticias', title: 'Notícias', description: 'Escrever, ilustrar e publicar notícias no site.', icon: 'newspaper', audience: 'direcao' },
    { id: 'ia', title: 'Criar com IA', description: 'Rascunhos e cartazes feitos a partir de duas linhas de texto.', icon: 'sparkles', audience: 'direcao' },
    { id: 'equipa', title: 'Equipa e parceiros', description: 'Corpos sociais, parceiros, níveis de parceria e mensagens recebidas.', icon: 'users', audience: 'direcao' },
    { id: 'galeria', title: 'Galeria', description: 'Álbuns, várias fotos de uma vez, legendas, ordem e capa.', icon: 'image', audience: 'direcao' },
    { id: 'socios', title: 'Sócios e quotas', description: 'Registo de sócios, quotas, documentos e avisos.', icon: 'wallet', audience: 'direcao' },
    { id: 'acessos', title: 'Acessos', description: 'Quem entra no site, quem o gere e como repor uma palavra-passe.', icon: 'key', audience: 'direcao' },
    { id: 'marca', title: 'Marca e definições', description: 'Nome, textos, cor, letra, contactos e pagamentos.', icon: 'palette', audience: 'direcao' },
    { id: 'assistente', title: 'Assistente virtual', description: 'O chat do site, o motor de imagem, os custos e os limites.', icon: 'bot', audience: 'direcao' },
    { id: 'suporte', title: 'Quando algo corre mal', description: 'Problemas comuns, saber se o site está atualizado e a quem pedir ajuda.', icon: 'life-buoy', audience: 'direcao' },
    { id: 'boas-praticas', title: 'Boas práticas', description: 'Imagens leves, partilhas no WhatsApp e dados pessoais.', icon: 'shield', audience: 'direcao' },
    { id: 'inscricoes-publico', title: 'Inscrições em eventos', description: 'Inscrever-se num evento, com ou sem conta, e o que acontece a seguir.', icon: 'ticket', audience: 'socio' },
    { id: 'area-socio', title: 'Área de sócio', description: 'Cartão, quotas, pagamento, documentos e avisos.', icon: 'id-card', audience: 'socio' },
    { id: 'conta', title: 'Conta e contactos', description: 'Entrar, mudar ou recuperar a palavra-passe e falar com a direção.', icon: 'user', audience: 'socio' },
];
