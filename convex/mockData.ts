// Copied from mockService.ts for seeding purposes
export const INITIAL_SPONSOR_TIERS = [
    { name: 'Visionário (Platina)', price: '500€ / ano', order: 1, benefits: ['Logótipo em destaque na Homepage', 'Placa de Agradecimento no Pavilhão', 'Menção em todos os eventos', '4 Entradas Livres', 'Post exclusivo nas redes sociais'] },
    { name: 'Benemérito (Ouro)', price: '250€ / ano', order: 2, benefits: ['Logótipo na secção de parceiros', 'Menção nas redes sociais', 'Certificado de Parceiro', '2 Entradas Livres'] },
    { name: 'Apoiante (Prata)', price: '100€ / ano', order: 3, benefits: ['Logótipo na página de Parceiros', 'Menção no relatório anual'] },
    { name: 'Institucional', price: 'Apoio Logístico', order: 4, benefits: ['Parceria estratégica', 'Co-organização de eventos'] }
];

export const INITIAL_CATEGORIES = [
    { id: 1, name: "Institucional", slug: "institucional", color: "bg-slate-500", createdAt: new Date().toISOString() },
    { id: 2, name: "Eventos", slug: "eventos", color: "bg-brand-500", createdAt: new Date().toISOString() },
    { id: 3, name: "Desporto", slug: "desporto", color: "bg-green-500", createdAt: new Date().toISOString() },
    { id: 4, name: "Solidariedade", slug: "solidariedade", color: "bg-pink-500", createdAt: new Date().toISOString() },
    { id: 5, name: "Cultura", slug: "cultura", color: "bg-purple-500", createdAt: new Date().toISOString() },
    { id: 6, name: "Lazer", slug: "lazer", color: "bg-orange-500", createdAt: new Date().toISOString() },
    { id: 7, name: "Formação", slug: "formacao", color: "bg-yellow-500", createdAt: new Date().toISOString() }
];

// Real supporters from the original ARCVA site (images/clients 1-4)
export const INITIAL_SPONSORS = [
    { id: 1, name: "Câmara Municipal de Alcanena", logoUrl: "/images/apoios/cm-alcanena.png", tier: "institutional", active: true, website: "https://www.cm-alcanena.pt" },
    { id: 2, name: "Junta de Freguesia de Minde", logoUrl: "/images/apoios/jf-minde.png", tier: "institutional", active: true, website: "https://www.jf-minde.pt" },
    { id: 3, name: "Filstone", logoUrl: "/images/apoios/filstone.png", tier: "gold", active: true, website: "https://www.filstone.com" },
    { id: 4, name: "Trigénius", logoUrl: "/images/apoios/trigenius.png", tier: "gold", active: true, website: "https://www.trigenius.pt" },
];

