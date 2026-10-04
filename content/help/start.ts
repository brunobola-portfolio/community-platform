import { image } from './media';
import type { HelpTutorial } from './types';

export const START_TUTORIALS: HelpTutorial[] = [
    {
        id: 'primeiro-acesso',
        category: 'comecar',
        title: 'Primeiro acesso ao backoffice',
        summary: 'Entre com os dados que recebeu e fique com uma palavra-passe só sua.',
        minutes: 2,
        audience: 'direcao',
        tab: 'dashboard',
        featured: true,
        keywords: ['entrar', 'login', 'reservado', 'acesso reservado', 'palavra-passe temporária', 'primeira vez'],
        steps: [
            { text: 'Abra o site da {siteName} e carregue em "Reservado", no topo. No telemóvel, abra o menu e escolha "Acesso Reservado".' },
            { text: 'Escreva o email e a palavra-passe temporária que lhe enviaram e carregue em "Entrar".', tip: 'Copie e cole a palavra-passe tal como veio na mensagem: maiúsculas e minúsculas contam.' },
            { text: 'Entra diretamente no backoffice, na página "Início".' },
            { text: 'Mude já a palavra-passe: no fundo do menu lateral, carregue em "Alterar palavra-passe".', warning: 'Enquanto não a mudar, quem tiver a mensagem com a palavra-passe temporária consegue entrar.' },
        ],
    },
    {
        id: 'mudar-palavra-passe',
        category: 'comecar',
        title: 'Mudar a palavra-passe',
        summary: 'Troque a palavra-passe sempre que quiser, sem pedir a ninguém.',
        minutes: 1,
        audience: 'direcao',
        featured: true,
        keywords: ['password', 'senha', 'alterar palavra-passe', 'segurança', 'conta'],
        steps: [
            { text: 'No fundo do menu lateral, carregue em "Alterar palavra-passe".' },
            { text: 'Escreva a palavra-passe atual.' },
            { text: 'Escreva a nova palavra-passe duas vezes: pelo menos 10 caracteres, com maiúsculas, minúsculas e um número.', tip: 'Uma frase curta que só você conhece é mais fácil de lembrar e mais segura, por exemplo "Sardinhas-em-Junho-24".' },
            { text: 'Carregue em "Guardar". As outras sessões abertas com a sua conta terminam.' },
        ],
    },
    {
        id: 'percorrer-painel',
        category: 'comecar',
        title: 'Uma volta pelo painel',
        summary: 'O que está em cada secção do menu e onde ver o que precisa de atenção.',
        minutes: 3,
        audience: 'direcao',
        tab: 'dashboard',
        featured: true,
        keywords: ['menu', 'início', 'dashboard', 'secções', 'onde fica', 'navegar', 'ver site'],
        media: [image('painel-inicio', 'Página Início do backoffice com os números do site e as inscrições por confirmar')],
        steps: [
            { text: 'Em "Início" vê os números do site, o gasto de IA do mês, as inscrições por confirmar e as últimas alterações feitas pela direção.' },
            { text: 'Em "Conteúdos" fica o que aparece no site: Eventos, Inscrições, Notícias, Membros, Parceiros, Galeria, História, Mensagens recebidas e Sócios & Quotas.', tip: 'O número amarelo ao lado de "Inscrições" diz quantas estão à espera de confirmação.' },
            { text: 'Em "Sistema" ficam Documentos, Avisos aos sócios, Categorias, Níveis de Parceria, Acessos, Assistente virtual e Definições.' },
            { text: 'Cada lista tem pesquisa (carregue na tecla / para ir direto a ela), filtros e as ações Duplicar, Editar e Apagar.' },
            { text: 'Use "Ver site", no canto superior direito, para abrir o site noutro separador e confirmar o resultado.' },
            { text: 'Em qualquer secção, o botão "Como funciona" abre a ajuda dessa secção. Todos os guias estão em "Ajuda", no fundo do menu.' },
        ],
    },
];