export const INITIAL_EVENTS = [
    {
        id: 1,
        title: "Caminhada de Natal 2025",
        slug: "caminhada-natal-2025",
        description: "Caminhada solidária para recolha de bens alimentares. Venha vestido a rigor e traga a família! O percurso terá cerca de 8km com grau de dificuldade baixo, percorrendo os trilhos da Serra de Aire.",
        date: "2025-12-21T09:00:00",
        location: "Ponto de Encontro: Sede da ARCVA",
        imageUrl: "https://images.unsplash.com/photo-1512413914633-b5043f4041ea?q=80&w=2000&auto=format&fit=crop",
        categoryId: 3,
        category: "Desporto",
        isHighlight: true,
        createdAt: "2025-10-01T10:00:00",
        updatedAt: "2025-10-01T10:00:00",
        isTournament: false,
        registrationOpen: true,
        status: 'published'
    },
    {
        id: 2,
        title: "Torneio de Sueca de Ano Novo 2026",
        slug: "torneio-sueca-2026",
        description: "Comece 2026 com o nosso tradicional torneio de Sueca. Reúna a sua dupla e venha disputar os prémios para os 3 primeiros classificados.",
        date: "2026-01-11T15:00:00",
        location: "Bar da Associação",
        imageUrl: "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=2000&auto=format&fit=crop",
        categoryId: 6,
        category: "Lazer",
        isHighlight: true,
        createdAt: "2025-11-05T10:00:00",
        updatedAt: "2025-11-05T10:00:00",
        isTournament: true,
        tournamentType: 'Sueca',
        registrationOpen: true,
        maxParticipants: 40,
        status: 'published'
    },
    {
        id: 3,
        title: "Torneio de Snooker 2026",
        slug: "torneio-snooker-2026",
        description: "Grande competição de Snooker agendada para Fevereiro de 2026. Venha mostrar a sua pontaria na nossa Sala de Jogos renovada.",
        date: "2026-02-15T20:00:00",
        location: "Sala de Jogos ARCVA",
        imageUrl: "https://images.unsplash.com/photo-1575224300306-1b8da36134ec?q=80&w=2000&auto=format&fit=crop",
        categoryId: 3,
        category: "Desporto",
        isHighlight: false,
        createdAt: "2025-12-05T10:00:00",
        updatedAt: "2025-12-05T10:00:00",
        isTournament: true,
        tournamentType: 'Snooker',
        registrationOpen: true,
        maxParticipants: 32,
        status: 'published'
    },
    {
        id: 4,
        title: "Workshop: Artesanato Local",
        slug: "workshop-artesanato-2026",
        description: "Aprenda as técnicas tradicionais de tecelagem e cestaria com os mestres da nossa terra. Material incluído.",
        date: "2026-03-22T15:00:00",
        location: "Sala de Convívio",
        imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop",
        categoryId: 5,
        category: "Cultura",
        isHighlight: false,
        createdAt: "2026-01-01T10:00:00",
        updatedAt: "2026-01-01T10:00:00",
        isTournament: false,
        registrationOpen: true,
        status: 'published'
    },
    {
        id: 5,
        title: "Torneio de Chinquilho de Primavera",
        slug: "torneio-chinquilho-2026",
        description: "Mantendo viva a tradição! O torneio de chinquilho (ou jogo da malha) realiza-se no recinto exterior. Um dia de sol, petiscos e boa disposição.",
        date: "2026-05-17T14:00:00",
        location: "Recinto Exterior",
        imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2000&auto=format&fit=crop",
        categoryId: 5,
        category: "Cultura",
        isHighlight: false,
        createdAt: "2026-03-01T10:00:00",
        updatedAt: "2026-03-01T10:00:00",
        isTournament: true,
        tournamentType: 'Chinquilho',
        registrationOpen: true,
        maxParticipants: 32,
        status: 'published'
    },
    {
        id: 6,
        title: "Festa de Verão ARCVA 2026",
        slug: "festa-verao-2026",
        description: "A grande festa anual regressa! Três dias de música, gastronomia e animação. O ponto alto do ano para a comunidade de Vale Alto.",
        date: "2026-07-15T19:00:00",
        location: "Largo do Pavilhão",
        imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2000&auto=format&fit=crop",
        categoryId: 2,
        category: "Eventos",
        isHighlight: true,
        createdAt: "2026-01-01T10:00:00",
        updatedAt: "2026-01-01T10:00:00",
        isTournament: false,
        registrationOpen: false,
        status: 'published'
    },
    {
        id: 7,
        title: "Torneio de Futsal 24H 2026",
        slug: "torneio-futsal-2026",
        description: "Um dos eventos mais vibrantes do ano! O Torneio de Futsal 24H no nosso pavilhão gimnodesportivo atrai equipas de toda a região.",
        date: "2026-09-05T10:00:00",
        location: "Pavilhão Gimnodesportivo ARCVA",
        imageUrl: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2000&auto=format&fit=crop",
        categoryId: 3,
        category: "Desporto",
        isHighlight: true,
        createdAt: "2026-06-05T10:00:00",
        updatedAt: "2026-06-05T10:00:00",
        isTournament: true,
        tournamentType: 'Futsal',
        registrationOpen: true,
        maxParticipants: 16,
        status: 'published'
    },
    {
        id: 8,
        title: "Magusto Comunitário 2025",
        slug: "magusto-2025",
        description: "Recordações do nosso último magusto. Castanhas, jeropiga e água-pé por conta da casa!",
        date: "2025-11-11T17:00:00",
        location: "Exterior do Pavilhão",
        imageUrl: "https://images.unsplash.com/photo-1575224300306-1b8da36134ec?q=80&w=2000&auto=format&fit=crop",
        categoryId: 2,
        category: "Eventos",
        isHighlight: false,
        createdAt: "2025-10-01T10:00:00",
        updatedAt: "2025-10-01T10:00:00",
        isTournament: false,
        registrationOpen: false,
        status: 'published'
    },
    {
        id: 9,
        title: "Aulas de Zumba",
        slug: "zumba-2026",
        description: "Mantenha-se em forma com as nossas aulas semanais de Zumba. Energia, música e movimento para todas as idades.",
        date: "2026-02-05T19:00:00",
        location: "Sala de Espelhos",
        imageUrl: "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?q=80&w=2000&auto=format&fit=crop",
        categoryId: 3,
        category: "Desporto",
        isHighlight: false,
        createdAt: "2026-01-10T10:00:00",
        updatedAt: "2026-01-10T10:00:00",
        isTournament: false,
        registrationOpen: true,
        status: 'published'
    },
    // Real ARCVA events confirmed via public sources (Facebook arcvalealto,
    // Instagram municipio_alcanena, agenda JF Minde, calendario APZC/FPP)
    {
        id: 11,
        title: "Torneio Amigável de Petanca",
        slug: "torneio-amigavel-petanca-2026",
        description: "O clube de petanca da ARCVA recebe mais um torneio amigável no campo de jogos da associação. Aberto a federados e curiosos, com convívio garantido ao longo do dia.",
        date: "2026-07-12T09:00:00",
        location: "Campo de Petanca da ARCVA, Vale Alto",
        imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2000&auto=format&fit=crop",
        categoryId: 3,
        category: "Desporto",
        isHighlight: true,
        createdAt: "2026-06-15T10:00:00",
        updatedAt: "2026-06-15T10:00:00",
        isTournament: true,
        tournamentType: 'Petanca',
        registrationOpen: true,
        maxParticipants: 32,
        status: 'published'
    },
    {
        id: 12,
        title: "1.º Torneio Oficial de Petanca do Concelho de Alcanena",
        slug: "torneio-aberto-petanca-2025",
        description: "A ARCVA acolheu o primeiro torneio oficial de petanca do concelho de Alcanena e da freguesia de Minde, integrado no calendário da APZC e da Federação Portuguesa de Petanca. Um marco para a nova vertente desportiva da associação.",
        date: "2025-11-02T09:00:00",
        location: "Campo de Petanca da ARCVA, Vale Alto",
        imageUrl: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2000&auto=format&fit=crop",
        categoryId: 3,
        category: "Desporto",
        isHighlight: false,
        createdAt: "2025-10-01T10:00:00",
        updatedAt: "2025-10-01T10:00:00",
        isTournament: true,
        tournamentType: 'Petanca',
        registrationOpen: false,
        status: 'published'
    },
    {
        id: 13,
        title: "2.º Torneio de Matraquilhos de Vale Alto",
        slug: "torneio-matraquilhos-2026",
        description: "A segunda edição do torneio de matraquilhos juntou duplas de todas as idades na sede da ARCVA. Divulgado pelo Município de Alcanena, o torneio confirmou-se como novo clássico do calendário da associação.",
        date: "2026-05-16T17:00:00",
        location: "Sede da ARCVA, Vale Alto",
        imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2000&auto=format&fit=crop",
        categoryId: 6,
        category: "Lazer",
        isHighlight: false,
        createdAt: "2026-04-20T10:00:00",
        updatedAt: "2026-04-20T10:00:00",
        isTournament: true,
        tournamentType: 'Outro',
        registrationOpen: false,
        status: 'published'
    },
    {
        id: 14,
        title: "4.º Torneio da Copa",
        slug: "torneio-copa-2026",
        description: "O tradicional torneio do jogo de cartas Copa regressou à sede da ARCVA para a sua quarta edição, com inscrições esgotadas e muita animação à mesa.",
        date: "2026-04-19T15:00:00",
        location: "Sede da ARCVA, Vale Alto",
        imageUrl: "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=2000&auto=format&fit=crop",
        categoryId: 6,
        category: "Lazer",
        isHighlight: false,
        createdAt: "2026-03-20T10:00:00",
        updatedAt: "2026-03-20T10:00:00",
        isTournament: true,
        tournamentType: 'Outro',
        registrationOpen: false,
        status: 'published'
    },
    {
        id: 15,
        title: "Caminhada Mensal ARCVA",
        slug: "caminhada-mensal-agosto-2026",
        description: "No primeiro domingo de cada mês, a ARCVA organiza uma caminhada pela natureza da Serra de Aire, antecedida de exercício físico de aquecimento. Aberta a sócios e à população — ponto de encontro no pavilhão.",
        date: "2026-08-02T08:30:00",
        location: "Partida do Pavilhão da ARCVA, Vale Alto",
        imageUrl: "https://images.unsplash.com/photo-1512413914633-b5043f4041ea?q=80&w=2000&auto=format&fit=crop",
        categoryId: 3,
        category: "Desporto",
        isHighlight: true,
        createdAt: "2026-07-01T10:00:00",
        updatedAt: "2026-07-01T10:00:00",
        isTournament: false,
        registrationOpen: false,
        status: 'published'
    },
    {
        id: 10,
        title: "Noite de Fados e Petiscos",
        slug: "noite-fados-2026",
        description: "Uma noite dedicada à alma portuguesa. Fadistas convidados e o melhor da nossa gastronomia regional.",
        date: "2026-04-18T20:30:00",
        location: "Salão Principal",
        imageUrl: "https://images.unsplash.com/photo-1516981879613-9f5da904015f?q=80&w=2000&auto=format&fit=crop",
        categoryId: 5,
        category: "Cultura",
        isHighlight: true,
        createdAt: "2026-02-01T10:00:00",
        updatedAt: "2026-02-01T10:00:00",
        isTournament: false,
        registrationOpen: true,
        status: 'published'
    }
];

export const INITIAL_REGISTRATIONS = [
    {
        id: "reg_1",
        eventId: 2,
        name: "Manuel Silva",
        email: "manuel@email.com",
        status: "confirmed", // mapped from approved
        timestamp: new Date("2025-11-20T10:00:00").getTime()
    },
    {
        id: "reg_2",
        eventId: 2,
        name: "Carlos Sousa",
        email: "carlos@email.com",
        status: "pending",
        timestamp: new Date("2025-11-25T14:30:00").getTime()
    }
];

export const INITIAL_POSTS = [
    {
        id: 1,
        title: "Obras de Melhoria no Pavilhão Concluídas",
        slug: "obras-pavilhao",
        excerpt: "É com orgulho que anunciamos a conclusão da renovação dos balneários e da iluminação LED do nosso recinto desportivo.",
        content: `<p class="mb-4 text-lg">A ARCVA investiu na modernização das suas infraestruturas para melhor servir os sócios e atletas.</p>...`,
        coverUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2000&auto=format&fit=crop",
        categoryId: 1,
        category: "Institucional",
        published: true,
        date: "2025-12-01T09:00:00",
        author: "Direção"
    },
    {
        id: 2,
        title: "Desenvolvimento Recreativo e Apoio à Comunidade",
        slug: "desenv-recreativo",
        excerpt: "A ARCVA reafirma o seu compromisso em apoiar o desenvolvimento recreativo da região, disponibilizando novos meios e espaços.",
        content: `<p class="mb-4 text-lg">Esta associação atua, essencialmente, na área recreativa, cultural e desportiva.</p>...`,
        coverUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2000&auto=format&fit=crop",
        categoryId: 1,
        category: "Institucional",
        published: true,
        date: "2025-11-15T09:00:00",
        author: "Direção"
    },
    {
        id: 3,
        title: "Sucesso no Torneio de Sueca",
        slug: "resumo-sueca",
        excerpt: "Mais de 30 equipas participaram na última edição do torneio, que encheu a nossa sala de convívio de animação.",
        content: `<p>Foi uma tarde memorável. Parabéns à dupla vencedora "Os Imparáveis" de Minde.</p>`,
        coverUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2000&auto=format&fit=crop",
        categoryId: 6,
        category: "Lazer",
        published: true,
        date: "2025-10-30T09:00:00",
        author: "Direção"
    },
    {
        id: 4,
        title: "Solidariedade Social",
        slug: "solidariedade",
        excerpt: "Apoiamos a solidariedade social através da angariação de fundos e realização de eventos de conotação social.",
        content: `<p>A nossa missão vai além do desporto e da cultura.</p>`,
        coverUrl: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2000&auto=format&fit=crop",
        categoryId: 4,
        category: "Solidariedade",
        published: true,
        date: "2025-10-12T18:00:00",
        author: "Direção"
    }
];

// Real board members with the original site photos (public/images/team)
export const INITIAL_MEMBERS = [
    // Assembleia Geral
    { id: 1, name: "João Conceição Marques", role: "Presidente", group: "Assembleia Geral", order: 1, photoUrl: "/images/team/01.jpg" },
    { id: 2, name: "Nancy Marques Rodrigues", role: "Secretário", group: "Assembleia Geral", order: 2, photoUrl: "/images/team/02.jpg" },
    { id: 3, name: "Bruno Silva Marques", role: "Secretário", group: "Assembleia Geral", order: 3, photoUrl: "/images/team/03.jpg" },
    // Direção
    { id: 4, name: "Paula Marques Rodrigues", role: "Presidente", group: "Direção", order: 1, photoUrl: "/images/team/04.jpg" },
    { id: 5, name: "Joni Gaspar Marques", role: "Secretário", group: "Direção", order: 2, photoUrl: "/images/team/05.jpg" },
    { id: 6, name: "Délia Marques Bento", role: "Tesoureiro", group: "Direção", order: 3, photoUrl: "/images/team/06.jpg" },
    { id: 7, name: "Paulo Jorge Santos", role: "Vogal", group: "Direção", order: 4, photoUrl: "/images/team/07.jpg" },
    { id: 8, name: "Jéssica Micaelo Antunes", role: "Vogal", group: "Direção", order: 5, photoUrl: "/images/team/08.jpg" },
    { id: 9, name: "Sérgio Pereira Santos", role: "Suplente", group: "Direção", order: 6, photoUrl: "/images/team/09.jpg" },
    { id: 10, name: "Amândio Formiga Gonçalves", role: "Suplente", group: "Direção", order: 7, photoUrl: "/images/team/10.jpg" },
    { id: 11, name: "Armando Simões Gonçalves", role: "Suplente", group: "Direção", order: 8, photoUrl: "/images/team/11.jpg" },
    // Conselho Fiscal
    { id: 12, name: "Mónica Silva Simões", role: "Presidente", group: "Conselho Fiscal", order: 1, photoUrl: "/images/team/12.jpg" },
    { id: 13, name: "Aurélio Gomes Vieira", role: "Secretário", group: "Conselho Fiscal", order: 2, photoUrl: "/images/team/13.jpg" },
    { id: 14, name: "Cedric Gonçalves Pinto", role: "Secretário", group: "Conselho Fiscal", order: 3, photoUrl: "/images/team/14.jpg" },
    { id: 15, name: "Thelma Bento Marques", role: "Suplente", group: "Conselho Fiscal", order: 4, photoUrl: "/images/team/15.jpg" },
    { id: 16, name: "João Manuel Gonçalves Santos", role: "Suplente", group: "Conselho Fiscal", order: 5, photoUrl: "/images/team/16.jpg" },
];

export const INITIAL_NOTIFICATIONS = [
    { title: "Assembleia Geral", message: "Convocatória para AG Extraordinária no dia 20 de Novembro.", type: 'Urgent', target: 'all' },
    { title: "Quotas 2026", message: "O pagamento de quotas para o novo ano já se encontra disponível.", type: 'Info', target: 'all' },
];

// Real event posters recovered from the original site (public/images/eventos)
export const INITIAL_ALBUMS = [
    {
        title: "Cartazes de Eventos ARCVA",
        date: "2023-10-01",
        coverUrl: "/images/eventos/evento-01.jpg",
        photos: [
            "/images/eventos/evento-01.jpg",
            "/images/eventos/evento-02.jpg",
            "/images/eventos/evento-03.jpg",
            "/images/eventos/evento-04.jpg",
            "/images/eventos/evento-05.jpg",
            "/images/eventos/evento-06.jpg",
            "/images/eventos/evento-07.jpg"
        ]
    },
    {
        title: "Torneios e Convívios",
        date: "2023-06-01",
        coverUrl: "/images/eventos/evento-08.jpg",
        photos: [
            "/images/eventos/evento-08.jpg",
            "/images/eventos/evento-09.jpg",
            "/images/eventos/evento-10.jpg",
            "/images/eventos/evento-11.jpg",
            "/images/eventos/evento-12.jpg",
            "/images/eventos/evento-13.jpg"
        ]
    }
];

export const INITIAL_ACTION_AREAS = [
    {
        title: "Recreativo",
        subtitle: "Lazer & Comunidade",
        description: "Combatemos o isolamento social através da criação de espaços e momentos de convívio.",
        longDescription: "A vertente recreativa é o coração pulsante da ARCVA. Acreditamos que uma comunidade forte se constrói através de laços humanos sólidos.",
        features: ["Gestão do Bar Associativo", "Sala de Jogos", "Jantares de Convívio"],
        externalImage: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=1000",
        iconName: "Users",
        order: 1
    },
    {
        title: "Cultural",
        subtitle: "Identidade & Evolução",
        description: "Apoiamos a divulgação e evolução do património cultural local.",
        longDescription: "A cultura é a memória de um povo. Na ARCVA, preservamos as tradições de Vale Alto e Minde.",
        features: ["Workshops Criativos", "Noites de Fado", "Preservação de Tradições"],
        externalImage: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000",
        iconName: "Lightbulb",
        order: 2
    },
    {
        title: "Desportivo",
        subtitle: "Saúde & Competição",
        description: "Dispomos de infraestruturas de excelência para potenciar o desenvolvimento desportivo.",
        longDescription: "Com o nosso Pavilhão Gimnodesportivo, somos uma referência desportiva na região.",
        features: ["Pavilhão Polivalente", "Torneios Anuais", "Ginástica Sénior"],
        externalImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000",
        iconName: "Target",
        order: 3
    },
    {
        title: "Solidariedade",
        subtitle: "Apoio Social Ativo",
        description: "A responsabilidade social é o nosso norte. Apoiamos a solidariedade local.",
        longDescription: "Não deixamos ninguém para trás. Trabalhamos em rede para garantir uma resposta digna.",
        features: ["Recolha de Alimentos", "Eventos de Angariação", "Apoio Logístico"],
        externalImage: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1000",
        iconName: "Heart",
        order: 4
    }
];

export const INITIAL_STATS = [
    { label: "Fundação", value: "1982", order: 1 },
    { label: "Sócios Ativos", value: "150+", order: 2 },
    { label: "Área Coberta", value: "1170m²", order: 3 },
    { label: "Voluntários", value: "100%", order: 4 }
];

export const INITIAL_DOCUMENTS = [
    { title: "Estatutos da ARCVA", category: 'Estatutos', url: "#", date: "2020-01-01", size: "2.4 MB" },
    { title: "Relatório de Contas 2024", category: 'Relatórios', url: "#", date: "2025-03-15", size: "1.1 MB" },
    { title: "Regulamento Interno", category: 'Regulamentos', url: "#", date: "2022-06-10", size: "0.8 MB" }
];
